use tauri::State;

use crate::error::AppError;
use crate::state::AppState;

#[tauri::command]
pub async fn check_for_update(state: State<'_, AppState>) -> Result<String, AppError> {
    let _config = state.config.read().await;
    // TODO: Implement in Phase 2
    Ok("Not implemented yet".to_string())
}
