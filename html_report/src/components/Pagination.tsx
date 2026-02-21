import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

const btnClass =
  "p-0.5 rounded hover:bg-muted disabled:opacity-30 disabled:pointer-events-none";

export function Pagination({
  page,
  totalPages,
  setPage,
}: {
  page: number;
  totalPages: number;
  setPage: (p: number) => void;
}) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs text-muted-foreground border-t shrink-0">
      <button
        className={btnClass}
        disabled={page === 0}
        onClick={() => setPage(0)}
      >
        <ChevronsLeft className="size-3.5" />
      </button>
      <button
        className={btnClass}
        disabled={page === 0}
        onClick={() => setPage(page - 1)}
      >
        <ChevronLeft className="size-3.5" />
      </button>
      <span className="px-1.5">
        Page {page + 1} of {totalPages}
      </span>
      <button
        className={btnClass}
        disabled={page >= totalPages - 1}
        onClick={() => setPage(page + 1)}
      >
        <ChevronRight className="size-3.5" />
      </button>
      <button
        className={btnClass}
        disabled={page >= totalPages - 1}
        onClick={() => setPage(totalPages - 1)}
      >
        <ChevronsRight className="size-3.5" />
      </button>
    </div>
  );
}
