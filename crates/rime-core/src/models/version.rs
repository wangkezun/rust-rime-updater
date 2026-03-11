use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CachedVersion {
    pub scheme_id: String,
    pub variant_id: String,
    pub version: String,
    pub downloaded_at: DateTime<Utc>,
    pub zip_path: String,
    pub sha256: String,
    pub size_bytes: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct CacheIndex {
    pub versions: Vec<CachedVersion>,
}
