use std::path::{Path, PathBuf};
use std::process::Command;

/// Search PATH for a binary by name, similar to `which`.
pub fn find_binary(name: &str) -> Option<PathBuf> {
    let path_var = std::env::var("PATH").ok()?;
    for dir in path_var.split(':') {
        let candidate = Path::new(dir).join(name);
        if candidate.is_file() {
            return Some(candidate);
        }
    }
    None
}

/// Run a command and return true if it exits successfully.
/// Used to check if a daemon is alive (e.g. `docker info`).
pub fn check_daemon(cmd: &str, args: &[&str]) -> bool {
    Command::new(cmd)
        .args(args)
        .stdout(std::process::Stdio::null())
        .stderr(std::process::Stdio::null())
        .status()
        .is_ok_and(|s| s.success())
}

/// Run a command and capture its stdout as a String.
pub fn command_output(cmd: &str, args: &[&str]) -> Option<String> {
    let output = Command::new(cmd)
        .args(args)
        .stderr(std::process::Stdio::null())
        .output()
        .ok()?;

    if output.status.success() {
        Some(String::from_utf8_lossy(&output.stdout).trim().to_string())
    } else {
        None
    }
}

/// Check if a path exists and is readable by the current user.
pub fn check_read_access(path: &Path) -> bool {
    path.exists() && std::fs::read_dir(path).is_ok()
}
