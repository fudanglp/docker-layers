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

    #[command(subcommand)]
    command: Commands,
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

    match &cli.command {
        Commands::Inspect { image } => {
            let cfg = config::get();
            if cfg.json {
                println!("{{\"image\": \"{image}\", \"layers\": []}}");
            } else {
                println!("Inspecting image: {image}");
                println!("(not yet implemented)");
            }
        }
        Commands::Probe => {
            let cfg = config::get();

            if cfg.json {
                println!("{}", serde_json::to_string_pretty(&cfg.probe)?);
            } else if cfg.probe.runtimes.is_empty() {
                println!("No container runtimes detected.");
            } else {
                println!("Detected container runtimes:\n");
                for (i, rt) in cfg.probe.runtimes.iter().enumerate() {
                    let marker = if cfg.probe.default == Some(i) {
                        " (default)"
                    } else {
                        ""
                    };
                    println!("  {}{}", rt.kind, marker);
                    println!("    Binary:           {}", rt.binary_path.display());
                    println!("    Storage root:     {}", rt.storage_root.display());
                    println!("    Storage driver:   {}", rt.storage_driver);
                    println!(
                        "    Daemon running:   {}",
                        if rt.is_running { "yes" } else { "no" }
                    );
                    println!(
                        "    Storage readable: {}",
                        if rt.can_read {
                            "yes"
                        } else {
                            "no (run as root)"
                        }
                    );
                    println!();
                }
            }
        }
    }

    Ok(())
}
