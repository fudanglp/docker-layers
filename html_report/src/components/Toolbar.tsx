import { useState, useRef, type RefObject } from "react";
import { Search, FolderTree, ArrowDownWideNarrow } from "lucide-react";
import { cn } from "@/lib/utils";

export type ViewMode = "layer" | "accumulated";
export type FileViewMode = "tree" | "size";

const focusRing = "focus:outline-none focus:bg-primary/10";
const widgetHighlight = "ring-2 ring-primary/40 rounded-md";

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
          tabIndex={-1}
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
  sectionRef,
}: {
  viewMode: ViewMode;
  onViewModeChange: (v: ViewMode) => void;
  fileViewMode: FileViewMode;
  onFileViewModeChange: (v: FileViewMode) => void;
  filter: string;
  onFilterChange: (v: string) => void;
  sectionRef: RefObject<HTMLDivElement | null>;
}) {
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const widgetCount = 3;

  function handleKeyDown(e: React.KeyboardEvent) {
    // When typing in search, only handle Escape to return to widget nav
    if (document.activeElement === inputRef.current) {
      if (e.key === "Escape") {
        e.preventDefault();
        inputRef.current?.blur();
        sectionRef.current?.focus();
        setActiveIndex(2);
      }
      return;
    }

    if (e.key === "ArrowRight") {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % widgetCount);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      setActiveIndex((i) => (i - 1 + widgetCount) % widgetCount);
    } else if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      if (activeIndex === 0) {
        onViewModeChange(viewMode === "layer" ? "accumulated" : "layer");
      } else if (activeIndex === 1) {
        onFileViewModeChange(fileViewMode === "tree" ? "size" : "tree");
      } else if (activeIndex === 2) {
        inputRef.current?.focus();
      }
    }
  }

  return (
    <div
      ref={sectionRef}
      tabIndex={-1}
      className={cn("flex items-center gap-3 px-4 py-2 border-b bg-muted/30 shrink-0", focusRing)}
      onKeyDown={handleKeyDown}
      onFocus={(e) => {
        if (e.target === sectionRef.current) {
          setActiveIndex((i) => (i === -1 ? 0 : i));
        }
      }}
      onBlur={(e) => {
        if (!sectionRef.current?.contains(e.relatedTarget)) {
          setActiveIndex(-1);
        }
      }}
    >
      <div className={cn(activeIndex === 0 && widgetHighlight)}>
        <Toggle
          value={viewMode}
          onChange={onViewModeChange}
          options={[
            { value: "layer", label: "This Layer" },
            { value: "accumulated", label: "Accumulated" },
          ]}
        />
      </div>

      <div className={cn(activeIndex === 1 && widgetHighlight)}>
        <Toggle
          value={fileViewMode}
          onChange={onFileViewModeChange}
          options={[
            { value: "tree", label: "Tree", icon: <FolderTree className="size-3.5" /> },
            { value: "size", label: "Files", icon: <ArrowDownWideNarrow className="size-3.5" /> },
          ]}
        />
      </div>

      <div className={cn("flex items-center gap-1.5 flex-1 max-w-xs ml-auto rounded-md px-1", activeIndex === 2 && widgetHighlight)}>
        <Search className="size-3.5 text-muted-foreground shrink-0" />
        <input
          ref={inputRef}
          type="text"
          tabIndex={-1}
          placeholder="Filter files..."
          value={filter}
          onChange={(e) => onFilterChange(e.target.value)}
          className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>
    </div>
  );
}
