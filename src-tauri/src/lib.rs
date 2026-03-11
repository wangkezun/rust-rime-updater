mod commands;
mod error;
mod state;

use state::AppState;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .manage(AppState::new())
        .invoke_handler(tauri::generate_handler![
            commands::scheme::list_schemes,
            commands::scheme::get_scheme_detail,
            commands::settings::get_settings,
            commands::settings::update_settings,
            commands::settings::get_rime_directory,
            commands::update::check_for_update,
            commands::backup::list_backups,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
