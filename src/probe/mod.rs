mod common;

#[cfg(target_os = "linux")]
mod linux;

#[cfg(target_os = "macos")]
mod macos;

#[cfg(target_os = "windows")]
mod windows;

use std::fmt;
use std::path::PathBuf;

use anyhow::Result;
use serde::Serialize;

#[derive(Debug, Clone, Serialize)]
pub enum RuntimeKind {
    Docker,
    Podman,
    Containerd,
}

impl fmt::Display for RuntimeKind {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            RuntimeKind::Docker => write!(f, "Docker"),
            RuntimeKind::Podman => write!(f, "Podman"),
            RuntimeKind::Containerd => write!(f, "containerd"),
        }
    }
}

#[derive(Debug, Clone, Serialize)]
pub enum StorageDriver {
    Overlay2,
    Fuse,
    Btrfs,
    Zfs,
    Vfs,
    Unknown,
}

impl fmt::Display for StorageDriver {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            StorageDriver::Overlay2 => write!(f, "overlay2"),
            StorageDriver::Fuse => write!(f, "fuse-overlayfs"),
            StorageDriver::Btrfs => write!(f, "btrfs"),
            StorageDriver::Zfs => write!(f, "zfs"),
            StorageDriver::Vfs => write!(f, "vfs"),
            StorageDriver::Unknown => write!(f, "unknown"),
        }
    }
}

#[derive(Debug, Clone, Serialize)]
pub struct RuntimeInfo {
    pub kind: RuntimeKind,
    pub binary_path: PathBuf,
    pub storage_root: PathBuf,
    pub storage_driver: StorageDriver,
    pub can_read: bool,
    pub is_running: bool,
}

#[derive(Debug, Clone, Serialize)]
pub struct ProbeResult {
    pub runtimes: Vec<RuntimeInfo>,
    pub default: Option<usize>,
}

#[cfg(target_os = "linux")]
pub fn probe() -> Result<ProbeResult> {
    linux::probe()
}

#[cfg(target_os = "macos")]
pub fn probe() -> Result<ProbeResult> {
    macos::probe()
}

#[cfg(target_os = "windows")]
pub fn probe() -> Result<ProbeResult> {
    windows::probe()
}
