use serde::Serialize;

#[derive(Debug, Serialize)]
pub struct AppError {
    pub message: String,
}

impl From<rime_core::error::RimeError> for AppError {
    fn from(err: rime_core::error::RimeError) -> Self {
        Self {
            message: err.to_string(),
        }
    }
}

impl From<std::io::Error> for AppError {
    fn from(err: std::io::Error) -> Self {
        Self {
            message: err.to_string(),
        }
    }
}
