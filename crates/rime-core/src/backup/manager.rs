use std::path::{Path, PathBuf};

use chrono::Utc;

use crate::error::RimeError;
use crate::models::backup::{
    BackupManifest, BackupMetadata, BackupTrigger, InstalledVersionInfo,
};

pub struct BackupManager {
    backup_dir: PathBuf,
    max_backups: u32,
}

impl BackupManager {
    pub fn new(backup_dir: PathBuf, max_backups: u32) -> Self {
        Self {
            backup_dir,
            max_backups,
        }
    }

    pub fn create_backup(
        &self,
        rime_dir: &Path,
        trigger: BackupTrigger,
        installed_version: Option<InstalledVersionInfo>,
        note: Option<String>,
    ) -> Result<BackupMetadata, RimeError> {
        let now = Utc::now();
        let trigger_str = match &trigger {
            BackupTrigger::Manual => "manual",
            BackupTrigger::PreUpdate => "pre-update",
            BackupTrigger::PreRollback => "pre-rollback",
        };
        let id = format!("{}-{trigger_str}", now.format("%Y%m%d-%H%M%S"));
        let backup_path = self.backup_dir.join(&id);
        let files_path = backup_path.join("files");
        std::fs::create_dir_all(&files_path)?;

        let mut backed_up_files = Vec::new();
        let mut total_size: u64 = 0;

        Self::copy_rime_files(rime_dir, &files_path, rime_dir, &mut backed_up_files, &mut total_size)?;

        let metadata = BackupMetadata {
            id,
            created_at: now,
            trigger,
            installed_version,
            size_bytes: total_size,
            file_count: backed_up_files.len(),
            note,
        };

        let manifest = BackupManifest {
            metadata: metadata.clone(),
            files: backed_up_files,
        };

        let manifest_path = backup_path.join("backup_manifest.json");
        let manifest_json = serde_json::to_string_pretty(&manifest)?;
        std::fs::write(manifest_path, manifest_json)?;

        if self.max_backups > 0 {
            self.prune_backups()?;
        }

        Ok(metadata)
    }

    pub fn list_backups(&self) -> Result<Vec<BackupMetadata>, RimeError> {
        if !self.backup_dir.exists() {
            return Ok(Vec::new());
        }

        let mut backups = Vec::new();
        for entry in std::fs::read_dir(&self.backup_dir)? {
            let entry = entry?;
            if !entry.file_type()?.is_dir() {
                continue;
            }
            let manifest_path = entry.path().join("backup_manifest.json");
            if manifest_path.exists() {
                let content = std::fs::read_to_string(&manifest_path)?;
                let manifest: BackupManifest = serde_json::from_str(&content)?;
                backups.push(manifest.metadata);
            }
        }

        backups.sort_by(|a, b| b.created_at.cmp(&a.created_at));
        Ok(backups)
    }

    pub fn restore_backup(&self, backup_id: &str, rime_dir: &Path) -> Result<(), RimeError> {
        let backup_path = self.backup_dir.join(backup_id);
        if !backup_path.exists() {
            return Err(RimeError::BackupNotFound(backup_id.to_string()));
        }

        let manifest_path = backup_path.join("backup_manifest.json");
        let content = std::fs::read_to_string(&manifest_path)?;
        let manifest: BackupManifest = serde_json::from_str(&content)?;

        let files_path = backup_path.join("files");
        for rel_path in &manifest.files {
            let src = files_path.join(rel_path);
            let dst = rime_dir.join(rel_path);
            if let Some(parent) = dst.parent() {
                std::fs::create_dir_all(parent)?;
            }
            if src.exists() {
                std::fs::copy(&src, &dst)?;
            }
        }

        Ok(())
    }

    pub fn delete_backup(&self, backup_id: &str) -> Result<(), RimeError> {
        let backup_path = self.backup_dir.join(backup_id);
        if !backup_path.exists() {
            return Err(RimeError::BackupNotFound(backup_id.to_string()));
        }
        std::fs::remove_dir_all(&backup_path)?;
        Ok(())
    }

    fn prune_backups(&self) -> Result<u32, RimeError> {
        let mut backups = self.list_backups()?;
        let mut pruned = 0;

        while backups.len() > self.max_backups as usize {
            if let Some(oldest) = backups.pop() {
                self.delete_backup(&oldest.id)?;
                pruned += 1;
            }
        }

        Ok(pruned)
    }

    fn copy_rime_files(
        source_dir: &Path,
        dest_dir: &Path,
        base_dir: &Path,
        files: &mut Vec<String>,
        total_size: &mut u64,
    ) -> Result<(), RimeError> {
        for entry in std::fs::read_dir(source_dir)? {
            let entry = entry?;
            let path = entry.path();
            let rel_path = path
                .strip_prefix(base_dir)
                .map_err(|e| RimeError::Custom(e.to_string()))?;

            // Skip build artifacts and user databases
            let name = entry.file_name();
            let name_str = name.to_string_lossy();
            if name_str.starts_with('.')
                || name_str == "build"
                || name_str == "trash"
                || name_str.ends_with(".userdb")
                || name_str == "installation.yaml"
                || name_str == "user.yaml"
            {
                continue;
            }

            if path.is_dir() {
                let dest_subdir = dest_dir.join(rel_path);
                std::fs::create_dir_all(&dest_subdir)?;
                Self::copy_rime_files(&path, dest_dir, base_dir, files, total_size)?;
            } else {
                let dest_file = dest_dir.join(rel_path);
                if let Some(parent) = dest_file.parent() {
                    std::fs::create_dir_all(parent)?;
                }
                let size = std::fs::metadata(&path)?.len();
                std::fs::copy(&path, &dest_file)?;
                files.push(rel_path.to_string_lossy().to_string());
                *total_size += size;
            }
        }
        Ok(())
    }
}
