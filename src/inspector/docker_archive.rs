use std::path::PathBuf;

use anyhow::Result;

use super::{FileEntry, ImageInfo, Inspector, LayerInfo};

/// Reads layers from a `docker save` tar archive.
/// Cross-platform, no daemon needed, but requires decompression.
pub struct DockerArchiveInspector {
    archive_path: PathBuf,
}

impl DockerArchiveInspector {
    pub fn new(archive_path: PathBuf) -> Self {
        Self { archive_path }
    }
}

impl Inspector for DockerArchiveInspector {
    fn inspect(&mut self, _image: &str) -> Result<ImageInfo> {
        // TODO: read manifest.json from tar, enumerate layer dirs
        let _ = &self.archive_path;
        anyhow::bail!("docker archive inspector not yet implemented")
    }

    fn list_files(&mut self, _layer: &LayerInfo) -> Result<Vec<FileEntry>> {
        // TODO: extract layer.tar from archive and list contents
        anyhow::bail!("docker archive inspector not yet implemented")
    }
}
