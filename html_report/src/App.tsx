import { Container, Cpu } from "lucide-react";
import data from "../data/test.json";
import type { ImageInfo } from "@/types";
import { formatBytes } from "@/lib/format";
import { LayerCard } from "@/components/LayerCard";

const image = data as ImageInfo;

function App() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto py-8 px-4 space-y-6">
        {/* Header */}
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <Container className="size-6 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight">
              {image.name}
              {image.tag && (
                <span className="text-muted-foreground font-normal">:{image.tag}</span>
              )}
            </h1>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
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

        {/* Layers */}
        <div className="space-y-2">
          {image.layers.map((layer, i) => (
            <LayerCard key={layer.digest} layer={layer} index={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;
