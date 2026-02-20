use std::path::PathBuf;

use anyhow::Result;

use super::common::{check_daemon, check_read_access, command_output, find_binary};
use super::{ProbeResult, RuntimeInfo, RuntimeKind, StorageDriver};

pub fn probe() -> Result<ProbeResult> {
    let mut runtimes = Vec::new();

    if let Some(info) = detect_docker() {
        runtimes.push(info);
    }
    if let Some(info) = detect_podman() {
        runtimes.push(info);
    }
    if let Some(info) = detect_containerd() {
        runtimes.push(info);
    }

    // Default priority: Docker > Podman > containerd
    let default = if runtimes.is_empty() {
        None
    } else {
        Some(0)
    };

    Ok(ProbeResult { runtimes, default })
}

fn detect_docker() -> Option<RuntimeInfo> {
    let binary_path = find_binary("docker")?;

    // `docker info` needs docker group or root. Fall back to checking
    // if the daemon socket exists to avoid false "not running" reports.
    let is_running = check_daemon("docker", &["info"])
        || PathBuf::from("/var/run/docker.sock").exists();

    let storage_root = PathBuf::from("/var/lib/docker");
    let can_read = check_read_access(&storage_root);

    let storage_driver = if is_running {
        detect_docker_storage_driver()
    } else {
        guess_storage_driver(&storage_root)
    };

    Some(RuntimeInfo {
        kind: RuntimeKind::Docker,
        binary_path,
        storage_root,
        storage_driver,
        can_read,
        is_running,
    })
}

fn detect_docker_storage_driver() -> StorageDriver {
    // Ask the daemon directly
    if let Some(driver) = command_output("docker", &["info", "--format", "{{.Driver}}"]) {
        return parse_storage_driver(&driver);
    }
    StorageDriver::Unknown
}

fn guess_storage_driver(storage_root: &PathBuf) -> StorageDriver {
    // Guess by checking which directories exist
    let candidates = [
        ("overlay2", StorageDriver::Overlay2),
        ("fuse-overlayfs", StorageDriver::Fuse),
        ("btrfs", StorageDriver::Btrfs),
        ("zfs", StorageDriver::Zfs),
        ("vfs", StorageDriver::Vfs),
    ];

    for (dir_name, driver) in candidates {
        if storage_root.join(dir_name).is_dir() {
            return driver;
        }
    }

    StorageDriver::Unknown
}

fn parse_storage_driver(s: &str) -> StorageDriver {
    match s {
        "overlay2" | "overlay" => StorageDriver::Overlay2,
        "fuse-overlayfs" => StorageDriver::Fuse,
        "btrfs" => StorageDriver::Btrfs,
        "zfs" => StorageDriver::Zfs,
        "vfs" => StorageDriver::Vfs,
        _ => StorageDriver::Unknown,
    }
}

fn detect_podman() -> Option<RuntimeInfo> {
    let binary_path = find_binary("podman")?;
    let is_running = check_daemon("podman", &["info"]);

    // Podman uses different paths for root vs rootless
    let storage_root = if check_read_access(&PathBuf::from("/var/lib/containers/storage")) {
        PathBuf::from("/var/lib/containers/storage")
    } else {
        // Rootless path
        let home = std::env::var("HOME").ok()?;
        PathBuf::from(home).join(".local/share/containers/storage")
    };

    let can_read = check_read_access(&storage_root);

    let storage_driver = if is_running {
        command_output("podman", &["info", "--format", "{{.Store.GraphDriverName}}"])
            .map(|s| parse_storage_driver(&s))
            .unwrap_or(StorageDriver::Unknown)
    } else {
        guess_storage_driver(&storage_root)
    };

    Some(RuntimeInfo {
        kind: RuntimeKind::Podman,
        binary_path,
        storage_root,
        storage_driver,
        can_read,
        is_running,
    })
}

fn detect_containerd() -> Option<RuntimeInfo> {
    let binary_path = find_binary("ctr")?;
    let is_running = check_daemon("ctr", &["version"]);

    let storage_root = PathBuf::from("/var/lib/containerd");
    let can_read = check_read_access(&storage_root);

    Some(RuntimeInfo {
        kind: RuntimeKind::Containerd,
        binary_path,
        storage_root,
        storage_driver: StorageDriver::Overlay2, // containerd defaults to overlayfs
        can_read,
        is_running,
    })
}
