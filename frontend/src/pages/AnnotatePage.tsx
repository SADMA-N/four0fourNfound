import { Loader2, Upload } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { api } from "../api";
import { AnnotationCanvas } from "../components/AnnotationCanvas";
import { ImageScroller } from "../components/ImageScroller";
import type { AnnotatedImage, AnnotationPolygon, Point } from "../types";

export function AnnotatePage() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [images, setImages] = useState<AnnotatedImage[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const selectedImage = useMemo(
    () => images.find((image) => image.id === selectedId) ?? images[0] ?? null,
    [images, selectedId],
  );

  const loadImages = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.listImages();
      setImages(response.images);
      setSelectedId((current) => {
        if (current && response.images.some((image) => image.id === current))
          return current;
        return response.images[0]?.id ?? null;
      });
    } catch (nextError) {
      setError(
        nextError instanceof Error
          ? nextError.message
          : "Unable to load images.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadImages();
  }, [loadImages]);

  const uploadFiles = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (!files.length) return;
    setSaving(true);
    setError("");
    try {
      const response = await api.uploadImages(files);
      await loadImages();
      setSelectedId(response.images[0]?.id ?? null);
    } catch (nextError) {
      setError(
        nextError instanceof Error
          ? nextError.message
          : "Unable to upload images.",
      );
    } finally {
      setSaving(false);
    }
  };

  const addPolygon = async (points: Point[], label: string, color: string) => {
    if (!selectedImage) return;
    setSaving(true);
    setError("");
    try {
      const response = await api.createPolygon(selectedImage.id, {
        points,
        label,
        color,
      });
      setImages((current) =>
        current.map((image) =>
          image.id === selectedImage.id
            ? { ...image, polygons: [...image.polygons, response.polygon] }
            : image,
        ),
      );
    } catch (nextError) {
      setError(
        nextError instanceof Error
          ? nextError.message
          : "Unable to save polygon.",
      );
    } finally {
      setSaving(false);
    }
  };

  const deletePolygon = async (polygon: AnnotationPolygon) => {
    if (!selectedImage) return;
    setImages((current) =>
      current.map((image) =>
        image.id === selectedImage.id
          ? {
              ...image,
              polygons: image.polygons.filter((item) => item.id !== polygon.id),
            }
          : image,
      ),
    );
    try {
      await api.deletePolygon(polygon.id);
    } catch (nextError) {
      setError(
        nextError instanceof Error
          ? nextError.message
          : "Unable to delete polygon.",
      );
      await loadImages();
    }
  };

  const deleteImage = async (imageId: number) => {
    const previous = images;
    setImages((current) => current.filter((image) => image.id !== imageId));
    setSelectedId(null);
    try {
      await api.deleteImage(imageId);
    } catch (nextError) {
      setImages(previous);
      setError(
        nextError instanceof Error
          ? nextError.message
          : "Unable to delete image.",
      );
    }
  };

  const imageCountLabel = `${images.length} ${
    images.length === 1 ? "image" : "images"
  }`;

  return (
    <section className="grid gap-4">
      {/* ── Workspace header ──────────────────────────────────── */}
      {/* Compact: monospace eyebrow + h1 + live count + upload   */}
      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <span
            className="mono block text-[0.65rem] leading-none tracking-[0.12em] text-muted mb-[6px] select-none"
            aria-hidden="true"
          >
            ANNOTATE — WORKSPACE
          </span>
          <h1 className="text-[1.35rem] font-semibold text-ink m-0 leading-none">
            Image Annotation
          </h1>
          <p
            className="text-muted text-[0.82rem] mt-[5px] mb-0"
            aria-live="polite"
          >
            {loading ? "Loading…" : imageCountLabel}
          </p>
        </div>

        <div className="flex items-center gap-[10px] flex-wrap">
          {/* Hidden file input — triggered by both header and empty-state buttons */}
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            multiple
            onChange={uploadFiles}
            aria-label="Choose image files to upload"
            hidden
          />
          <button
            className="btn-primary"
            type="button"
            disabled={saving}
            onClick={() => inputRef.current?.click()}
          >
            {saving ? (
              <Loader2 className="spin" size={17} aria-hidden="true" />
            ) : (
              <Upload size={17} aria-hidden="true" />
            )}
            <span>{saving ? "Uploading…" : "Upload images"}</span>
          </button>
        </div>
      </header>

      {/* ── Error banner ──────────────────────────────────────── */}
      {error ? (
        <div className="page-error" role="alert">
          {error}
        </div>
      ) : null}

      {/* ── Page body ─────────────────────────────────────────── */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[280px]">
          <Loader2 className="spin" size={24} aria-label="Loading images" />
        </div>
      ) : (
        <>
          {/* Thumbnail film-strip rail */}
          <ImageScroller
            images={images}
            selectedId={selectedImage?.id ?? null}
            onSelect={setSelectedId}
            onDelete={deleteImage}
          />

          {/* Main canvas workspace or empty state */}
          {selectedImage ? (
            <AnnotationCanvas
              key={selectedImage.id}
              image={selectedImage}
              saving={saving}
              onAddPolygon={addPolygon}
              onDeletePolygon={deletePolygon}
            />
          ) : (
            /* ── Empty state ──────────────────────────────────── */
            /* Shown when no images have been uploaded yet.        */
            <div className="card flex flex-col items-center justify-center gap-4 min-h-[380px] p-[34px] text-center">
              <div
                className="flex items-center justify-center rounded-full bg-surface-2 border border-line"
                style={{ width: 56, height: 56 }}
                aria-hidden="true"
              >
                <Upload size={22} className="text-muted" />
              </div>
              <div>
                <h2 className="text-[1.05rem] font-semibold text-ink m-0 mb-[6px]">
                  Upload an image to begin annotating
                </h2>
                <p className="text-muted text-[0.87rem] m-0">
                  Supported formats: PNG, JPEG, WebP
                </p>
              </div>
              <button
                className="btn-ghost"
                type="button"
                onClick={() => inputRef.current?.click()}
                disabled={saving}
              >
                <Upload size={15} aria-hidden="true" />
                <span>Choose an image</span>
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
