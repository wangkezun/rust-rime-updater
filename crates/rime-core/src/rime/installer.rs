use std::fs;
use std::io;
use std::path::{Path, PathBuf};

use crate::error::RimeError;

/// Extract a scheme ZIP into the Rime user directory.
/// Returns the list of installed file paths.
pub fn install_from_zip(zip_path: &Path, rime_dir: &Path) -> Result<Vec<PathBuf>, RimeError> {
    let file = fs::File::open(zip_path)?;
    let mut archive = zip::ZipArchive::new(file)?;
    let mut installed = Vec::new();

    for i in 0..archive.len() {
        let mut entry = archive.by_index(i)?;
        let entry_path = entry.enclosed_name().ok_or_else(|| {
            RimeError::Custom(format!(
                "ZIP entry has unsafe path: {}",
                entry.name()
            ))
        })?;

        // Skip macOS resource forks and hidden files
        let path_str = entry_path.to_string_lossy();
        if path_str.starts_with("__MACOSX")
            || path_str.contains("/.DS_Store")
            || path_str == ".DS_Store"
        {
            continue;
        }

        let dest = rime_dir.join(&entry_path);

        // Safety: ensure destination is within rime_dir
        if !dest.starts_with(rime_dir) {
            return Err(RimeError::Custom(format!(
                "ZIP path traversal detected: {}",
                entry_path.display()
            )));
        }

        if entry.is_dir() {
            fs::create_dir_all(&dest)?;
        } else {
            if let Some(parent) = dest.parent() {
                fs::create_dir_all(parent)?;
            }
            let mut outfile = fs::File::create(&dest)?;
            io::copy(&mut entry, &mut outfile)?;
            installed.push(dest);
        }
    }

    tracing::info!("Installed {} files to {}", installed.len(), rime_dir.display());
    Ok(installed)
}

/// Preview the files in a ZIP without extracting.
pub fn preview_zip(zip_path: &Path) -> Result<Vec<String>, RimeError> {
    let file = fs::File::open(zip_path)?;
    let mut archive = zip::ZipArchive::new(file)?;
    let mut entries = Vec::new();

    for i in 0..archive.len() {
        let entry = archive.by_index(i)?;
        let path_str = entry.name().to_string();
        if path_str.starts_with("__MACOSX") || path_str.contains("/.DS_Store") {
            continue;
        }
        if !entry.is_dir() {
            entries.push(path_str);
        }
    }

    Ok(entries)
}
