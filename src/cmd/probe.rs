use anyhow::Result;

use crate::config;

pub fn run(json: bool, runtime: Option<String>) -> Result<()> {
    config::init_from_cli(json, runtime)?;
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

    Ok(())
}
