import { useState, useEffect, useMemo, useRef, type RefObject } from "react";

export function usePagination<T>(
  items: T[],
  containerRef: RefObject<HTMLElement | null>,
  rowHeight: number,
  reservedHeight = 0
) {
  const [availableHeight, setAvailableHeight] = useState(0);
  const [page, setPage] = useState(0);
  const prevItemsRef = useRef(items);

  // Observe container height
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const ro = new ResizeObserver(([entry]) => {
      setAvailableHeight(entry.contentRect.height);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [containerRef]);

  const perPage = Math.max(1, Math.floor((availableHeight - reservedHeight) / rowHeight));
  const totalPages = Math.max(1, Math.ceil(items.length / perPage));

  // Reset page when items array identity changes (layer/dir switch)
  useEffect(() => {
    if (prevItemsRef.current !== items) {
      prevItemsRef.current = items;
      setPage(0);
    }
  }, [items]);

  // Clamp page when perPage or items change
  useEffect(() => {
    setPage((p) => Math.min(p, totalPages - 1));
  }, [totalPages]);

  const pageItems = useMemo(() => {
    const start = page * perPage;
    return items.slice(start, start + perPage);
  }, [items, page, perPage]);

  return { pageItems, page, totalPages, setPage, perPage };
}
