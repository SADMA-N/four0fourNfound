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
    <section
      className="grid items-center gap-[10px]"
      style={{ gridTemplateColumns: "auto minmax(0,1fr) auto auto" }}
      aria-label="Uploaded images"
    >
      <button
        className="btn-icon"
        type="button"
        onClick={() => scroll(-1)}
        title="Scroll images left"
      >
        <ChevronLeft size={18} aria-hidden="true" />
      </button>

      <div
        ref={scrollerRef}
        className="flex gap-[10px] min-h-[92px] overflow-x-auto p-[2px]"
        style={{ scrollSnapType: "x mandatory" }}
      >
        {images.length ? (
          images.map((image) => (
            <button
              key={image.id}
              className={`relative flex-none w-[136px] h-[88px] rounded-lg overflow-hidden p-0 border-2 transition-colors ${
                selectedId === image.id
                  ? "border-teal bg-white"
                  : "border-transparent bg-white"
              }`}
              style={{ scrollSnapAlign: "start" }}
              type="button"
              onClick={() => onSelect(image.id)}
              title={image.originalName}
            >
              <img
                src={image.url}
                alt={image.originalName}
                className="w-full h-full object-cover"
              />
              <span className="absolute bottom-[6px] right-[6px] flex items-center justify-center bg-ink/80 text-white text-[0.75rem] font-black rounded-[6px] min-w-[28px] h-6 px-[7px]">
                {image.polygons.length}
              </span>
            </button>
          ))
        ) : (
          <div className="flex flex-1 items-center justify-center gap-2 bg-white border border-dashed border-[#bdcbd5] rounded-lg text-muted font-extrabold min-w-[260px]">
            <ImageIcon size={20} aria-hidden="true" />
            <span>No images uploaded</span>
          </div>
        )}
      </div>

      <button
        className="btn-icon"
        type="button"
        onClick={() => scroll(1)}
        title="Scroll images right"
      >
        <ChevronRight size={18} aria-hidden="true" />
      </button>

      <button
        className="btn-icon text-coral"
        type="button"
        disabled={!selectedId}
        onClick={() => selectedId && onDelete(selectedId)}
        title="Delete selected image"
      >
        <Trash2 size={18} aria-hidden="true" />
      </button>
    </section>
  );
}
