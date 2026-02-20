use std::sync::OnceLock;

use crate::probe::ProbeResult;

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

/// Initialize the global config. Must be called once at startup.
pub fn init(config: AppConfig) {
    CONFIG.set(config).expect("config already initialized");
}

/// Get the global config. Panics if not initialized.
pub fn get() -> &'static AppConfig {
    CONFIG.get().expect("config not initialized — call config::init() first")
}
