import { useState, useMemo, useEffect, type RefObject } from "react";
import {
  ChevronRight,
  Folder,
  ChevronsDownUp,
  ChevronsUpDown,
} from "lucide-react";
import type { FileEntry, TreeNode } from "@/types";
import { formatBytes } from "@/lib/format";
import { buildTree } from "@/lib/tree";
import { cn } from "@/lib/utils";
import { FileList } from "./FileList";

function sortedDirChildren(node: TreeNode): TreeNode[] {
  return [...node.children.values()]
    .filter((c) => !c.isFile)
    .sort((a, b) => a.name.localeCompare(b.name));
}

function DirTreeNode({
  node,
  depth,
  expandedDirs,
  selectedDir,
  onSelect,
  onToggle,
}: {
  node: TreeNode;
  depth: number;
  expandedDirs: Set<TreeNode>;
  selectedDir: TreeNode | null;
  onSelect: (node: TreeNode) => void;
  onToggle: (node: TreeNode) => void;
}) {
  const dirs = useMemo(() => sortedDirChildren(node), [node]);
  const isSelected = selectedDir === node;
  const isOpen = expandedDirs.has(node);

  return (
    <>
      <div
        data-dir-selected={isSelected || undefined}
        className={cn(
          "flex items-center gap-1 py-0.5 px-2 rounded text-sm cursor-pointer",
          isSelected ? "bg-primary/10" : "hover:bg-muted/50"
        )}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={() => {
          onSelect(node);
          onToggle(node);
        }}
      >
        <ChevronRight
          className={cn(
            "size-3.5 shrink-0 text-muted-foreground transition-transform",
            dirs.length === 0 && "invisible",
            isOpen && "rotate-90"
          )}
        />
        <Folder className="size-3.5 shrink-0 text-blue-500" />
        <span className="truncate">{node.name || "/"}</span>
        <span className="ml-auto shrink-0 text-xs text-muted-foreground">
          {formatBytes(node.size)}
        </span>
      </div>
      {isOpen &&
        dirs.map((child) => (
          <DirTreeNode
            key={child.name}
            node={child}
            depth={depth + 1}
            expandedDirs={expandedDirs}
            selectedDir={selectedDir}
            onSelect={onSelect}
            onToggle={onToggle}
          />
        ))}
    </>
  );
}

const focusRing = "focus:outline-none focus:bg-primary/10";

export function FileTreeSplit({
  files,
  treeRef,
  fileRef,
}: {
  files: FileEntry[];
  treeRef: RefObject<HTMLDivElement | null>;
  fileRef: RefObject<HTMLDivElement | null>;
}) {
  const [expandedDirs, setExpandedDirs] = useState<Set<TreeNode>>(new Set());
  const [selectedDir, setSelectedDir] = useState<TreeNode | null>(null);

  const tree = useMemo(() => buildTree(files), [files]);

  // Reset on layer change
  useEffect(() => {
    setSelectedDir(null);
    setExpandedDirs(new Set());
  }, [files]);

  const activeDir = selectedDir ?? tree;

  const fileChildren = useMemo(
    () => [...activeDir.children.values()].filter((c) => c.isFile),
    [activeDir]
  );

  // Flat list of visible dirs for keyboard nav (null = root)
  const visibleDirs = useMemo(() => {
    const result: (TreeNode | null)[] = [null];
    function walk(node: TreeNode) {
      for (const child of sortedDirChildren(node)) {
        result.push(child);
        if (expandedDirs.has(child)) walk(child);
      }
    }
    walk(tree); // root children always visible
    return result;
  }, [tree, expandedDirs]);

  function toggleExpand(node: TreeNode) {
    setExpandedDirs((prev) => {
      const next = new Set(prev);
      if (next.has(node)) next.delete(node);
      else next.add(node);
      return next;
    });
  }

  function expandAll() {
    const all = new Set<TreeNode>();
    function walk(node: TreeNode) {
      for (const child of sortedDirChildren(node)) {
        all.add(child);
        walk(child);
      }
    }
    walk(tree);
    setExpandedDirs(all);
  }

  function collapseAll() {
    setExpandedDirs(new Set());
  }

  // Scroll selected dir into view
  useEffect(() => {
    const el = treeRef.current?.querySelector('[data-dir-selected="true"]');
    el?.scrollIntoView({ block: "nearest" });
  }, [selectedDir, treeRef]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      const idx = visibleDirs.indexOf(selectedDir);
      if (idx < visibleDirs.length - 1) {
        setSelectedDir(visibleDirs[idx + 1]);
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const idx = visibleDirs.indexOf(selectedDir);
      if (idx > 0) {
        setSelectedDir(visibleDirs[idx - 1]);
      }
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (selectedDir !== null) {
        toggleExpand(selectedDir);
      }
    }
  }

  return (
    <div className="flex h-full">
      {/* Left pane: directory tree */}
      <div
        ref={treeRef}
        tabIndex={-1}
        className={`w-2/5 border-r overflow-auto p-2 ${focusRing}`}
        onKeyDown={handleKeyDown}
      >
        <div className="flex items-center gap-1 mb-1 px-2">
          <button
            tabIndex={-1}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            onClick={expandAll}
          >
            <ChevronsUpDown className="size-3.5" />
            Expand All
          </button>
          <span className="text-muted-foreground text-xs">/</span>
          <button
            tabIndex={-1}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            onClick={collapseAll}
          >
            <ChevronsDownUp className="size-3.5" />
            Collapse All
          </button>
        </div>
        {/* Root entry */}
        <div
          data-dir-selected={selectedDir === null || undefined}
          className={cn(
            "flex items-center gap-1 py-0.5 px-2 rounded text-sm cursor-pointer",
            selectedDir === null ? "bg-primary/10" : "hover:bg-muted/50"
          )}
          style={{ paddingLeft: "8px" }}
          onClick={() => setSelectedDir(null)}
        >
          <ChevronRight className="size-3.5 shrink-0 invisible" />
          <Folder className="size-3.5 shrink-0 text-blue-500" />
          <span className="truncate">/ root</span>
          <span className="ml-auto shrink-0 text-xs text-muted-foreground">
            {formatBytes(tree.size)}
          </span>
        </div>
        {sortedDirChildren(tree).map((child) => (
          <DirTreeNode
            key={child.name}
            node={child}
            depth={1}
            expandedDirs={expandedDirs}
            selectedDir={selectedDir}
            onSelect={setSelectedDir}
            onToggle={toggleExpand}
          />
        ))}
      </div>

      {/* Right pane: file list */}
      <div className="flex-1 overflow-hidden">
        <FileList
          items={fileChildren}
          defaultSortKey="size"
          defaultSortDir="desc"
          emptyMessage="No files in this directory"
          sectionRef={fileRef}
        />
      </div>
    </div>
  );
}
