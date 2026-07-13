import { Eraser, Save, Trash2, Undo2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { MouseEvent } from "react";
import type { AnnotatedImage, AnnotationPolygon, Point } from "../types";

/* ── Color palette with human-readable names ─────────────────────── */
const palette: Array<{ hex: string; name: string }> = [
  { hex: "#0f8b8d", name: "Teal" },
  { hex: "#ef476f", name: "Red" },
  { hex: "#2d6cdf", name: "Blue" },
  { hex: "#f59f00", name: "Amber" },
  { hex: "#118c4f", name: "Green" },
];

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
  const [color, setColor] = useState(palette[0].hex);

  /* ── Reset draft state when selected image changes ─────────────── */
  useEffect(() => {
    setDraft([]);
    setLabel("");
  }, [image.id]);

  /* ── Sync canvas size to rendered image size ───────────────────── */
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

  /* ── Redraw canvas whenever polygons / draft / size change ──────── */
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

  /* ── Place a point on the canvas ──────────────────────────────── */
  const addPoint = (event: MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    if (x < 0 || x > 1 || y < 0 || y > 1) return;
    setDraft((points) => [...points, { x, y }]);
  };

  /* ── Persist the current draft as a polygon ────────────────────── */
  const saveDraft = async () => {
    if (draft.length < 3) return;
    await onAddPolygon(draft, label, color);
    setDraft([]);
    setLabel("");
  };

  const draftPointCount = draft.length;
  const canSave = draftPointCount >= 3 && !saving;

  return (
    /* ── Two-column layout: canvas dominant, polygon panel at right ─ */
    /* On small screens the layout stacks vertically.                  */
    <div
      className="flex flex-col gap-4 lg:grid"
      style={{ gridTemplateColumns: "minmax(0,1fr) 290px" }}
    >
      {/* ── Canvas panel ──────────────────────────────────────── */}
      <div className="card min-w-0 overflow-hidden">

        {/* Toolbar */}
        <div
          className="flex flex-wrap items-end gap-[10px] p-3 border-b border-line"
          role="toolbar"
          aria-label="Annotation tools"
        >
          {/* Label input */}
          <label className="min-w-[180px]">
            <span>Label</span>
            <input
              value={label}
              onChange={(event) => setLabel(event.target.value)}
              placeholder="Object name"
              className="min-h-[40px]"
            />
          </label>

          {/* Color swatches */}
          <div
            className="inline-flex items-center gap-2 min-h-[40px]"
            role="group"
            aria-label="Polygon color"
          >
            {palette.map((swatch) => (
              <button
                key={swatch.hex}
                className={`rounded-full w-7 h-7 p-0 border-2 border-white transition-shadow ${
                  swatch.hex === color
                    ? "shadow-[0_0_0_3px_rgba(15,139,141,0.28)]"
                    : "shadow-[0_0_0_1px_#d9e1e7]"
                }`}
                style={{ backgroundColor: swatch.hex }}
                type="button"
                onClick={() => setColor(swatch.hex)}
                aria-label={`${swatch.name}${swatch.hex === color ? " (selected)" : ""}`}
                aria-pressed={swatch.hex === color}
                title={swatch.name}
              />
            ))}
          </div>

          {/* Undo — remove last placed point */}
          <button
            className="btn-ghost px-3"
            type="button"
            onClick={() => setDraft((points) => points.slice(0, -1))}
            disabled={draftPointCount === 0}
            aria-label="Undo last point"
            title="Undo last point"
          >
            <Undo2 size={16} aria-hidden="true" />
            <span>Undo</span>
          </button>

          {/* Clear — discard all draft points */}
          <button
            className="btn-ghost px-3"
            type="button"
            onClick={() => setDraft([])}
            disabled={draftPointCount === 0}
            aria-label="Clear all draft points"
            title="Clear all draft points"
          >
            <Eraser size={16} aria-hidden="true" />
            <span>Clear</span>
          </button>

          {/* Save polygon */}
          <button
            className="btn-primary"
            type="button"
            disabled={!canSave}
            onClick={saveDraft}
            aria-label={
              saving
                ? "Saving polygon"
                : `Save polygon${draftPointCount >= 3 ? ` (${draftPointCount} points)` : ""}`
            }
          >
            <Save size={16} aria-hidden="true" />
            <span>{saving ? "Saving…" : "Save polygon"}</span>
          </button>
        </div>

        {/* Draft point counter — live feedback shown only while drawing */}
        {draftPointCount > 0 && (
          <div
            className="px-3 py-[6px] border-b border-line bg-surface-2 mono text-[0.78rem] text-muted"
            aria-live="polite"
          >
            {draftPointCount} point{draftPointCount !== 1 ? "s" : ""} placed
            {draftPointCount < 3
              ? ` — add ${3 - draftPointCount} more to save`
              : " — ready to save"}
          </div>
        )}

        {/* ── Canvas stage — checkerboard background ────────── */}
        {/* Background pattern helps distinguish transparent/unused areas */}
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
            aria-label="Annotation canvas — click to place polygon points"
            role="img"
          />
        </div>
      </div>

      {/* ── Polygon panel ─────────────────────────────────────── */}
      <aside
        className="card grid gap-3 p-[14px] content-start"
        aria-label="Saved polygons"
      >
        <header className="flex items-center justify-between">
          <h2 className="text-[1rem] font-semibold m-0">Polygons</h2>
          <span
            className="inline-flex items-center justify-center bg-white border border-line rounded-lg text-muted mono text-[0.82rem] font-bold h-[30px] min-w-[32px] px-2"
            aria-label={`${image.polygons.length} saved polygon${
              image.polygons.length !== 1 ? "s" : ""
            }`}
          >
            {image.polygons.length}
          </span>
        </header>

        <div className="grid gap-[8px]">
          {image.polygons.length ? (
            image.polygons.map((polygon, index) => (
              <div
                key={polygon.id}
                className="flex items-center gap-[10px] bg-surface-2 border border-line rounded-lg min-h-[52px] p-[10px]"
              >
                {/* Color dot */}
                <span
                  className="shrink-0 w-[16px] h-[16px] rounded-full border-2 border-white shadow-[0_0_0_1px_#d9e1e7]"
                  style={{ backgroundColor: polygon.color }}
                  aria-hidden="true"
                />
                {/* Label and point count */}
                <div className="grid flex-1 gap-[2px] min-w-0">
                  <strong className="text-[0.87rem] overflow-hidden text-ellipsis whitespace-nowrap">
                    {polygon.label || `Polygon ${index + 1}`}
                  </strong>
                  <span className="text-muted mono text-[0.75rem] font-semibold overflow-hidden text-ellipsis whitespace-nowrap">
                    {polygon.points.length} pts
                  </span>
                </div>
                {/* Delete polygon */}
                <button
                  className="btn-mini text-coral shrink-0"
                  type="button"
                  onClick={() => onDeletePolygon(polygon)}
                  aria-label={`Delete polygon: ${
                    polygon.label || `Polygon ${index + 1}`
                  }`}
                  title="Delete polygon"
                >
                  <Trash2 size={14} aria-hidden="true" />
                </button>
              </div>
            ))
          ) : (
            <div className="flex items-center justify-center border border-dashed border-line rounded-lg text-muted text-[0.82rem] min-h-[90px] p-[18px] text-center leading-relaxed">
              Click on the image to place polygon points
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}

/* ── Canvas drawing function ─────────────────────────────────────── */
/* Preserved exactly as originally authored — no changes.            */
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
