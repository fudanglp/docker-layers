use std::sync::OnceLock;

use anyhow::Result;

use crate::probe::{self, ProbeResult, RuntimeKind};

static CONFIG: OnceLock<AppConfig> = OnceLock::new();

#[derive(Debug)]
pub struct AppConfig {
    /// Detected container runtimes
    pub probe: ProbeResult,

    /// Output as JSON instead of human-readable text
    pub json: bool,
}

/// Probe runtimes and initialize the global config.
pub fn init_from_cli(json: bool, runtime_override: Option<String>) -> Result<()> {
    let mut probe_result = probe::probe()?;

    if let Some(ref name) = runtime_override {
        let kind = RuntimeKind::from_name(name).ok_or_else(|| {
            anyhow::anyhow!(
                "Unknown runtime '{}'. Valid options: docker, podman, containerd",
                name
            )
        })?;

        let idx = probe_result
            .runtimes
            .iter()
            .position(|rt| rt.kind.matches(&kind))
            .ok_or_else(|| {
                anyhow::anyhow!(
                    "Runtime '{}' was not detected on this system. Run `peel probe` to see available runtimes.",
                    name
                )
            })?;

        probe_result.default = Some(idx);
    }

    CONFIG
        .set(AppConfig {
            probe: probe_result,
            json,
        })
        .expect("config already initialized");
    Ok(())
}

/// Get the global config. Panics if not initialized.
pub fn get() -> &'static AppConfig {
    CONFIG.get().expect("config not initialized — call config::init_from_cli() first")
}
