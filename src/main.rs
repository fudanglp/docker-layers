mod cmd;
mod config;
mod probe;

use anyhow::Result;
use clap::{Parser, Subcommand};

use config::AppConfig;

#[derive(Parser)]
#[command(name = "peel")]
#[command(about = "A container image layer inspection tool")]
#[command(version)]
struct Cli {
    /// Override runtime selection (docker, podman, containerd)
    #[arg(long, global = true)]
    runtime: Option<String>,

    /// Output as JSON
    #[arg(long, global = true)]
    json: bool,

    /// Use OCI/Docker API instead of direct storage access (no root needed, slower)
    #[arg(long, global = true)]
    use_oci: bool,

    #[command(subcommand)]
    command: Option<Commands>,

    /// Image name or path to a tar archive (shorthand for `peel inspect <image>`)
    image: Option<String>,
}

#[derive(Subcommand)]
enum Commands {
    /// Inspect layers of a container image
    Inspect {
        /// Image name or path to a tar archive
        image: String,
    },

    /// Detect installed container runtimes
    Probe,
}

fn main() -> Result<()> {
    let cli = Cli::parse();

    // Probe runtimes and initialize global config
    let probe_result = probe::probe()?;
    config::init(AppConfig {
        probe: probe_result,
        json: cli.json,
        runtime_override: cli.runtime,
    });

    // Resolve: `peel <image>` is shorthand for `peel inspect <image>`
    let image_to_inspect = match &cli.command {
        Some(Commands::Inspect { image }) => Some(image.clone()),
        Some(_) => None,
        None => cli.image.clone(),
    };

    if cli.command.is_none() && image_to_inspect.is_none() {
        Cli::parse_from(["peel", "--help"]);
        unreachable!()
    }

    if let Some(image) = &image_to_inspect {
        cmd::inspect::run(image, cli.use_oci)?;
    } else if matches!(cli.command, Some(Commands::Probe)) {
        cmd::probe::run()?;
    }

    Ok(())
}
