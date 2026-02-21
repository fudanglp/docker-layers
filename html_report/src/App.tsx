import { useState, useMemo, useRef } from "react";
import { Container, Cpu } from "lucide-react";
import devData from "../data/test.json";
import type { ImageInfo, FileEntry } from "@/types";
import { formatBytes } from "@/lib/format";
import { LayerList } from "@/components/LayerList";
import { FilePanel } from "@/components/FilePanel";
import { Toolbar, type ViewMode, type FileViewMode } from "@/components/Toolbar";
import { useSectionFocus } from "@/hooks/useSectionFocus";

function loadData(): ImageInfo {
  const el = document.getElementById("__PEEL_DATA__");
  if (el?.textContent?.trim()) return JSON.parse(el.textContent);
  return devData as ImageInfo;
}

const image = loadData();

function App() {
  const [selectedLayer, setSelectedLayer] = useState(0);
  const [viewMode, setViewMode] = useState<ViewMode>("layer");
  const [fileViewMode, setFileViewMode] = useState<FileViewMode>("tree");
  const [filter, setFilter] = useState("");

  const toolbarRef = useRef<HTMLDivElement>(null);
  const layerRef = useRef<HTMLDivElement>(null);
  const treeRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLDivElement>(null);

  const sectionRefs = useMemo(() => {
    const refs = [toolbarRef, layerRef];
    if (fileViewMode === "tree") refs.push(treeRef);
    refs.push(fileRef);
    return refs;
  }, [fileViewMode]);

  useSectionFocus(sectionRefs);

  const files = useMemo<FileEntry[]>(() => {
    if (viewMode === "layer") {
      return image.layers[selectedLayer].files;
    }
    // Accumulated: all files from layer 0 through selected
    const all: FileEntry[] = [];
    for (let i = 0; i <= selectedLayer; i++) {
      all.push(...image.layers[i].files);
    }
    return all;
  }, [selectedLayer, viewMode]);

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="border-b px-4 py-3 shrink-0">
        <div className="flex items-center gap-3">
          <Container className="size-5 text-primary" />
          <h1 className="text-lg font-bold tracking-tight">
            {image.name}
            {image.tag && (
              <span className="text-muted-foreground font-normal">:{image.tag}</span>
            )}
          </h1>
          <div className="flex items-center gap-3 text-sm text-muted-foreground ml-2">
            {image.architecture && (
              <span className="flex items-center gap-1">
                <Cpu className="size-3.5" />
                {image.architecture}
              </span>
            )}
            <span>{formatBytes(image.total_size)}</span>
            <span>{image.layers.length} layers</span>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <Toolbar
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        fileViewMode={fileViewMode}
        onFileViewModeChange={setFileViewMode}
        filter={filter}
        onFilterChange={setFilter}
        sectionRef={toolbarRef}
      />

      {/* 2-column layout */}
      <div className="flex flex-1 min-h-0">
        {/* Left: layer list */}
        <div className="w-80 shrink-0 border-r">
          <LayerList
            layers={image.layers}
            selectedIndex={selectedLayer}
            onSelect={setSelectedLayer}
            viewMode={viewMode}
            sectionRef={layerRef}
          />
        </div>

        {/* Right: file browser */}
        <div className="flex-1 overflow-y-auto">
          <FilePanel
            files={files}
            fileViewMode={fileViewMode}
            filter={filter}
            treeRef={treeRef}
            fileRef={fileRef}
          />
        </div>
      </div>
    </div>
  );
}

export default App;
