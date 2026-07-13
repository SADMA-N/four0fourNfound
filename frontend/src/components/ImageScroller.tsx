import {
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  Trash2,
} from "lucide-react";
import { useRef } from "react";
import type { AnnotatedImage } from "../types";

export function ImageScroller({
  images,
  selectedId,
  onSelect,
  onDelete,
}: {
  images: AnnotatedImage[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  onDelete: (id: number) => void;
}) {
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  const scroll = (direction: number) => {
    scrollerRef.current?.scrollBy({
      left: direction * 280,
      behavior: "smooth",
    });
  };

  return (
    /* ── Film-strip thumbnail rail ────────────────────────────── */
    <section
      className="bg-surface-2 border border-line rounded-lg px-3 py-[10px]"
      aria-label="Uploaded images"
    >
      <div className="flex items-center gap-2">
        {/* ── Scroll left ───────────────────────────────────────── */}
        <button
          className="btn-icon shrink-0"
          type="button"
          onClick={() => scroll(-1)}
          aria-label="Scroll thumbnails left"
          title="Previous"
          disabled={images.length === 0}
        >
          <ChevronLeft size={16} aria-hidden="true" />
        </button>

        {/* ── Thumbnail strip ───────────────────────────────────── */}
        <div
          ref={scrollerRef}
          className="flex gap-[8px] flex-1 overflow-x-auto py-[2px]"
          style={{ scrollSnapType: "x mandatory" }}
          role="listbox"
          aria-label="Image thumbnails"
          aria-orientation="horizontal"
        >
          {images.length ? (
            images.map((image) => {
              const isSelected = selectedId === image.id;
              return (
                <button
                  key={image.id}
                  className={`relative shrink-0 rounded-lg overflow-hidden border-2 p-0 transition-all ${
                    isSelected
                      ? "border-teal shadow-[0_0_0_3px_oklch(66%_0.155_215_/_0.18)]"
                      : "border-line hover:border-muted"
                  }`}
                  style={{
                    width: 120,
                    height: 80,
                    scrollSnapAlign: "start",
                    background: "var(--color-surface)",
                  }}
                  type="button"
                  onClick={() => onSelect(image.id)}
                  role="option"
                  aria-selected={isSelected}
                  aria-label={image.originalName}
                  title={image.originalName}
                >
                  {/* Thumbnail */}
                  <img
                    src={image.url}
                    alt=""
                    aria-hidden="true"
                    className="w-full h-full object-cover"
                  />

                  {/* Polygon count badge — only shown when > 0 */}
                  {image.polygons.length > 0 && (
                    <span
                      className="absolute bottom-[5px] right-[5px] flex items-center justify-center bg-ink/80 text-white mono text-[0.68rem] font-bold rounded-[5px] min-w-[22px] h-[20px] px-[5px] leading-none"
                      aria-label={`${image.polygons.length} polygon${
                        image.polygons.length !== 1 ? "s" : ""
                      }`}
                    >
                      {image.polygons.length}
                    </span>
                  )}

                  {/* Selected indicator — bottom teal bar */}
                  {isSelected && (
                    <span
                      className="absolute inset-x-0 bottom-0 h-[3px] bg-teal"
                      aria-hidden="true"
                    />
                  )}
                </button>
              );
            })
          ) : (
            /* Empty state — human copy */
            <div className="flex flex-1 items-center justify-center gap-2 bg-surface border border-dashed border-line rounded-lg text-muted min-h-[84px] min-w-[260px] p-4">
              <ImageIcon size={18} aria-hidden="true" />
              <span className="text-[0.85rem] font-semibold">
                No images yet — upload one to start
              </span>
            </div>
          )}
        </div>

        {/* ── Scroll right ──────────────────────────────────────── */}
        <button
          className="btn-icon shrink-0"
          type="button"
          onClick={() => scroll(1)}
          aria-label="Scroll thumbnails right"
          title="Next"
          disabled={images.length === 0}
        >
          <ChevronRight size={16} aria-hidden="true" />
        </button>

        {/* ── Delete selected image ─────────────────────────────── */}
        <button
          className="btn-icon shrink-0 text-coral"
          type="button"
          disabled={!selectedId}
          onClick={() => selectedId && onDelete(selectedId)}
          aria-label="Delete selected image"
          title="Delete selected image"
        >
          <Trash2 size={16} aria-hidden="true" />
        </button>
      </div>
    </section>
  );
}
