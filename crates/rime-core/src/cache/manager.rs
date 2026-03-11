use std::path::{Path, PathBuf};

use chrono::Utc;

use crate::error::RimeError;
use crate::models::version::{CacheIndex, CachedVersion};

pub struct CacheManager {
    cache_dir: PathBuf,
    index: CacheIndex,
}

impl CacheManager {
    pub fn new(cache_dir: PathBuf) -> Result<Self, RimeError> {
        std::fs::create_dir_all(&cache_dir)?;
        let index_path = cache_dir.join("cache_index.json");
        let index = if index_path.exists() {
            let content = std::fs::read_to_string(&index_path)?;
            serde_json::from_str(&content)?
        } else {
            CacheIndex::default()
        };
        Ok(Self { cache_dir, index })
    }

    pub fn get_download_path(
        &self,
        scheme_id: &str,
        version: &str,
        asset_name: &str,
    ) -> PathBuf {
        self.cache_dir
            .join("downloads")
            .join(scheme_id)
            .join(version)
            .join(asset_name)
    }

    pub fn store(
        &mut self,
        scheme_id: &str,
        variant_id: &str,
        version: &str,
        zip_path: &Path,
        sha256: &str,
    ) -> Result<CachedVersion, RimeError> {
        let size = std::fs::metadata(zip_path)?.len();
        let rel_path = zip_path
            .strip_prefix(&self.cache_dir)
            .map_err(|e| RimeError::Custom(e.to_string()))?
            .to_string_lossy()
            .to_string();

        let cached = CachedVersion {
            scheme_id: scheme_id.to_string(),
            variant_id: variant_id.to_string(),
            version: version.to_string(),
            downloaded_at: Utc::now(),
            zip_path: rel_path,
            sha256: sha256.to_string(),
            size_bytes: size,
        };

        // Remove existing entry for the same scheme/variant/version
        self.index.versions.retain(|v| {
            !(v.scheme_id == scheme_id && v.variant_id == variant_id && v.version == version)
        });

        self.index.versions.push(cached.clone());
        self.save_index()?;

        Ok(cached)
    }

    pub fn get(
        &self,
        scheme_id: &str,
        variant_id: &str,
        version: &str,
    ) -> Option<&CachedVersion> {
        self.index.versions.iter().find(|v| {
            v.scheme_id == scheme_id && v.variant_id == variant_id && v.version == version
        })
    }

    pub fn list_versions(&self, scheme_id: &str) -> Vec<&CachedVersion> {
        self.index
            .versions
            .iter()
            .filter(|v| v.scheme_id == scheme_id)
            .collect()
    }

    pub fn total_size(&self) -> u64 {
        self.index.versions.iter().map(|v| v.size_bytes).sum()
    }

    pub fn save_index(&self) -> Result<(), RimeError> {
        let index_path = self.cache_dir.join("cache_index.json");
        let content = serde_json::to_string_pretty(&self.index)?;
        std::fs::write(index_path, content)?;
        Ok(())
    }
}
