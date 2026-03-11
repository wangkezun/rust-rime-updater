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
    let mut current = state.config.write().await;
    *current = config;
    Ok(())
}

#[tauri::command]
pub fn get_rime_directory() -> Result<RimeDirectoryInfo, AppError> {
    let info = detect_rime_dir()?;
    Ok(info)
}
