use serde::Deserialize;

#[derive(Debug, Deserialize)]
pub struct GitHubRelease {
    pub tag_name: String,
    pub name: Option<String>,
    pub published_at: Option<String>,
    pub body: Option<String>,
    pub assets: Vec<GitHubAsset>,
}

#[derive(Debug, Deserialize)]
pub struct GitHubAsset {
    pub name: String,
    pub size: u64,
    pub browser_download_url: String,
    pub content_type: String,
}
