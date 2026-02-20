import { useState, useMemo } from "react";
import { ChevronRight, File, Folder } from "lucide-react";
import type { FileEntry, TreeNode } from "@/types";
import { formatBytes } from "@/lib/format";
import { cn } from "@/lib/utils";

function buildTree(files: FileEntry[]): TreeNode {
  const root: TreeNode = {
    name: "",
    size: 0,
    is_whiteout: false,
    children: new Map(),
    isFile: false,
  };

  for (const file of files) {
    const parts = file.path.split("/");
    let current = root;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isLast = i === parts.length - 1;

      if (!current.children.has(part)) {
        current.children.set(part, {
          name: part,
          size: 0,
          is_whiteout: false,
          children: new Map(),
          isFile: false,
        });
      }

      const child = current.children.get(part)!;
      if (isLast) {
        child.size = file.size;
        child.is_whiteout = file.is_whiteout;
        child.isFile = true;
      }

      current = child;
    }
  }

  computeSizes(root);
  return root;
}

function computeSizes(node: TreeNode): number {
  if (node.isFile) return node.size;
  let total = 0;
  for (const child of node.children.values()) {
    total += computeSizes(child);
  }
  node.size = total;
  return total;
}

function sortedChildren(node: TreeNode): TreeNode[] {
  return [...node.children.values()].sort((a, b) => {
    // Directories first, then alphabetical
    if (a.isFile !== b.isFile) return a.isFile ? 1 : -1;
    return a.name.localeCompare(b.name);
  });
}

function TreeNodeRow({
  node,
  depth,
}: {
  node: TreeNode;
  depth: number;
}) {
  const [open, setOpen] = useState(false);
  const children = useMemo(() => sortedChildren(node), [node]);
  const isDir = !node.isFile;

  // Whiteout display name: strip .wh. prefix
  const displayName = node.is_whiteout
    ? node.name.replace(/^\.wh\./, "")
    : node.name;

  return (
    <>
      <div
        className={cn(
          "flex items-center gap-1 py-0.5 px-2 hover:bg-muted/50 rounded text-sm font-mono",
          isDir && "cursor-pointer"
        )}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={() => isDir && setOpen(!open)}
      >
        {isDir ? (
          <ChevronRight
            className={cn(
              "size-3.5 shrink-0 text-muted-foreground transition-transform",
              open && "rotate-90"
            )}
          />
        ) : (
          <span className="w-3.5 shrink-0" />
        )}
        {isDir ? (
          <Folder className="size-3.5 shrink-0 text-blue-500" />
        ) : (
          <File className="size-3.5 shrink-0 text-muted-foreground" />
        )}
        <span
          className={cn(
            "truncate",
            node.is_whiteout && "line-through text-red-500"
          )}
        >
          {displayName}
          {node.is_whiteout && " (deleted)"}
        </span>
        <span className="ml-auto shrink-0 text-xs text-muted-foreground">
          {formatBytes(node.size)}
        </span>
      </div>
      {isDir && open && children.map((child) => (
        <TreeNodeRow key={child.name} node={child} depth={depth + 1} />
      ))}
    </>
  );
}

export function FileTree({ files }: { files: FileEntry[] }) {
  const tree = useMemo(() => buildTree(files), [files]);
  const children = useMemo(() => sortedChildren(tree), [tree]);

  return (
    <div className="border rounded-md bg-card max-h-96 overflow-y-auto">
      {children.map((child) => (
        <TreeNodeRow key={child.name} node={child} depth={0} />
      ))}
    </div>
  );
}
