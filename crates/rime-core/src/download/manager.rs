use std::path::{Path, PathBuf};

use futures_util::StreamExt;
use reqwest::Client;
use sha2::{Digest, Sha256};
use tokio::io::AsyncWriteExt;
use tokio_util::sync::CancellationToken;

use crate::error::RimeError;

#[derive(Debug, Clone, serde::Serialize)]
pub struct DownloadProgress {
    pub downloaded_bytes: u64,
    pub total_bytes: Option<u64>,
    pub speed_bytes_per_sec: f64,
}

pub struct DownloadManager {
    client: Client,
}

impl DownloadManager {
    pub fn new(client: Client) -> Self {
        Self { client }
    }

    pub async fn download(
        &self,
        url: &str,
        dest: &Path,
        progress_callback: impl Fn(DownloadProgress),
        cancel_token: CancellationToken,
    ) -> Result<(PathBuf, String), RimeError> {
        if let Some(parent) = dest.parent() {
            tokio::fs::create_dir_all(parent).await?;
        }

        let resp = self.client.get(url).send().await?;
        if !resp.status().is_success() {
            return Err(RimeError::GitHubApi {
                status: resp.status().as_u16(),
                message: format!("Failed to download: {url}"),
            });
        }

        let total_bytes = resp.content_length();
        let mut stream = resp.bytes_stream();
        let mut file = tokio::fs::File::create(dest).await?;
        let mut hasher = Sha256::new();
        let mut downloaded: u64 = 0;
        let start = std::time::Instant::now();

        while let Some(chunk) = stream.next().await {
            if cancel_token.is_cancelled() {
                drop(file);
                let _ = tokio::fs::remove_file(dest).await;
                return Err(RimeError::Cancelled);
            }

            let chunk = chunk.map_err(RimeError::Network)?;
            file.write_all(&chunk).await?;
            hasher.update(&chunk);
            downloaded += chunk.len() as u64;

            let elapsed = start.elapsed().as_secs_f64();
            let speed = if elapsed > 0.0 {
                downloaded as f64 / elapsed
            } else {
                0.0
            };

            progress_callback(DownloadProgress {
                downloaded_bytes: downloaded,
                total_bytes,
                speed_bytes_per_sec: speed,
            });
        }

        file.flush().await?;
        let sha256 = hex::encode(hasher.finalize());

        Ok((dest.to_path_buf(), sha256))
    }
}
