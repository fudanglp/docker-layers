import { useState, useMemo, useRef, useCallback, useEffect, type RefObject } from "react";
import { File, ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import { formatBytes } from "@/lib/format";
import { cn } from "@/lib/utils";
import { usePagination } from "@/hooks/usePagination";
import { Pagination } from "./Pagination";

const focusRing = "focus:outline-none focus:bg-primary/10";

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
  sectionRef,
}: {
  items: FileListItem[];
  defaultSortKey?: SortKey;
  defaultSortDir?: SortDir;
  emptyMessage?: string;
  sectionRef?: RefObject<HTMLDivElement | null>;
}) {
  const [sortKey, setSortKey] = useState<SortKey>(defaultSortKey);
  const [sortDir, setSortDir] = useState<SortDir>(defaultSortDir);
  const [selectedIndex, setSelectedIndex] = useState(-1);

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
  const mergedRef = useCallback(
    (node: HTMLDivElement | null) => {
      (containerRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
      if (sectionRef) {
        (sectionRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
      }
    },
    [sectionRef]
  );
  const { pageItems, page, totalPages, setPage } = usePagination(
    sorted,
    containerRef,
    24,
    36
  );

  // Reset selection on page or items change
  useEffect(() => {
    setSelectedIndex(-1);
  }, [page, items]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "size" ? "desc" : "asc");
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, pageItems.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
        break;
      case "ArrowRight":
        e.preventDefault();
        if (page < totalPages - 1) setPage(page + 1);
        break;
      case "ArrowLeft":
        e.preventDefault();
        if (page > 0) setPage(page - 1);
        break;
      case "Home":
        e.preventDefault();
        setPage(0);
        break;
      case "End":
        e.preventDefault();
        setPage(totalPages - 1);
        break;
    }
  }

  return (
    <div
      className={cn("flex flex-col h-full", sectionRef && focusRing)}
      ref={mergedRef}
      tabIndex={sectionRef ? -1 : undefined}
      onKeyDown={handleKeyDown}
    >
      {/* Sort header */}
      <div className="flex items-center border-b bg-background px-3 py-1.5 text-sm font-medium shrink-0">
        <button
          tabIndex={-1}
          className="flex items-center gap-1 hover:text-foreground text-muted-foreground transition-colors"
          onClick={() => toggleSort("name")}
        >
          Name
          <SortIcon active={sortKey === "name"} dir={sortDir} />
        </button>
        <button
          tabIndex={-1}
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
                className={cn(
                  "flex items-center gap-2 py-0.5 px-2 text-sm rounded relative",
                  i === selectedIndex ? "bg-primary/10" : "hover:bg-muted/50"
                )}
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
