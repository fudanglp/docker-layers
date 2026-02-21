import { Search, FolderTree, ArrowDownWideNarrow } from "lucide-react";
import { cn } from "@/lib/utils";

export type ViewMode = "layer" | "accumulated";
export type FileViewMode = "tree" | "size";

function Toggle<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string; icon?: React.ReactNode }[];
}) {
  return (
    <div className="flex rounded-md border bg-muted/50 p-0.5">
      {options.map((opt) => (
        <button
          key={opt.value}
          className={cn(
            "flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded transition-colors",
            value === opt.value
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
          onClick={() => onChange(opt.value)}
        >
          {opt.icon}
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export function Toolbar({
  viewMode,
  onViewModeChange,
  fileViewMode,
  onFileViewModeChange,
  filter,
  onFilterChange,
}: {
  viewMode: ViewMode;
  onViewModeChange: (v: ViewMode) => void;
  fileViewMode: FileViewMode;
  onFileViewModeChange: (v: FileViewMode) => void;
  filter: string;
  onFilterChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-2 border-b bg-muted/30 shrink-0">
      <Toggle
        value={viewMode}
        onChange={onViewModeChange}
        options={[
          { value: "layer", label: "This Layer" },
          { value: "accumulated", label: "Accumulated" },
        ]}
      />

      <Toggle
        value={fileViewMode}
        onChange={onFileViewModeChange}
        options={[
          { value: "tree", label: "Tree", icon: <FolderTree className="size-3.5" /> },
          { value: "size", label: "Files", icon: <ArrowDownWideNarrow className="size-3.5" /> },
        ]}
      />

      <div className="flex items-center gap-1.5 flex-1 max-w-xs ml-auto">
        <Search className="size-3.5 text-muted-foreground shrink-0" />
        <input
          type="text"
          placeholder="Filter files..."
          value={filter}
          onChange={(e) => onFilterChange(e.target.value)}
          className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>
    </div>
  );
}
