# peel — Plan

## Goal

A Rust CLI tool for inspecting container image layers. It provides:

- Per-layer file listing with full paths and sizes
- Layer metadata (created_by command, timestamps, digest)
- JSON export for programmatic consumption
- Interactive TUI for browsing layers (via ratatui)
- Cross-platform support (Linux, macOS, Windows)

The tool auto-detects which container runtime is installed and reads layers
from the most efficient source available (local storage preferred over tar).

---

## Project Structure

```
peel/
├── Cargo.toml
├── plan.md
└── src/
    ├── main.rs                  # Entry point, clap CLI setup, tokio runtime
    ├── probe/                   # Probing & config layer (platform-aware)
    │   ├── mod.rs               # Trait + platform dispatch via #[cfg]
    │   ├── common.rs            # Shared: which(), daemon ping, binary detect
    │   ├── linux.rs             # Linux: overlay2 direct, systemd, storage paths
    │   ├── macos.rs             # macOS: Docker Desktop VM, API-based
    │   └── windows.rs           # Windows: WSL2, Docker Desktop
    ├── source/                  # Layer data sources (read abstraction)
    │   ├── mod.rs               # Source trait definition
    │   ├── overlay2.rs          # Linux only (#[cfg(target_os = "linux")])
    │   ├── oci.rs               # Cross-platform: OCI image layout
    │   └── docker_archive.rs    # Cross-platform: `docker save` tar
    ├── model/                   # Core data types (fully cross-platform)
    │   ├── mod.rs
    │   ├── image.rs             # ImageInfo, LayerInfo, FileEntry
    │   └── output.rs            # Serializable output types (JSON)
    └── ui/                      # Presentation (fully cross-platform)
        ├── mod.rs
        ├── cli.rs               # Plain text / table output
        └── tui.rs               # Interactive ratatui browser
```

### Cross-Platform Strategy

Platform-specific code uses Rust's `#[cfg(target_os = "...")]` to select
the right module at compile time. Each platform gets its own file with a
shared trait, keeping platform logic isolated.

Only `probe/` and `source/overlay2` need platform-specific code.
Everything else (model, UI, OCI/tar parsing) is cross-platform.

---

## Probing / Config Layer

### Purpose

Detect what container tools the user has installed and determine the best
data source for reading image layers. This runs before any image inspection.

### Container Runtimes to Detect

| Runtime     | How to detect                          | Storage path                          |
|-------------|----------------------------------------|---------------------------------------|
| Docker CE   | `docker` binary in PATH + daemon alive | `/var/lib/docker/`                    |
| Podman      | `podman` binary in PATH                | `~/.local/share/containers/storage/`  |
|             |                                        | `/var/lib/containers/storage/` (root) |
| containerd  | `ctr` binary in PATH                   | `/var/lib/containerd/`                |
| nerdctl     | `nerdctl` binary in PATH               | uses containerd storage               |

### Detection Strategy

1. **Check binaries in PATH** — which CLI tools are available
2. **Check daemon status** — is the daemon actually running (Docker needs dockerd)
3. **Check storage paths** — does the data directory exist and is it readable
4. **Check storage driver** — read Docker's daemon config for overlay2 vs other drivers
5. **Check permissions** — can we read the storage dir (may need root/sudo)

### Storage Driver Considerations

Docker supports multiple storage drivers. overlay2 is the default and most
common, but others exist:

| Driver    | Layout                    | How to read layers          |
|-----------|---------------------------|-----------------------------|
| overlay2  | `overlay2/<id>/diff/`     | Direct filesystem walk      |
| fuse-overlayfs | similar to overlay2  | Direct filesystem walk      |
| btrfs     | btrfs subvolumes          | Subvolume inspection        |
| zfs       | zfs datasets              | Dataset inspection          |
| vfs       | `vfs/dir/<id>/`           | Direct filesystem walk      |

The storage driver can be determined from:
- `docker info --format '{{.Driver}}'`
- `/var/lib/docker/engine-id` and directory structure inspection

### Data Source Priority

When inspecting an image, choose the source in this order:

1. **Local storage (overlay2)** — fastest, no decompression, direct file access
2. **OCI layout directory** — if user points to an OCI dir
3. **Tar archive** — `docker save` output or OCI tar, requires decompression
4. **Pull from registry** — future feature, not in initial scope

### Config / Override

Users can override auto-detection via:

- CLI flags: `--runtime docker`, `--source overlay2`, `--docker-root /custom/path`
- If a user passes a `.tar` or `.tar.gz` file as argument, skip probing and use tar source directly

### Probing Output

Runtimes are **usually mutually exclusive in practice** — on most Linux
distros, Docker CE and Podman conflict at the package level (shared `runc`
dependency, overlapping man pages, `podman-docker` conflicts with
`docker-ce-cli`). RHEL/CentOS 8+ ship Podman as the default and require
removing it to install Docker. However, co-installation is technically
possible via force-install, and containerd can coexist with either.

The probe should not assume exclusivity — it returns **all** detected
runtimes, but in practice most users will have exactly one.

```
RuntimeInfo {
    kind: Docker | Podman | Containerd,
    binary_path: PathBuf,        // e.g. /usr/bin/docker
    storage_driver: Overlay2 | Fuse | Btrfs | Zfs | Vfs | Unknown,
    storage_root: PathBuf,       // e.g. /var/lib/docker
    can_read: bool,              // permission check
    is_running: bool,            // daemon alive (relevant for Docker/containerd)
}

ProbeResult {
    runtimes: Vec<RuntimeInfo>,  // all detected runtimes, not just one
    default: Option<usize>,      // index of recommended runtime
}
```

Default runtime selection priority: Docker > Podman > containerd.
User can override with `--runtime docker|podman|containerd`.

This result is passed to the `source/` layer, which creates the appropriate
reader implementation.
