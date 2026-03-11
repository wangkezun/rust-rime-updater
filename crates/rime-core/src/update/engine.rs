use std::path::{Path, PathBuf};

use serde::Serialize;
use tokio_util::sync::CancellationToken;

use crate::backup::manager::BackupManager;
use crate::cache::manager::CacheManager;
use crate::download::manager::{DownloadManager, DownloadProgress};
use crate::error::RimeError;
use crate::github::client::GitHubClient;
use crate::models::backup::{BackupTrigger, InstalledVersionInfo};
use crate::models::release::ReleaseInfo;
use crate::models::scheme::SchemeDefinition;
use crate::registry::SchemeRegistry;
use crate::rime::installer;

#[derive(Debug, Clone, Serialize)]
#[serde(tag = "type")]
pub enum UpdateStatus {
    UpToDate,
    UpdateAvailable {
        current: Option<String>,
        latest: String,
        release: ReleaseInfo,
    },
}

pub struct UpdateEngine<'a> {
    registry: &'a SchemeRegistry,
    github: &'a GitHubClient,
    download_mgr: &'a DownloadManager,
    backup_mgr: &'a BackupManager,
    cache_mgr: &'a mut CacheManager,
}

impl<'a> UpdateEngine<'a> {
    pub fn new(
        registry: &'a SchemeRegistry,
        github: &'a GitHubClient,
        download_mgr: &'a DownloadManager,
        backup_mgr: &'a BackupManager,
        cache_mgr: &'a mut CacheManager,
    ) -> Self {
        Self {
            registry,
            github,
            download_mgr,
            backup_mgr,
            cache_mgr,
        }
    }

    pub async fn check_for_update(
        &self,
        scheme_id: &str,
        current_version: Option<&str>,
    ) -> Result<UpdateStatus, RimeError> {
        let scheme = self.registry.get_scheme(scheme_id)?;
        let release = self.github.get_latest_release(&scheme.github_repo).await?;

        if let Some(current) = current_version {
            if release.tag_name == current {
                return Ok(UpdateStatus::UpToDate);
            }
        }

        Ok(UpdateStatus::UpdateAvailable {
            current: current_version.map(String::from),
            latest: release.tag_name.clone(),
            release,
        })
    }

    pub async fn list_available_versions(
        &self,
        scheme_id: &str,
    ) -> Result<Vec<ReleaseInfo>, RimeError> {
        let scheme = self.registry.get_scheme(scheme_id)?;
        self.github.list_releases(&scheme.github_repo, 1, 20).await
    }

    pub async fn download_variant(
        &mut self,
        scheme: &SchemeDefinition,
        variant_id: &str,
        version: &str,
        progress_callback: impl Fn(DownloadProgress),
        cancel_token: CancellationToken,
    ) -> Result<PathBuf, RimeError> {
        let (_, variant) = self.registry.get_variant(&scheme.id, variant_id)?;

        // Check cache first
        if let Some(cached) = self.cache_mgr.get(&scheme.id, variant_id, version) {
            let cached_path = self
                .cache_mgr
                .get_download_path(&scheme.id, version, &variant.asset_pattern);
            if cached_path.exists() {
                tracing::info!(
                    "Using cached version {} (sha256: {})",
                    version,
                    cached.sha256
                );
                return Ok(cached_path);
            }
        }

        // Find the asset URL from the release
        let release = self
            .github
            .get_release_by_tag(&scheme.github_repo, version)
            .await?;

        let asset = release
            .assets
            .iter()
            .find(|a| a.name == variant.asset_pattern)
            .ok_or_else(|| RimeError::Custom(format!(
                "Asset '{}' not found in release {}",
                variant.asset_pattern, version
            )))?;

        let dest = self
            .cache_mgr
            .get_download_path(&scheme.id, version, &variant.asset_pattern);

        let (path, sha256) = self
            .download_mgr
            .download(&asset.download_url, &dest, progress_callback, cancel_token)
            .await?;

        self.cache_mgr
            .store(&scheme.id, variant_id, version, &path, &sha256)?;

        Ok(path)
    }

    pub async fn download_extra_resource(
        &self,
        resource_id: &str,
        scheme: &SchemeDefinition,
        progress_callback: impl Fn(DownloadProgress),
        cancel_token: CancellationToken,
        rime_dir: &Path,
    ) -> Result<PathBuf, RimeError> {
        let resource = scheme
            .extra_resources
            .iter()
            .find(|r| r.id == resource_id)
            .ok_or_else(|| {
                RimeError::Custom(format!("Extra resource '{}' not found", resource_id))
            })?;

        // Fetch the release to get the download URL
        let release = self
            .github
            .get_release_by_tag(&resource.github_repo, &resource.release_tag)
            .await?;

        let asset = release
            .assets
            .iter()
            .find(|a| a.name == resource.asset_name)
            .ok_or_else(|| RimeError::Custom(format!(
                "Asset '{}' not found in release {} of {}",
                resource.asset_name, resource.release_tag, resource.github_repo
            )))?;

        let dest_filename = resource
            .dest_filename
            .as_deref()
            .unwrap_or(&resource.asset_name);
        let dest = rime_dir.join(dest_filename);

        let (path, _sha256) = self
            .download_mgr
            .download(&asset.download_url, &dest, progress_callback, cancel_token)
            .await?;

        Ok(path)
    }

    pub fn install_from_zip(
        &self,
        zip_path: &Path,
        rime_dir: &Path,
        auto_backup: bool,
        installed_version: Option<InstalledVersionInfo>,
    ) -> Result<Vec<PathBuf>, RimeError> {
        if auto_backup {
            self.backup_mgr.create_backup(
                rime_dir,
                BackupTrigger::PreUpdate,
                installed_version,
                None,
            )?;
        }

        installer::install_from_zip(zip_path, rime_dir)
    }
}
