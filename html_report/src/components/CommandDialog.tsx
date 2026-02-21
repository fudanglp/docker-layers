import { useEffect, useState } from "react";
import { X, Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";

type ViewMode = "pretty" | "original";

export function CommandDialog({
  command,
  layerIndex,
  onClose,
}: {
  command: string;
  layerIndex: number;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [view, setView] = useState<ViewMode>("pretty");

  const display = view === "pretty" ? command.replace(/\t+/g, "\n") : command;

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  function copyToClipboard() {
    navigator.clipboard.writeText(display);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-background border rounded-lg shadow-lg max-w-2xl w-full mx-4 max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b shrink-0">
          <h2 className="text-sm font-medium">
            Layer {layerIndex + 1} Command
          </h2>
          <div className="flex items-center gap-1.5">
            {/* View toggle */}
            <div className="flex rounded-md border bg-muted/50 p-0.5 mr-1">
              {(["pretty", "original"] as const).map((m) => (
                <button
                  key={m}
                  className={cn(
                    "px-2 py-0.5 text-xs font-medium rounded transition-colors",
                    view === m
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  onClick={() => setView(m)}
                >
                  {m === "pretty" ? "Pretty" : "Original"}
                </button>
              ))}
            </div>
            <button
              className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              onClick={copyToClipboard}
              title="Copy"
            >
              {copied ? (
                <Check className="size-4 text-green-500" />
              ) : (
                <Copy className="size-4" />
              )}
            </button>
            <button
              className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              onClick={onClose}
              title="Close"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="overflow-auto p-4">
          <pre className="bg-zinc-900 text-zinc-100 rounded-md p-4 text-sm leading-relaxed whitespace-pre-wrap break-words">
            <code>{display}</code>
          </pre>
        </div>
      </div>
    </div>
  );
}
