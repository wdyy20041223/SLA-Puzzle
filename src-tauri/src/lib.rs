mod models;
mod commands;
use commands::*;
use std::sync::Mutex;

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("贵族的女儿： {}！", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_http::init())
        .manage(Mutex::new(AppState::default()))
        .invoke_handler(tauri::generate_handler![
            greet,
            create_puzzle,
            save_game,
            load_game,
            get_leaderboard,
            get_puzzles
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
