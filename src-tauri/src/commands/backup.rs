use rime_core::models::backup::{BackupMetadata, BackupTrigger};
use rime_core::rime::platform::detect_rime_dir;
use tauri::State;

use crate::error::AppError;
use crate::state::AppState;

#[tauri::command]
pub async fn list_backups(state: State<'_, AppState>) -> Result<Vec<BackupMetadata>, AppError> {
    let backup_mgr = state.backup_mgr.read().await;
    let backups = backup_mgr.list_backups()?;
    Ok(backups)
}

#[tauri::command]
pub async fn create_backup(
    state: State<'_, AppState>,
    note: Option<String>,
) -> Result<BackupMetadata, AppError> {
    let config = state.config.read().await;

    let rime_dir = config
        .rime_dir_override
        .clone()
        .unwrap_or_else(|| detect_rime_dir().map(|d| d.path.into()).unwrap_or_default());

    if !rime_dir.exists() {
        return Err(AppError {
            message: "Rime 用户目录不存在".to_string(),
        });
    }

    // Read installed version for metadata
    let installed_version = {
        let state_path = state.app_data_dir.join("state.json");
        if state_path.exists() {
            std::fs::read_to_string(&state_path)
                .ok()
                .and_then(|s| serde_json::from_str(&s).ok())
        } else {
            None
        }
    };

    let backup_mgr = state.backup_mgr.read().await;
    let metadata = backup_mgr.create_backup(
        &rime_dir,
        BackupTrigger::Manual,
        installed_version,
        note,
    )?;

    Ok(metadata)
}

#[tauri::command]
pub async fn restore_backup(
    state: State<'_, AppState>,
    backup_id: String,
) -> Result<(), AppError> {
    let config = state.config.read().await;

    let rime_dir = config
        .rime_dir_override
        .clone()
        .unwrap_or_else(|| detect_rime_dir().map(|d| d.path.into()).unwrap_or_default());

    if !rime_dir.exists() {
        return Err(AppError {
            message: "Rime 用户目录不存在".to_string(),
        });
    }

    let backup_mgr = state.backup_mgr.read().await;

    // Create a pre-rollback backup first for safety
    if config.auto_backup {
        let installed_version = {
            let state_path = state.app_data_dir.join("state.json");
            if state_path.exists() {
                std::fs::read_to_string(&state_path)
                    .ok()
                    .and_then(|s| serde_json::from_str(&s).ok())
            } else {
                None
            }
        };
        backup_mgr.create_backup(
            &rime_dir,
            BackupTrigger::PreRollback,
            installed_version,
            None,
        )?;
    }

    backup_mgr.restore_backup(&backup_id, &rime_dir)?;

    Ok(())
}

#[tauri::command]
pub async fn delete_backup(
    state: State<'_, AppState>,
    backup_id: String,
) -> Result<(), AppError> {
    let backup_mgr = state.backup_mgr.read().await;
    backup_mgr.delete_backup(&backup_id)?;
    Ok(())
}
