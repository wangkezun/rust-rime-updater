use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ReleaseInfo {
    pub tag_name: String,
    pub name: String,
    pub published_at: DateTime<Utc>,
    pub body: String,
    pub assets: Vec<AssetInfo>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AssetInfo {
    pub name: String,
    pub size: u64,
    pub download_url: String,
    pub content_type: String,
}
