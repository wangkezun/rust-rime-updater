use std::sync::Arc;

use rime_core::models::config::AppConfig;
use rime_core::registry::SchemeRegistry;
use tokio::sync::RwLock;

pub struct AppState {
    pub registry: SchemeRegistry,
    pub config: Arc<RwLock<AppConfig>>,
}

impl AppState {
    pub fn new() -> Self {
        Self {
            registry: SchemeRegistry::new(),
            config: Arc::new(RwLock::new(AppConfig::default())),
        }
    }
}
