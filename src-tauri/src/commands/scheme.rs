use rime_core::models::scheme::SchemeDefinition;
use tauri::State;

use crate::error::AppError;
use crate::state::AppState;

#[tauri::command]
pub fn list_schemes(state: State<'_, AppState>) -> Result<Vec<SchemeDefinition>, AppError> {
    Ok(state.registry.list_schemes().to_vec())
}

#[tauri::command]
pub fn get_scheme_detail(
    state: State<'_, AppState>,
    scheme_id: String,
) -> Result<SchemeDefinition, AppError> {
    let scheme = state.registry.get_scheme(&scheme_id)?;
    Ok(scheme.clone())
}
