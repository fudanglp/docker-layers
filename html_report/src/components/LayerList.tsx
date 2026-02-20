import { Layers } from "lucide-react";
import type { LayerInfo } from "@/types";
import type { ViewMode } from "./Toolbar";
import { formatBytes } from "@/lib/format";
import { cn } from "@/lib/utils";

export function LayerList({
  layers,
  selectedIndex,
  onSelect,
  viewMode,
}: {
  layers: LayerInfo[];
  selectedIndex: number;
  onSelect: (i: number) => void;
  viewMode: ViewMode;
}) {
  return (
    <div className="py-1">
      {layers.map((layer, i) => {
        const selected = i === selectedIndex;
        // In accumulated mode, highlight all layers up to selected
        const included = viewMode === "accumulated" && i <= selectedIndex;

        return (
          <button
            key={layer.digest}
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
                <p className="text-[10px] text-muted-foreground font-mono truncate mt-0.5 leading-tight">
                  {layer.created_by}
                </p>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
