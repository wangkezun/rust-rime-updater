use serde::{Deserialize, Serialize};
use std::path::PathBuf;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppConfig {
    pub active_scheme_id: Option<String>,
    pub active_variant_id: Option<String>,
    pub rime_dir_override: Option<PathBuf>,
    pub backup_dir_override: Option<PathBuf>,
    pub max_backups: u32,
    pub auto_backup: bool,
    pub check_updates_on_launch: bool,
    pub github_token: Option<String>,
    pub proxy_url: Option<String>,
}

impl Default for AppConfig {
    fn default() -> Self {
        Self {
            active_scheme_id: None,
            active_variant_id: None,
            rime_dir_override: None,
            backup_dir_override: None,
            max_backups: 10,
            auto_backup: true,
            check_updates_on_launch: true,
            github_token: None,
            proxy_url: None,
        }
    }
}
