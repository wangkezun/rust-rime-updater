use thiserror::Error;

#[derive(Debug, Error)]
pub enum RimeError {
    #[error("Network error: {0}")]
    Network(#[from] reqwest::Error),

    #[error("GitHub API error: {message} (status: {status})")]
    GitHubApi { status: u16, message: String },

    #[error("Rate limited by GitHub API, retry after {retry_after_secs}s")]
    RateLimited { retry_after_secs: u64 },

    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),

    #[error("ZIP extraction error: {0}")]
    Zip(#[from] zip::result::ZipError),

    #[error("Serialization error: {0}")]
    Serialization(#[from] serde_json::Error),

    #[error("Scheme '{0}' not found in registry")]
    SchemeNotFound(String),

    #[error("Variant '{variant}' not found in scheme '{scheme}'")]
    VariantNotFound { scheme: String, variant: String },

    #[error("No Rime directory found for this platform")]
    RimeDirNotFound,

    #[error("Backup '{0}' not found")]
    BackupNotFound(String),

    #[error("Download was cancelled")]
    Cancelled,

    #[error("Integrity check failed: expected {expected}, got {actual}")]
    IntegrityError { expected: String, actual: String },

    #[error("Version '{0}' not found in cache")]
    CacheNotFound(String),

    #[error("{0}")]
    Custom(String),
}

impl serde::Serialize for RimeError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        serializer.serialize_str(&self.to_string())
    }
}
