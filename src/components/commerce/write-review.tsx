"use client";

import { FormEvent, useRef, useState } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/field";
import { submitReview } from "@/services/reviews.service";
import { validateImageFile } from "@/services/media.service";
import { cn } from "@/lib/utils";

const MAX_IMAGES = 3;

function StarPicker({
  value,
  onChange,
}: {
  value: number;
  onChange: (rating: number) => void;
}) {
  return (
    <div className="flex items-center gap-1" role="radiogroup" aria-label="Your rating">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          role="radio"
          aria-checked={value === star}
          aria-label={`${star} star${star > 1 ? "s" : ""}`}
          onClick={() => onChange(star)}
          className="p-0.5"
        >
          <Star
            className={cn(
              "h-7 w-7 transition-colors",
              star <= value
                ? "fill-amber-400 text-amber-400"
                : "fill-line text-line hover:fill-amber-200 hover:text-amber-200",
            )}
            aria-hidden
          />
        </button>
      ))}
    </div>
  );
}

export function WriteReview({
  productId,
  productSlug,
  productName,
}: {
  productId: string;
  productSlug: string;
  productName: string;
}) {
  const [open, setOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [rating, setRating] = useState(0);
  const [text, setText] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const fileInput = useRef<HTMLInputElement>(null);

  const onPickFiles = (picked: FileList | null) => {
    if (!picked?.length) return;
    const next: File[] = [];
    for (const file of Array.from(picked)) {
      const check = validateImageFile(file);
      if (!check.ok) {
        setError(check.reason);
        continue;
      }
      next.push(file);
    }
    const merged = [...files, ...next].slice(0, MAX_IMAGES);
    if (files.length + next.length > MAX_IMAGES)
      setError(`You can attach up to ${MAX_IMAGES} images.`);
    setFiles(merged);
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await submitReview({
        productId,
        productSlug,
        productName,
        reviewerName: name,
        email: email || undefined,
        rating,
        text,
        images: files,
      });
      setSubmitted(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not submit your review.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="rounded-2xl border border-line bg-soft/50 p-6 text-center">
        <p className="text-[15px] font-semibold text-ink">
          Thanks for your review!
        </p>
        <p className="mt-1 text-[13px] text-muted">
          It has been submitted and will appear once approved by our team.
        </p>
      </div>
    );
  }

  if (!open) {
    return (
      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={() => setOpen(true)}
      >
        Write a review
      </Button>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-4 rounded-2xl border border-line bg-white p-5"
    >
      <h3 className="text-[15px] font-semibold text-ink">
        Review {productName}
      </h3>
      <div>
        <Label>Your rating</Label>
        <StarPicker value={rating} onChange={setRating} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="review-name">Name</Label>
          <Input
            id="review-name"
            required
            maxLength={80}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your display name"
          />
        </div>
        <div>
          <Label htmlFor="review-email">Email (optional — never shown)</Label>
          <Input
            id="review-email"
            type="email"
            maxLength={120}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="For verification only"
          />
        </div>
      </div>
      <div>
        <Label htmlFor="review-text">Your review</Label>
        <Textarea
          id="review-text"
          required
          maxLength={2000}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="What did you like or dislike about this product?"
        />
      </div>
      <div>
        <Label>Photos (optional, up to {MAX_IMAGES})</Label>
        <input
          ref={fileInput}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          onChange={(e) => {
            onPickFiles(e.target.files);
            e.target.value = "";
          }}
          className="block w-full text-[13px] text-muted file:mr-3 file:rounded-full file:border-0 file:bg-soft file:px-4 file:py-2 file:text-[13px] file:font-medium file:text-ink"
        />
        {files.length ? (
          <div className="mt-2 flex flex-wrap gap-2">
            {files.map((file, index) => (
              <span
                key={`${file.name}-${index}`}
                className="inline-flex items-center gap-1.5 rounded-full bg-soft px-3 py-1 text-[12px] text-ink"
              >
                {file.name.slice(0, 24)}
                <button
                  type="button"
                  aria-label={`Remove ${file.name}`}
                  onClick={() =>
                    setFiles((current) =>
                      current.filter((_, i) => i !== index),
                    )
                  }
                  className="text-muted hover:text-ink"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        ) : null}
      </div>
      {error ? (
        <p className="text-[13px] text-rose-600" role="alert">
          {error}
        </p>
      ) : null}
      <div className="flex gap-2">
        <Button type="submit" disabled={submitting || !rating}>
          {submitting ? "Submitting…" : "Submit review"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => setOpen(false)}
          disabled={submitting}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
