import { Eraser, Save, Undo2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { MouseEvent } from "react";
import type { AnnotatedImage, AnnotationPolygon, Point } from "../types";

const palette = ["#0f8b8d", "#ef476f", "#2d6cdf", "#f59f00", "#118c4f"];

export function AnnotationCanvas({
  image,
  saving,
  onAddPolygon,
  onDeletePolygon,
}: {
  image: AnnotatedImage;
  saving: boolean;
  onAddPolygon: (
    points: Point[],
    label: string,
    color: string,
  ) => Promise<void>;
  onDeletePolygon: (polygon: AnnotationPolygon) => Promise<void>;
}) {
  const imgRef = useRef<HTMLImageElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [draft, setDraft] = useState<Point[]>([]);
  const [label, setLabel] = useState("");
  const [color, setColor] = useState(palette[0]);

  useEffect(() => {
    setDraft([]);
    setLabel("");
  }, [image.id]);

  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;
    const sync = () => {
      const rect = img.getBoundingClientRect();
      setSize({
        width: Math.round(rect.width),
        height: Math.round(rect.height),
      });
    };
    sync();
    const observer = new ResizeObserver(sync);
    observer.observe(img);
    window.addEventListener("resize", sync);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", sync);
    };
  }, [image.id]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || size.width === 0 || size.height === 0) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size.width * dpr;
    canvas.height = size.height * dpr;
    canvas.style.width = `${size.width}px`;
    canvas.style.height = `${size.height}px`;
    const context = canvas.getContext("2d");
    if (!context) return;
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    context.clearRect(0, 0, size.width, size.height);
    image.polygons.forEach((polygon, index) => {
      drawPolygon(
        context,
        polygon.points,
        size,
        polygon.color,
        polygon.label || `P${index + 1}`,
        false,
      );
    });
    if (draft.length) {
      drawPolygon(context, draft, size, color, "draft", true);
    }
  }, [color, draft, image.polygons, size]);

  const addPoint = (event: MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    if (x < 0 || x > 1 || y < 0 || y > 1) return;
    setDraft((points) => [...points, { x, y }]);
  };

  const saveDraft = async () => {
    if (draft.length < 3) return;
    await onAddPolygon(draft, label, color);
    setDraft([]);
    setLabel("");
  };

  return (
    <section
      className="grid gap-4"
      style={{ gridTemplateColumns: "minmax(0,1fr) 290px" }}
    >
      {/* Canvas panel */}
      <div className="card min-w-0 overflow-hidden">
        {/* Toolbar */}
        <div className="flex flex-wrap items-end gap-[10px] p-3 border-b border-line">
          <label className="min-w-[190px]">
            <span>Label</span>
            <input
              value={label}
              onChange={(event) => setLabel(event.target.value)}
              placeholder="Object name"
              className="min-h-[40px]"
            />
          </label>

          <div
            className="inline-flex items-center gap-2 min-h-[40px]"
            aria-label="Polygon color"
          >
            {palette.map((swatch) => (
              <button
                key={swatch}
                className={`rounded-full w-7 h-7 p-0 border-2 border-white transition-shadow ${
                  swatch === color
                    ? "shadow-[0_0_0_3px_rgba(15,139,141,0.28)]"
                    : "shadow-[0_0_0_1px_#d9e1e7]"
                }`}
                style={{ backgroundColor: swatch }}
                type="button"
                onClick={() => setColor(swatch)}
                title={`Use ${swatch}`}
              />
            ))}
          </div>

          <button
            className="btn-icon"
            type="button"
            onClick={() => setDraft((points) => points.slice(0, -1))}
            title="Undo point"
          >
            <Undo2 size={18} aria-hidden="true" />
          </button>
          <button
            className="btn-icon text-coral"
            type="button"
            onClick={() => setDraft([])}
            title="Clear draft"
          >
            <Eraser size={18} aria-hidden="true" />
          </button>
          <button
            className="btn-primary"
            type="button"
            disabled={draft.length < 3 || saving}
            onClick={saveDraft}
          >
            <Save size={17} aria-hidden="true" />
            <span>{saving ? "Saving" : "Save polygon"}</span>
          </button>
        </div>

        {/* Canvas stage — checkerboard background */}
        <div
          className="relative w-full overflow-auto p-[18px] mx-auto"
          style={{
            background: [
              "linear-gradient(45deg,#e8eef2 25%,transparent 25%)",
              "linear-gradient(-45deg,#e8eef2 25%,transparent 25%)",
              "linear-gradient(45deg,transparent 75%,#e8eef2 75%)",
              "linear-gradient(-45deg,transparent 75%,#e8eef2 75%)",
            ].join(","),
            backgroundColor: "#f8fafb",
            backgroundSize: "20px 20px",
            backgroundPosition: "0 0,0 10px,10px -10px,-10px 0",
            maxHeight: "calc(100vh - 260px)",
          }}
        >
          <img
            ref={imgRef}
            src={image.url}
            alt={image.originalName}
            className="block h-auto max-w-full min-h-[240px] object-contain relative select-none z-[1]"
            onLoad={() => {
              const rect = imgRef.current?.getBoundingClientRect();
              if (rect)
                setSize({
                  width: Math.round(rect.width),
                  height: Math.round(rect.height),
                });
            }}
          />
          <canvas
            ref={canvasRef}
            onClick={addPoint}
            className="cursor-crosshair absolute top-[18px] left-[18px] z-[2]"
          />
        </div>
      </div>

      {/* Polygon panel */}
      <aside className="card grid gap-3 p-[14px] content-start">
        <header className="flex items-center justify-between">
          <h2 className="text-[1rem] m-0">Polygons</h2>
          <span className="inline-flex items-center justify-center bg-white border border-line rounded-lg text-muted text-[0.82rem] font-black h-[30px] min-w-[32px]">
            {image.polygons.length}
          </span>
        </header>

        <div className="grid gap-[10px]">
          {image.polygons.length ? (
            image.polygons.map((polygon, index) => (
              <div
                key={polygon.id}
                className="flex items-center gap-[10px] bg-surface-2 border border-line rounded-lg min-h-[58px] p-[10px]"
              >
                <span
                  className="shrink-0 w-[18px] h-[18px] rounded-full border-2 border-white shadow-[0_0_0_1px_#d9e1e7]"
                  style={{ backgroundColor: polygon.color }}
                />
                <div className="grid flex-1 gap-[2px] min-w-0">
                  <strong className="overflow-hidden text-ellipsis whitespace-nowrap">
                    {polygon.label || `Polygon ${index + 1}`}
                  </strong>
                  <span className="text-muted text-[0.78rem] font-bold overflow-hidden text-ellipsis whitespace-nowrap">
                    {polygon.points.length} points
                  </span>
                </div>
                <button
                  className="btn-mini text-coral"
                  type="button"
                  onClick={() => onDeletePolygon(polygon)}
                  title="Delete polygon"
                >
                  <Eraser size={15} aria-hidden="true" />
                </button>
              </div>
            ))
          ) : (
            <div className="flex items-center justify-center border border-dashed border-[#bdcbd5] rounded-lg text-muted text-[0.9rem] font-extrabold min-h-[90px] p-[18px] text-center">
              No polygons
            </div>
          )}
        </div>
      </aside>
    </section>
  );
}

