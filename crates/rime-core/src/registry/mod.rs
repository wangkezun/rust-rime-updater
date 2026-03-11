pub mod wanxiang;

use crate::error::RimeError;
use crate::models::scheme::{SchemeDefinition, SchemeVariant};

pub struct SchemeRegistry {
    schemes: Vec<SchemeDefinition>,
}

impl SchemeRegistry {
    pub fn new() -> Self {
        let mut registry = Self {
            schemes: Vec::new(),
        };
        registry.register(wanxiang::wanxiang_scheme());
        registry
    }

    pub fn register(&mut self, scheme: SchemeDefinition) {
        self.schemes.push(scheme);
    }

    pub fn list_schemes(&self) -> &[SchemeDefinition] {
        &self.schemes
    }

    pub fn get_scheme(&self, id: &str) -> Result<&SchemeDefinition, RimeError> {
        self.schemes
            .iter()
            .find(|s| s.id == id)
            .ok_or_else(|| RimeError::SchemeNotFound(id.to_string()))
    }

    pub fn get_variant(
        &self,
        scheme_id: &str,
        variant_id: &str,
    ) -> Result<(&SchemeDefinition, &SchemeVariant), RimeError> {
        let scheme = self.get_scheme(scheme_id)?;
        let variant = scheme
            .variants
            .iter()
            .find(|v| v.id == variant_id)
            .ok_or_else(|| RimeError::VariantNotFound {
                scheme: scheme_id.to_string(),
                variant: variant_id.to_string(),
            })?;
        Ok((scheme, variant))
    }
}

impl Default for SchemeRegistry {
    fn default() -> Self {
        Self::new()
    }
}
