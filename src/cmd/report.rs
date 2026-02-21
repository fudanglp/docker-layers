use std::io::{Read, Write};
use std::net::TcpListener;

use anyhow::Result;
use crossterm::style::Stylize;

const TEMPLATE: &str = include_str!("../../assets/index.html");

/// Inject JSON data into the HTML template by filling the empty `__PEEL_DATA__` script tag.
pub fn build_report(json: &str) -> String {
    // Escape any </script> inside JSON to prevent premature tag closure
    let safe_json = json.replace("</script>", "<\\/script>");
    TEMPLATE.replace(
        r#"<script id="__PEEL_DATA__" type="application/json"></script>"#,
        &format!(
            r#"<script id="__PEEL_DATA__" type="application/json">{}</script>"#,
            safe_json
        ),
    )
}

/// Serve the HTML report on a random local port, blocking until Ctrl+C.
pub fn serve(html: &str) -> Result<()> {
    let listener = TcpListener::bind("127.0.0.1:0")?;
    let addr = listener.local_addr()?;
    eprintln!();
    eprintln!("Report available at {}", format!("http://{addr}").cyan());
    eprintln!("Press Ctrl+C to stop.");

    for stream in listener.incoming() {
        let mut stream = match stream {
            Ok(s) => s,
            Err(_) => continue,
        };

        // Read the request (we don't parse it, just drain it)
        let mut buf = [0u8; 4096];
        let _ = stream.read(&mut buf);

        let response = format!(
            "HTTP/1.1 200 OK\r\nContent-Type: text/html; charset=utf-8\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{}",
            html.len(),
            html
        );
        let _ = stream.write_all(response.as_bytes());
        let _ = stream.flush();
    }

    Ok(())
}
