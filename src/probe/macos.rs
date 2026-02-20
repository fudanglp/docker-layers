use anyhow::Result;

use super::ProbeResult;

pub fn probe() -> Result<ProbeResult> {
    // TODO: macOS support — Docker Desktop runs in a VM,
    // so overlay2 direct access is not available.
    // Will need to use Docker API or `docker save`.
    Ok(ProbeResult {
        runtimes: Vec::new(),
        default: None,
    })
}
