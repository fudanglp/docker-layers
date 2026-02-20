mod config;
mod probe;

use std::io::{self, Write};

use anyhow::Result;
use clap::{Parser, Subcommand};
use crossterm::style::{self, Stylize};

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

/// Re-execute the current process under sudo.
fn escalate_with_sudo() -> Result<()> {
    let exe = std::env::current_exe()?;
    let args: Vec<String> = std::env::args().skip(1).collect();
    let status = std::process::Command::new("sudo")
        .arg(exe)
        .args(&args)
        .status()?;
    std::process::exit(status.code().unwrap_or(1));
}

/// Prompt the user to re-run with sudo if direct storage access requires root.
/// Returns true if the caller should continue without sudo (--use-oci fallback).
fn maybe_escalate(rt: &probe::RuntimeInfo) -> Result<bool> {
    let mut stderr = io::stderr();
    write!(
        stderr,
        "{} Direct layer access reads from {} which is owned by root.\n",
        "!".yellow().bold(),
        style::style(rt.storage_root.display()).bold()
    )?;
    write!(
        stderr,
        "  peel needs to re-run with {} to read layers directly.\n\n",
        "sudo".bold()
    )?;
    write!(
        stderr,
        "  Alternatively, run with {} to read layers through the {} API\n",
        "--use-oci".green().bold(),
        rt.kind
    )?;
    write!(stderr, "  (no root needed, but slower).\n\n")?;
    write!(stderr, "Re-run with sudo? {} ", "[Y/n]".dim())?;
    stderr.flush()?;

    let mut answer = String::new();
    io::stdin().read_line(&mut answer)?;
    let answer = answer.trim().to_lowercase();

    if answer.is_empty() || answer == "y" || answer == "yes" {
        escalate_with_sudo()?;
    }

    // User declined sudo — bail out
    anyhow::bail!(
        "Cannot read storage without root. Re-run with sudo or use --use-oci."
    );
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

            // Check if we need root for direct storage access
            if !cli.use_oci {
                if let Some(idx) = cfg.probe.default {
                    let rt = &cfg.probe.runtimes[idx];
                    if !rt.can_read {
                        maybe_escalate(rt)?;
                    }
                }
            }

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
