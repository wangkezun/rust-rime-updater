use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BackupMetadata {
    pub id: String,
    pub created_at: DateTime<Utc>,
    pub trigger: BackupTrigger,
    pub installed_version: Option<InstalledVersionInfo>,
    pub size_bytes: u64,
    pub file_count: usize,
    pub note: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum BackupTrigger {
    Manual,
    PreUpdate,
    PreRollback,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InstalledVersionInfo {
    pub scheme_id: String,
    pub variant_id: String,
    pub version: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BackupManifest {
    pub metadata: BackupMetadata,
    pub files: Vec<String>,
}
