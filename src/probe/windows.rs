use anyhow::Result;

use super::ProbeResult;

pub fn probe() -> Result<ProbeResult> {
    // TODO: Windows support — Docker Desktop uses WSL2 or Hyper-V,
    // so overlay2 direct access is not available.
    // Will need to use Docker API or `docker save`.
    Ok(ProbeResult {
        runtimes: Vec::new(),
        default: None,
    })
}
