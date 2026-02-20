import { useState } from "react";
import { ChevronDown, Layers } from "lucide-react";
import type { LayerInfo } from "@/types";
import { formatBytes } from "@/lib/format";
import { cn } from "@/lib/utils";
import { FileTree } from "./FileTree";

export function LayerCard({
  layer,
  index,
}: {
  layer: LayerInfo;
  index: number;
}) {
  const [open, setOpen] = useState(false);
  const shortDigest = layer.digest.slice(7, 19); // strip "sha256:", show 12 chars

  return (
    <div className="border rounded-lg overflow-hidden">
      <button
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/50 transition-colors"
        onClick={() => setOpen(!open)}
      >
        <span className="flex items-center justify-center size-7 rounded-full bg-primary text-primary-foreground text-xs font-bold shrink-0">
          {index + 1}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Layers className="size-3.5 text-muted-foreground shrink-0" />
            <code className="text-sm text-muted-foreground">{shortDigest}</code>
            <span className="text-sm font-medium">{formatBytes(layer.size)}</span>
            <span className="text-xs text-muted-foreground">
              {layer.files.length.toLocaleString()} files
            </span>
          </div>
          {layer.created_by && (
            <p className="text-xs text-muted-foreground font-mono truncate mt-1">
              {layer.created_by}
            </p>
          )}
        </div>
        <ChevronDown
          className={cn(
            "size-4 text-muted-foreground shrink-0 transition-transform",
            open && "rotate-180"
          )}
        />
      </button>
      {open && (
        <div className="px-4 pb-4">
          <FileTree files={layer.files} />
        </div>
      )}
    </div>
  );
}