function drawPolygon(
  context: CanvasRenderingContext2D,
  points: Point[],
  size: { width: number; height: number },
  color: string,
  label: string,
  draft: boolean,
) {
  if (!points.length) return;
  const toCanvas = (point: Point) => ({
    x: point.x * size.width,
    y: point.y * size.height,
  });
  const first = toCanvas(points[0]);
  context.save();
  context.beginPath();
  context.moveTo(first.x, first.y);
  points.slice(1).forEach((point) => {
    const next = toCanvas(point);
    context.lineTo(next.x, next.y);
  });
  if (!draft && points.length > 2) context.closePath();
  context.fillStyle = `${color}26`;
  context.strokeStyle = color;
  context.lineWidth = 2.5;
  if (draft) context.setLineDash([6, 6]);
  context.fill();
  context.stroke();
  context.setLineDash([]);
  points.forEach((point) => {
    const next = toCanvas(point);
    context.beginPath();
    context.arc(next.x, next.y, 4.5, 0, Math.PI * 2);
    context.fillStyle = "#ffffff";
    context.fill();
    context.strokeStyle = color;
    context.stroke();
  });
  context.font = "600 12px Inter, system-ui, sans-serif";
  context.fillStyle = color;
  context.fillText(label, first.x + 8, first.y - 8);
  context.restore();
}
