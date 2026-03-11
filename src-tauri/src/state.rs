use std::path::PathBuf;
use std::sync::Arc;

use rime_core::backup::manager::BackupManager;
use rime_core::cache::manager::CacheManager;
use rime_core::download::manager::DownloadManager;
use rime_core::github::client::GitHubClient;
use rime_core::models::config::AppConfig;
use rime_core::registry::SchemeRegistry;
use tokio::sync::{Mutex, RwLock};

pub struct AppState {
    pub registry: SchemeRegistry,
    pub config: Arc<RwLock<AppConfig>>,
    pub github: Arc<RwLock<GitHubClient>>,
    pub download_mgr: Arc<DownloadManager>,
    pub backup_mgr: Arc<RwLock<BackupManager>>,
    pub cache_mgr: Arc<Mutex<CacheManager>>,
    pub app_data_dir: PathBuf,
}

impl AppState {
    pub fn new(app_data_dir: PathBuf) -> Self {
        // Load persisted config if exists
        let config_path = app_data_dir.join("config.json");
        let config: AppConfig = if config_path.exists() {
            std::fs::read_to_string(&config_path)
                .ok()
                .and_then(|s| serde_json::from_str(&s).ok())
                .unwrap_or_default()
        } else {
            AppConfig::default()
        };

        let github = GitHubClient::new(
            config.github_token.as_deref(),
            config.proxy_url.as_deref(),
        )
        .expect("Failed to create GitHub client");

        let download_client = reqwest::Client::builder()
            .user_agent("rime-updater/0.1.0")
            .build()
            .expect("Failed to create HTTP client");
        let download_mgr = DownloadManager::new(download_client);

        let backup_dir = config
            .backup_dir_override
            .clone()
            .unwrap_or_else(|| app_data_dir.join("backups"));
        let backup_mgr = BackupManager::new(backup_dir, config.max_backups);

        let cache_dir = app_data_dir.join("cache");
        let cache_mgr =
            CacheManager::new(cache_dir).expect("Failed to initialize cache manager");

        Self {
            registry: SchemeRegistry::new(),
            config: Arc::new(RwLock::new(config)),
            github: Arc::new(RwLock::new(github)),
            download_mgr: Arc::new(download_mgr),
            backup_mgr: Arc::new(RwLock::new(backup_mgr)),
            cache_mgr: Arc::new(Mutex::new(cache_mgr)),
            app_data_dir,
        }
    }

    /// Rebuild GitHubClient when config changes (token/proxy updated).
    pub fn rebuild_github_client(
        token: Option<&str>,
        proxy_url: Option<&str>,
    ) -> Result<GitHubClient, rime_core::error::RimeError> {
        GitHubClient::new(token, proxy_url)
    }

    /// Persist config to disk.
    pub fn save_config(app_data_dir: &std::path::Path, config: &AppConfig) -> std::io::Result<()> {
        std::fs::create_dir_all(app_data_dir)?;
        let config_path = app_data_dir.join("config.json");
        let json = serde_json::to_string_pretty(config)
            .map_err(|e| std::io::Error::new(std::io::ErrorKind::Other, e))?;
        std::fs::write(config_path, json)
    }
}
