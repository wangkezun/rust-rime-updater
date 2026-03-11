use reqwest::Client;

use crate::error::RimeError;
use crate::models::release::{AssetInfo, ReleaseInfo};

use super::types::{GitHubAsset, GitHubRelease};

pub struct GitHubClient {
    client: Client,
}

impl GitHubClient {
    pub fn new(token: Option<&str>, proxy_url: Option<&str>) -> Result<Self, RimeError> {
        let mut builder = Client::builder().user_agent("rime-updater/0.1.0");

        if let Some(proxy) = proxy_url {
            builder = builder.proxy(reqwest::Proxy::all(proxy)?);
        }

        if let Some(token) = token {
            let mut headers = reqwest::header::HeaderMap::new();
            let val = format!("Bearer {token}");
            headers.insert(
                reqwest::header::AUTHORIZATION,
                reqwest::header::HeaderValue::from_str(&val)
                    .map_err(|e| RimeError::Custom(e.to_string()))?,
            );
            builder = builder.default_headers(headers);
        }

        Ok(Self {
            client: builder.build()?,
        })
    }

    pub async fn get_latest_release(&self, repo: &str) -> Result<ReleaseInfo, RimeError> {
        let url = format!("https://api.github.com/repos/{repo}/releases/latest");
        let resp = self.client.get(&url).send().await?;
        Self::handle_response(resp).await
    }

    pub async fn list_releases(
        &self,
        repo: &str,
        page: u32,
        per_page: u32,
    ) -> Result<Vec<ReleaseInfo>, RimeError> {
        let url = format!(
            "https://api.github.com/repos/{repo}/releases?page={page}&per_page={per_page}"
        );
        let resp = self.client.get(&url).send().await?;

        if !resp.status().is_success() {
            return Err(Self::make_api_error(resp).await);
        }

        let releases: Vec<GitHubRelease> = resp.json().await?;
        Ok(releases.into_iter().map(Self::convert_release).collect())
    }

    pub async fn get_release_by_tag(
        &self,
        repo: &str,
        tag: &str,
    ) -> Result<ReleaseInfo, RimeError> {
        let url = format!("https://api.github.com/repos/{repo}/releases/tags/{tag}");
        let resp = self.client.get(&url).send().await?;
        Self::handle_response(resp).await
    }

    async fn handle_response(resp: reqwest::Response) -> Result<ReleaseInfo, RimeError> {
        if !resp.status().is_success() {
            return Err(Self::make_api_error(resp).await);
        }
        let release: GitHubRelease = resp.json().await?;
        Ok(Self::convert_release(release))
    }

    async fn make_api_error(resp: reqwest::Response) -> RimeError {
        let status = resp.status().as_u16();
        if status == 403 {
            if let Some(retry_after) = resp
                .headers()
                .get("retry-after")
                .and_then(|v| v.to_str().ok())
                .and_then(|v| v.parse::<u64>().ok())
            {
                return RimeError::RateLimited {
                    retry_after_secs: retry_after,
                };
            }
        }
        let message = resp
            .text()
            .await
            .unwrap_or_else(|_| "Unknown error".into());
        RimeError::GitHubApi { status, message }
    }

    fn convert_release(r: GitHubRelease) -> ReleaseInfo {
        let published_at = r
            .published_at
            .as_deref()
            .and_then(|s| chrono::DateTime::parse_from_rfc3339(s).ok())
            .map(|dt| dt.with_timezone(&chrono::Utc))
            .unwrap_or_else(chrono::Utc::now);

        ReleaseInfo {
            tag_name: r.tag_name,
            name: r.name.unwrap_or_default(),
            published_at,
            body: r.body.unwrap_or_default(),
            assets: r.assets.into_iter().map(Self::convert_asset).collect(),
        }
    }

    fn convert_asset(a: GitHubAsset) -> AssetInfo {
        AssetInfo {
            name: a.name,
            size: a.size,
            download_url: a.browser_download_url,
            content_type: a.content_type,
        }
    }
}
