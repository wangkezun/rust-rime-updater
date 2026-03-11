use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SchemeDefinition {
    pub id: String,
    pub name: String,
    pub description: String,
    pub github_repo: String,
    pub variants: Vec<SchemeVariant>,
    /// Additional downloadable resources (grammar models, prediction DBs, etc.)
    /// These may come from a different repo and have independent update cycles.
    #[serde(default)]
    pub extra_resources: Vec<ExtraResource>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SchemeVariant {
    pub id: String,
    pub name: String,
    pub asset_pattern: String,
    pub description: String,
}

/// A supplementary resource that can be independently managed.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExtraResource {
    pub id: String,
    pub name: String,
    pub description: String,
    pub category: ResourceCategory,
    /// GitHub repo hosting this resource (may differ from the scheme's repo)
    pub github_repo: String,
    /// The release tag to fetch assets from (e.g. "LTS" for rolling releases)
    pub release_tag: String,
    /// Filename of the asset in the release
    pub asset_name: String,
    /// Approximate size in bytes (for display purposes)
    pub approx_size_bytes: u64,
    /// Whether this resource is optional
    pub optional: bool,
    /// Destination filename in the Rime user directory (if different from asset_name)
    pub dest_filename: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub enum ResourceCategory {
    GrammarModel,
    PredictionDb,
}
