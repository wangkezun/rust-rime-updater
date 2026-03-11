use rime_core::models::config::AppConfig;
use rime_core::rime::platform::{detect_rime_dir, RimeDirectoryInfo};
use tauri::State;

use crate::error::AppError;
use crate::state::AppState;

#[tauri::command]
pub async fn get_settings(state: State<'_, AppState>) -> Result<AppConfig, AppError> {
    let config = state.config.read().await;
    Ok(config.clone())
}

#[tauri::command]
pub async fn update_settings(
    state: State<'_, AppState>,
    config: AppConfig,
) -> Result<(), AppError> {
    // Rebuild GitHub client if token or proxy changed
    let needs_rebuild = {
        let current = state.config.read().await;
        current.github_token != config.github_token || current.proxy_url != config.proxy_url
    };

    if needs_rebuild {
        let new_client = AppState::rebuild_github_client(
            config.github_token.as_deref(),
            config.proxy_url.as_deref(),
        )?;
        let mut github = state.github.write().await;
        *github = new_client;
    }

    // Persist to disk
    AppState::save_config(&state.app_data_dir, &config)?;

    let mut current = state.config.write().await;
    *current = config;
    Ok(())
}

#[tauri::command]
pub fn get_rime_directory() -> Result<RimeDirectoryInfo, AppError> {
    let info = detect_rime_dir()?;
    Ok(info)
}
