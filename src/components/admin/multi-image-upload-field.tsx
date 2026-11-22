"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, GripVertical } from "lucide-react";
import { uploadAdminImage, type MediaFolder } from "@/services/media.service";
import { cn } from "@/lib/utils";

export function MultiImageUploadField({
  label,
  folder,
  value,
  onChange,
  idHint = "image",
}: {
  label: string;
  folder: MediaFolder;
  value: string[];
  onChange: (urls: string[]) => void;
  idHint?: string;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  const move = (from: number, to: number) => {
    if (from === to || to < 0 || to >= value.length) return;
    const next = [...value];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(next);
  };

  return (
    <div>
      <label className="mb-2 block text-[13px] font-medium text-ink">
        {label}
      </label>
      {value.length ? (
        <div className="mb-3 flex flex-wrap gap-2">
          {value.map((url, index) => (
            <div
              key={`${url}-${index}`}
              draggable
              onDragStart={(event) => {
                setDragIndex(index);
                event.dataTransfer.effectAllowed = "move";
                event.dataTransfer.setData("text/plain", String(index));
              }}
              onDragOver={(event) => {
                event.preventDefault();
                event.dataTransfer.dropEffect = "move";
                setOverIndex(index);
              }}
              onDragLeave={() =>
                setOverIndex((current) => (current === index ? null : current))
              }
              onDrop={(event) => {
                event.preventDefault();
                const from =
                  dragIndex ?? Number(event.dataTransfer.getData("text/plain"));
                if (Number.isInteger(from)) move(from, index);
                setDragIndex(null);
                setOverIndex(null);
              }}
              onDragEnd={() => {
                setDragIndex(null);
                setOverIndex(null);
              }}
              className={cn(
                "relative cursor-grab rounded-xl border-2 transition-colors active:cursor-grabbing",
                overIndex === index && dragIndex !== index
                  ? "border-primary"
                  : "border-transparent",
                dragIndex === index && "opacity-50",
              )}
              title="Drag to reorder"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt=""
                className="h-20 w-20 rounded-xl border border-line object-cover"
                draggable={false}
              />
              <span className="pointer-events-none absolute bottom-1 left-1 rounded bg-ink/60 px-1 text-[10px] font-medium text-white">
                {index + 1}
              </span>
              <span className="pointer-events-none absolute inset-x-0 top-1 flex justify-center">
                <GripVertical className="h-3.5 w-3.5 text-white drop-shadow" aria-hidden />
              </span>
              <button
                type="button"
                aria-label="Remove image"
                onClick={() => onChange(value.filter((_, i) => i !== index))}
                className="absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full bg-ink text-[11px] text-white"
              >
                ×
              </button>
              <span className="absolute -bottom-2 left-1/2 flex -translate-x-1/2 gap-1">
                <button
                  type="button"
                  aria-label="Move image earlier"
                  disabled={index === 0}
                  onClick={() => move(index, index - 1)}
                  className="grid h-5 w-5 place-items-center rounded-full border border-line bg-white text-muted shadow-sm disabled:opacity-40"
                >
                  <ChevronLeft className="h-3 w-3" aria-hidden />
                </button>
                <button
                  type="button"
                  aria-label="Move image later"
                  disabled={index === value.length - 1}
                  onClick={() => move(index, index + 1)}
                  className="grid h-5 w-5 place-items-center rounded-full border border-line bg-white text-muted shadow-sm disabled:opacity-40"
                >
                  <ChevronRight className="h-3 w-3" aria-hidden />
                </button>
              </span>
            </div>
          ))}
        </div>
      ) : null}
      {value.length > 1 ? (
        <p className="mb-2 text-[11px] text-muted">
          Drag images to reorder — the first image is used as the product
          thumbnail.
        </p>
      ) : null}
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        multiple
        disabled={uploading}
        onChange={(event) => {
          const files = Array.from(event.target.files ?? []);
          if (!files.length) return;
          setUploading(true);
          setError(null);
          void (async () => {
            const urls: string[] = [];
            for (const file of files) {
              urls.push(await uploadAdminImage(folder, file, idHint));
            }
            return urls;
          })()
            .then((urls) => onChange([...value, ...urls]))
            .catch((err) =>
              setError(
                err instanceof Error ? err.message : "Upload failed.",
              ),
            )
            .finally(() => {
              setUploading(false);
              event.target.value = "";
            });
        }}
        className="block w-full text-[13px] text-muted file:mr-3 file:rounded-full file:border-0 file:bg-soft file:px-4 file:py-2 file:text-[13px] file:font-medium file:text-ink"
      />
      {uploading ? (
        <p className="mt-1 text-[12px] text-muted">Uploading…</p>
      ) : null}
      {error ? (
        <p className="mt-1 text-[12px] text-rose-600" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
