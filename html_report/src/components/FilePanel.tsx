import { useMemo, type RefObject } from "react";
import type { FileEntry } from "@/types";
import type { FileViewMode } from "./Toolbar";
import { FileTreeSplit } from "./FileTreeSplit";
import { FileList } from "./FileList";

export function FilePanel({
  files,
  fileViewMode,
  filter,
  treeRef,
  fileRef,
}: {
  files: FileEntry[];
  fileViewMode: FileViewMode;
  filter: string;
  treeRef: RefObject<HTMLDivElement | null>;
  fileRef: RefObject<HTMLDivElement | null>;
}) {
  const filtered = useMemo(() => {
    if (!filter) return files;
    const lower = filter.toLowerCase();
    return files.filter((f) => f.path.toLowerCase().includes(lower));
  }, [files, filter]);

  if (filtered.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
        {filter ? "No files match filter" : "No files in this layer"}
      </div>
    );
  }

  if (fileViewMode === "tree") {
    return <FileTreeSplit files={filtered} treeRef={treeRef} fileRef={fileRef} />;
  }

  const items = filtered.map((f) => ({
    name: f.path,
    size: f.size,
    is_whiteout: f.is_whiteout,
  }));

  return <FileList items={items} sectionRef={fileRef} />;
}
