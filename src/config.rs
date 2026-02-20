use std::sync::OnceLock;

use anyhow::Result;

use crate::probe::{self, ProbeResult};

static CONFIG: OnceLock<AppConfig> = OnceLock::new();

#[derive(Debug)]
pub struct AppConfig {
    /// Detected container runtimes
    pub probe: ProbeResult,

    /// Output as JSON instead of human-readable text
    pub json: bool,

    /// User-requested runtime override (e.g. --runtime docker)
    pub runtime_override: Option<String>,
}

/// Probe runtimes and initialize the global config.
pub fn init_from_cli(json: bool, runtime_override: Option<String>) -> Result<()> {
    let probe_result = probe::probe()?;
    CONFIG
        .set(AppConfig {
            probe: probe_result,
            json,
            runtime_override,
        })
        .expect("config already initialized");
    Ok(())
}

/// Get the global config. Panics if not initialized.
pub fn get() -> &'static AppConfig {
    CONFIG.get().expect("config not initialized — call config::init_from_cli() first")
}
