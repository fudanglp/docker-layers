import { useState, useEffect, type RefObject } from "react";
import { Layers, Terminal } from "lucide-react";
import type { LayerInfo } from "@/types";
import type { ViewMode } from "./Toolbar";
import { formatBytes } from "@/lib/format";
import { cn } from "@/lib/utils";
import { CommandDialog } from "./CommandDialog";

const focusRing = "focus:outline-none focus:bg-primary/10";

export function LayerList({
  layers,
  selectedIndex,
  onSelect,
  viewMode,
  sectionRef,
}: {
  layers: LayerInfo[];
  selectedIndex: number;
  onSelect: (i: number) => void;
  viewMode: ViewMode;
  sectionRef: RefObject<HTMLDivElement | null>;
}) {
  const [commandLayer, setCommandLayer] = useState<number | null>(null);

  // Scroll selected layer into view on keyboard nav
  useEffect(() => {
    const el = sectionRef.current?.querySelector(
      `[data-layer-index="${selectedIndex}"]`
    );
    el?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex, sectionRef]);

  function handleKeyDown(e: React.KeyboardEvent) {
    // Don't navigate while dialog is open
    if (commandLayer !== null) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      onSelect(Math.min(selectedIndex + 1, layers.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      onSelect(Math.max(selectedIndex - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (layers[selectedIndex].created_by) {
        setCommandLayer(selectedIndex);
      }
    }
  }

  return (
    <div
      ref={sectionRef}
      tabIndex={-1}
      className={cn("py-1 h-full overflow-y-auto", focusRing)}
      onKeyDown={handleKeyDown}
    >
      {layers.map((layer, i) => {
        const selected = i === selectedIndex;
        // In accumulated mode, highlight all layers up to selected
        const included = viewMode === "accumulated" && i <= selectedIndex;

        return (
          <button
            key={layer.digest}
            data-layer-index={i}
            tabIndex={-1}
            className={cn(
              "w-full text-left px-3 py-2 flex items-start gap-2 transition-colors",
              selected
                ? "bg-primary/10 border-l-2 border-primary"
                : included
                  ? "bg-muted/40 border-l-2 border-primary/30"
                  : "border-l-2 border-transparent hover:bg-muted/50"
            )}
            onClick={() => onSelect(i)}
          >
            <span
              className={cn(
                "flex items-center justify-center size-5 rounded-full text-[10px] font-bold shrink-0 mt-0.5",
                selected
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {i + 1}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <Layers className="size-3 text-muted-foreground shrink-0" />
                <code className="text-xs text-muted-foreground">
                  {layer.digest.slice(7, 19)}
                </code>
              </div>
              <div className="flex items-center gap-2 mt-0.5 text-xs">
                <span className="font-medium">{formatBytes(layer.size)}</span>
                <span className="text-muted-foreground">
                  {layer.files.length.toLocaleString()} files
                </span>
              </div>
              {layer.created_by && (
                <div className="flex items-center gap-1 mt-0.5">
                  <p className="text-[10px] text-muted-foreground font-mono truncate leading-tight flex-1 min-w-0">
                    {layer.created_by}
                  </p>
                  <span
                    role="button"
                    tabIndex={-1}
                    className="shrink-0 p-0.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                    title="View full command"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCommandLayer(i);
                    }}
                  >
                    <Terminal className="size-3" />
                  </span>
                </div>
              )}
            </div>
          </button>
        );
      })}

      {commandLayer !== null && layers[commandLayer].created_by && (
        <CommandDialog
          command={layers[commandLayer].created_by!}
          layerIndex={commandLayer}
          onClose={() => setCommandLayer(null)}
        />
      )}
    </div>
  );
}
