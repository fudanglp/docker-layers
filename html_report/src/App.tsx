import { useState, useMemo } from "react";
import { Container, Cpu } from "lucide-react";
import data from "../data/test.json";
import type { ImageInfo, FileEntry } from "@/types";
import { formatBytes } from "@/lib/format";
import { LayerList } from "@/components/LayerList";
import { FilePanel } from "@/components/FilePanel";
import { Toolbar, type ViewMode, type FileViewMode } from "@/components/Toolbar";

const image = data as ImageInfo;

function App() {
  const [selectedLayer, setSelectedLayer] = useState(0);
  const [viewMode, setViewMode] = useState<ViewMode>("layer");
  const [fileViewMode, setFileViewMode] = useState<FileViewMode>("tree");
  const [filter, setFilter] = useState("");

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
      />

      {/* 2-column layout */}
      <div className="flex flex-1 min-h-0">
        {/* Left: layer list */}
        <div className="w-80 shrink-0 border-r overflow-y-auto">
          <LayerList
            layers={image.layers}
            selectedIndex={selectedLayer}
            onSelect={setSelectedLayer}
            viewMode={viewMode}
          />
        </div>

        {/* Right: file browser */}
        <div className="flex-1 overflow-y-auto">
          <FilePanel
            files={files}
            fileViewMode={fileViewMode}
            filter={filter}
          />
        </div>
      </div>
    </div>
  );
}

export default App;
