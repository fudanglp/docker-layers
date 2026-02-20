use std::io::{self, Write};

use anyhow::Result;
use crossterm::style::{self, Stylize};

use crate::config;
use crate::probe::RuntimeInfo;

pub fn run(image: &str, use_oci: bool, json: bool, runtime: Option<String>) -> Result<()> {
    config::init_from_cli(json, runtime)?;
    let cfg = config::get();

    // Check if we need root for direct storage access
    if !use_oci {
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

    Ok(())
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
fn maybe_escalate(rt: &RuntimeInfo) -> Result<()> {
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

    anyhow::bail!(
        "Cannot read storage without root. Re-run with sudo or use --use-oci."
    );
}
