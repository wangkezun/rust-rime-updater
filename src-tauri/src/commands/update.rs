use rime_core::models::backup::InstalledVersionInfo;
use rime_core::rime::platform::detect_rime_dir;
use rime_core::update::engine::{UpdateEngine, UpdateStatus};
use tauri::{Emitter, State, Window};
use tokio_util::sync::CancellationToken;

use crate::error::AppError;
use crate::state::AppState;

#[tauri::command]
pub async fn check_for_update(
    state: State<'_, AppState>,
) -> Result<UpdateStatus, AppError> {
    let config = state.config.read().await;
    let scheme_id = config
        .active_scheme_id
        .as_deref()
        .unwrap_or("wanxiang");

    let github = state.github.read().await;
    let scheme = state.registry.get_scheme(scheme_id)?;

    let release = github.get_latest_release(&scheme.github_repo).await?;

    // Read installed version from state file
    let installed_version = read_installed_version(&state.app_data_dir);
    let current_version = installed_version.as_ref().map(|v| v.version.as_str());

    if let Some(current) = current_version {
        if release.tag_name == current {
            return Ok(UpdateStatus::UpToDate);
        }
    }

    Ok(UpdateStatus::UpdateAvailable {
        current: current_version.map(String::from),
        latest: release.tag_name.clone(),
        release,
    })
}

#[tauri::command]
pub async fn install_update(
    state: State<'_, AppState>,
    window: Window,
    scheme_id: String,
    variant_id: String,
    version: String,
) -> Result<(), AppError> {
    let config = state.config.read().await.clone();

    // Determine Rime directory
    let rime_dir = config
        .rime_dir_override
        .clone()
        .unwrap_or_else(|| detect_rime_dir().map(|d| d.path.into()).unwrap_or_default());

    if !rime_dir.exists() {
        return Err(AppError {
            message: "Rime 用户目录不存在".to_string(),
        });
    }

    let scheme = state.registry.get_scheme(&scheme_id)?.clone();
    let github = state.github.read().await;
    let download_mgr = state.download_mgr.clone();
    let backup_mgr = state.backup_mgr.read().await;
    let mut cache_mgr = state.cache_mgr.lock().await;

    let mut engine = UpdateEngine::new(
        &state.registry,
        &github,
        &download_mgr,
        &backup_mgr,
        &mut cache_mgr,
    );

    let cancel_token = CancellationToken::new();
    let window_clone = window.clone();

    // Download the variant ZIP
    let zip_path = engine
        .download_variant(
            &scheme,
            &variant_id,
            &version,
            move |progress| {
                let _ = window_clone.emit("download-progress", &progress);
            },
            cancel_token,
        )
        .await?;

    // Read current installed version for backup metadata
    let installed_version = read_installed_version(&state.app_data_dir);

    // Install (with auto-backup if configured)
    engine.install_from_zip(
        &zip_path,
        &rime_dir,
        config.auto_backup,
        installed_version,
    )?;

    // Save new installed version state
    let new_version = InstalledVersionInfo {
        scheme_id: scheme_id.clone(),
        variant_id: variant_id.clone(),
        version: version.clone(),
    };
    save_installed_version(&state.app_data_dir, &new_version)?;

    let _ = window.emit("install-complete", &new_version);

    Ok(())
}

#[tauri::command]
pub async fn get_installed_version(
    state: State<'_, AppState>,
) -> Result<Option<InstalledVersionInfo>, AppError> {
    Ok(read_installed_version(&state.app_data_dir))
}

fn read_installed_version(
    app_data_dir: &std::path::Path,
) -> Option<InstalledVersionInfo> {
    let state_path = app_data_dir.join("state.json");
    if !state_path.exists() {
        return None;
    }
    std::fs::read_to_string(&state_path)
        .ok()
        .and_then(|s| serde_json::from_str(&s).ok())
}

fn save_installed_version(
    app_data_dir: &std::path::Path,
    version: &InstalledVersionInfo,
) -> Result<(), AppError> {
    let state_path = app_data_dir.join("state.json");
    let json = serde_json::to_string_pretty(version)
        .map_err(|e| AppError {
            message: e.to_string(),
        })?;
    std::fs::write(state_path, json)?;
    Ok(())
}
