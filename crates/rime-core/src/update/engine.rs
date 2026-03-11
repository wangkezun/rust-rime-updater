use serde::Serialize;

use crate::models::release::ReleaseInfo;

#[derive(Debug, Clone, Serialize)]
#[serde(tag = "type")]
pub enum UpdateStatus {
    UpToDate,
    UpdateAvailable {
        current: Option<String>,
        latest: String,
        release: ReleaseInfo,
    },
}
