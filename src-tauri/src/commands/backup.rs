use tauri::State;

use crate::error::AppError;
use crate::state::AppState;

#[tauri::command]
pub async fn list_backups(state: State<'_, AppState>) -> Result<Vec<String>, AppError> {
    let _config = state.config.read().await;
    // TODO: Implement in Phase 3
    Ok(Vec::new())
}
