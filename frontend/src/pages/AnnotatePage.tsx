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

  return (
    <section className="grid gap-5">
      <header className="flex items-end justify-between gap-[18px]">
        <div>
          <span className="block text-teal text-[0.78rem] font-black uppercase mb-[10px] tracking-tight">
            Annotation page
          </span>
          <h1 className="text-[clamp(2rem,4vw,4rem)] leading-none tracking-tight m-0">
            A great annotation ahead
          </h1>
          <p className="text-muted mt-2 mb-0">
            {images.length} uploaded {images.length === 1 ? "image" : "images"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-[10px] justify-end">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={uploadFiles}
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
            <span>{saving ? "Working" : "Upload"}</span>
          </button>
        </div>
      </header>

      {error ? <div className="page-error">{error}</div> : null}

      {loading ? (
        <div className="flex items-center justify-center min-h-[280px]">
          <Loader2 className="spin" aria-hidden="true" />
        </div>
      ) : (
        <>
          <ImageScroller
            images={images}
            selectedId={selectedImage?.id ?? null}
            onSelect={setSelectedId}
            onDelete={deleteImage}
          />
          {selectedImage ? (
            <AnnotationCanvas
              key={selectedImage.id}
              image={selectedImage}
              saving={saving}
              onAddPolygon={addPolygon}
              onDeletePolygon={deletePolygon}
            />
          ) : (
            <div className="card flex flex-col items-center justify-center gap-2 min-h-[340px] p-[34px] text-center text-muted">
              <Upload size={24} aria-hidden="true" />
              <h2 className="text-[1rem] m-0">Upload an image</h2>
              <p className="m-0">
                PNG, JPG, or WebP files can be annotated and saved.
              </p>
            </div>
          )}
        </>
      )}
    </section>
  );
}
