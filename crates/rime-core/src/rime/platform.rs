use std::path::PathBuf;

use crate::error::RimeError;

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub enum RimePlatform {
    Squirrel,
    Weasel,
    Fcitx5,
    IBus,
}

impl std::fmt::Display for RimePlatform {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            RimePlatform::Squirrel => write!(f, "鼠须管 (macOS)"),
            RimePlatform::Weasel => write!(f, "小狼毫 (Windows)"),
            RimePlatform::Fcitx5 => write!(f, "Fcitx5 (Linux)"),
            RimePlatform::IBus => write!(f, "IBus (Linux)"),
        }
    }
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct RimeDirectoryInfo {
    pub path: PathBuf,
    pub platform: RimePlatform,
}

pub fn detect_rime_dir() -> Result<RimeDirectoryInfo, RimeError> {
    let candidates = build_candidates();

    for (path, platform) in candidates {
        if path.exists() && path.is_dir() {
            return Ok(RimeDirectoryInfo { path, platform });
        }
    }

    Err(RimeError::RimeDirNotFound)
}

fn build_candidates() -> Vec<(PathBuf, RimePlatform)> {
    let mut candidates = Vec::new();
    let home = dirs::home_dir();

    #[cfg(target_os = "macos")]
    if let Some(ref home) = home {
        candidates.push((
            home.join("Library/Rime"),
            RimePlatform::Squirrel,
        ));
    }

    #[cfg(target_os = "windows")]
    if let Some(appdata) = std::env::var_os("APPDATA") {
        candidates.push((
            PathBuf::from(appdata).join("Rime"),
            RimePlatform::Weasel,
        ));
    }

    #[cfg(target_os = "linux")]
    if let Some(ref home) = home {
        candidates.push((
            home.join(".local/share/fcitx5/rime"),
            RimePlatform::Fcitx5,
        ));
        candidates.push((
            home.join(".config/ibus/rime"),
            RimePlatform::IBus,
        ));
    }

    candidates
}
