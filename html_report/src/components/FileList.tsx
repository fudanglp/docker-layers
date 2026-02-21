import { useState, useMemo, useRef } from "react";
import { File, ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import { formatBytes } from "@/lib/format";
import { cn } from "@/lib/utils";
import { usePagination } from "@/hooks/usePagination";
import { Pagination } from "./Pagination";

export interface FileListItem {
  name: string;
  size: number;
  is_whiteout: boolean;
}

type SortKey = "name" | "size";
type SortDir = "asc" | "desc";

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <ArrowUpDown className="size-3.5" />;
  return dir === "asc" ? (
    <ArrowUp className="size-3.5" />
  ) : (
    <ArrowDown className="size-3.5" />
  );
}

export function FileList({
  items,
  defaultSortKey = "size",
  defaultSortDir = "desc",
  emptyMessage = "No files",
}: {
  items: FileListItem[];
  defaultSortKey?: SortKey;
  defaultSortDir?: SortDir;
  emptyMessage?: string;
}) {
  const [sortKey, setSortKey] = useState<SortKey>(defaultSortKey);
  const [sortDir, setSortDir] = useState<SortDir>(defaultSortDir);

  const sorted = useMemo(() => {
    const copy = [...items];
    copy.sort((a, b) => {
      const cmp =
        sortKey === "name" ? a.name.localeCompare(b.name) : a.size - b.size;
      return sortDir === "asc" ? cmp : -cmp;
    });
    return copy;
  }, [items, sortKey, sortDir]);

  const maxSize = useMemo(
    () => items.reduce((m, f) => Math.max(m, f.size), 0) || 1,
    [items]
  );

  const containerRef = useRef<HTMLDivElement>(null);
  const { pageItems, page, totalPages, setPage } = usePagination(
    sorted,
    containerRef,
    24,
    36
  );

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "size" ? "desc" : "asc");
    }
  }

  return (
    <div className="flex flex-col h-full" ref={containerRef}>
      {/* Sort header */}
      <div className="flex items-center border-b bg-background px-3 py-1.5 text-sm font-medium shrink-0">
        <button
          className="flex items-center gap-1 hover:text-foreground text-muted-foreground transition-colors"
          onClick={() => toggleSort("name")}
        >
          Name
          <SortIcon active={sortKey === "name"} dir={sortDir} />
        </button>
        <button
          className="flex items-center gap-1 ml-auto hover:text-foreground text-muted-foreground transition-colors"
          onClick={() => toggleSort("size")}
        >
          Size
          <SortIcon active={sortKey === "size"} dir={sortDir} />
        </button>
      </div>

      {/* File rows */}
      <div className="flex-1 overflow-hidden px-1 pt-1">
        {items.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
            {emptyMessage}
          </div>
        ) : (
          pageItems.map((file, i) => {
            const pct = (file.size / maxSize) * 100;
            const displayName = file.is_whiteout
              ? file.name.replace(/^\.wh\./, "")
              : file.name;
            return (
              <div
                key={`${file.name}-${page}-${i}`}
                className="flex items-center gap-2 py-0.5 px-2 text-sm hover:bg-muted/50 rounded relative"
              >
                <div
                  className="absolute inset-y-0 left-0 bg-primary/5 rounded"
                  style={{ width: `${pct}%` }}
                />
                <File className="size-3.5 shrink-0 text-muted-foreground relative" />
                <span
                  className={cn(
                    "truncate relative",
                    file.is_whiteout && "line-through text-red-500"
                  )}
                >
                  {displayName}
                  {file.is_whiteout && " (deleted)"}
                </span>
                <span className="ml-auto shrink-0 text-xs text-muted-foreground tabular-nums relative">
                  {formatBytes(file.size)}
                </span>
              </div>
            );
          })
        )}
      </div>

      <Pagination page={page} totalPages={totalPages} setPage={setPage} />
    </div>
  );
}
