"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  AdminEmpty,
  AdminPageHeader,
  AdminTable,
} from "@/components/admin/admin-ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/field";
import { Rating } from "@/components/ui/rating";
import { RequireAdmin } from "@/components/auth/require-admin";
import {
  approveReviewAdmin,
  deleteReviewAdmin,
  listAllReviewsAdmin,
  rejectReviewAdmin,
  reviewStatus,
  unapproveReviewAdmin,
  updateReviewAdmin,
  type AdminReview,
} from "@/services/admin-reviews.service";
import { useUserStore } from "@/stores/user.store";
import { toastError, toastSuccess } from "@/stores/toast.store";
import { formatDate } from "@/utils/date";

const STATUS_TONES = {
  pending: "warning",
  approved: "success",
  rejected: "ink",
} as const;

const emptyEdit = {
  reviewBy: "",
  email: "",
  rating: "5",
  title: "",
  review: "",
};

export default function ReviewsAdminPage() {
  const authUser = useUserStore((s) => s.authUser);
  const profile = useUserStore((s) => s.profile);
  const actor = {
    id: authUser?.uid ?? "",
    email: profile?.email ?? authUser?.email ?? undefined,
  };

  const [items, setItems] = useState<AdminReview[]>([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState(emptyEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = async () => {
    setLoading(true);
    try {
      setItems(await listAllReviewsAdmin());
    } catch {
      setError("Could not load reviews.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void reload();
  }, []);

  const filtered = useMemo(() => {
    let next = items;
    if (status !== "all")
      next = next.filter((r) => reviewStatus(r) === status);
    const q = query.trim().toLowerCase();
    if (q) {
      next = next.filter((r) =>
        [r.productName, r.productSlug, r.reviewBy, r.email, r.review, r.comment]
          .join(" ")
          .toLowerCase()
          .includes(q),
      );
    }
    return next;
  }, [items, query, status]);

  const counts = useMemo(() => {
    const tally = { all: items.length, pending: 0, approved: 0, rejected: 0 };
    for (const r of items) tally[reviewStatus(r)] += 1;
    return tally;
  }, [items]);

  const run = async (fn: () => Promise<unknown>, message: string) => {
    if (!actor.id) return;
    try {
      await fn();
      toastSuccess(message);
      await reload();
    } catch (err) {
      toastError(
        "Action failed",
        err instanceof Error ? err.message : "Please try again.",
      );
    }
  };

  const startEdit = (review: AdminReview) => {
    setEditingId(review.id);
    setEditForm({
      reviewBy: review.reviewBy ?? "",
      email: review.email ?? "",
      rating: String(review.rating ?? 5),
      title: review.title ?? "",
      review: review.review ?? review.comment ?? "",
    });
  };

  const onEditSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!editingId || !actor.id) return;
    setSaving(true);
    try {
      await updateReviewAdmin(
        editingId,
        {
          reviewBy: editForm.reviewBy,
          email: editForm.email,
          rating: Number(editForm.rating),
          title: editForm.title,
          review: editForm.review,
        },
        actor,
      );
      toastSuccess("Review updated");
      setEditingId(null);
      await reload();
    } catch (err) {
      toastError(
        "Save failed",
        err instanceof Error ? err.message : "Could not save review.",
      );
    } finally {
      setSaving(false);
    }
  };

  const onDelete = (review: AdminReview) => {
    if (
      !window.confirm(
        `Delete the review by ${review.reviewBy ?? "this customer"}? This cannot be undone.`,
      )
    )
      return;
    void run(() => deleteReviewAdmin(review.id, actor), "Review deleted");
  };

  return (
    <RequireAdmin permission="reviews:write">
      <AdminPageHeader
        title="Reviews"
        description="Moderate customer product reviews. Only approved reviews appear on the storefront."
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Input
          placeholder="Search product, reviewer or email…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="max-w-xs"
        />
        <Select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="w-auto"
        >
          <option value="all">All ({counts.all})</option>
          <option value="pending">Pending ({counts.pending})</option>
          <option value="approved">Approved ({counts.approved})</option>
          <option value="rejected">Rejected ({counts.rejected})</option>
        </Select>
      </div>

      {loading ? (
        <AdminEmpty title="Loading reviews…" />
      ) : !filtered.length ? (
        <AdminEmpty title="No reviews found" />
      ) : (
        <AdminTable
          headers={[
            "Product",
            "Reviewer",
            "Rating",
            "Review",
            "Submitted",
            "Status",
            "Actions",
          ]}
        >
          {filtered.map((review) => {
            const state = reviewStatus(review);
            return (
              <tr key={review.id} className="align-top text-[13px]">
                <td className="px-4 py-3">
                  <p className="font-medium text-ink">
                    {review.productName || review.productSlug || review.productId}
                  </p>
                  <p className="text-[11px] text-muted">{review.productId}</p>
                </td>
                <td className="px-4 py-3">
                  <p className="font-medium text-ink">
                    {review.reviewBy ?? "—"}
                  </p>
                  {review.email ? (
                    <p className="text-[11px] text-muted">{review.email}</p>
                  ) : null}
                </td>
                <td className="px-4 py-3">
                  <Rating value={review.rating ?? 0} showValue={false} />
                </td>
                <td className="max-w-[280px] px-4 py-3">
                  {review.title ? (
                    <p className="font-medium text-ink">{review.title}</p>
                  ) : null}
                  <p className="line-clamp-3 text-muted">
                    {review.review ?? review.comment}
                  </p>
                  {review.images?.length ? (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {review.images.map((url) => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          key={url}
                          src={url}
                          alt="Review attachment"
                          className="h-10 w-10 rounded-lg border border-line object-cover"
                        />
                      ))}
                    </div>
                  ) : null}
                </td>
                <td className="px-4 py-3 text-muted">
                  {review.createdAt ? formatDate(review.createdAt) : "—"}
                </td>
                <td className="px-4 py-3">
                  <Badge tone={STATUS_TONES[state]}>{state}</Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    {state !== "approved" ? (
                      <button
                        type="button"
                        className="text-primary hover:underline"
                        onClick={() =>
                          void run(
                            () => approveReviewAdmin(review.id, actor, review),
                            "Review approved",
                          )
                        }
                      >
                        Approve
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="text-muted hover:underline"
                        onClick={() =>
                          void run(
                            () =>
                              unapproveReviewAdmin(review.id, actor, review),
                            "Review unpublished",
                          )
                        }
                      >
                        Unapprove
                      </button>
                    )}
                    {state !== "rejected" ? (
                      <button
                        type="button"
                        className="text-muted hover:underline"
                        onClick={() =>
                          void run(
                            () => rejectReviewAdmin(review.id, actor, review),
                            "Review rejected",
                          )
                        }
                      >
                        Reject
                      </button>
                    ) : null}
                    <button
                      type="button"
                      className="text-primary hover:underline"
                      onClick={() => startEdit(review)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="text-rose-600 hover:underline"
                      onClick={() => onDelete(review)}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </AdminTable>
      )}

      {editingId ? (
        <div className="fixed inset-0 z-50 grid place-items-center p-4">
          <button
            type="button"
            aria-label="Close"
            className="absolute inset-0 bg-ink/50"
            onClick={() => setEditingId(null)}
          />
          <form
            onSubmit={onEditSubmit}
            className="relative w-full max-w-lg space-y-3 rounded-2xl bg-white p-5 shadow-xl"
          >
            <h2 className="text-sm font-semibold text-ink">Edit review</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="edit-name">Reviewer name</Label>
                <Input
                  id="edit-name"
                  required
                  value={editForm.reviewBy}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, reviewBy: e.target.value }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="edit-email">Email (private)</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editForm.email}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, email: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="edit-rating">Rating (1–5)</Label>
                <Input
                  id="edit-rating"
                  type="number"
                  min={1}
                  max={5}
                  required
                  value={editForm.rating}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, rating: e.target.value }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="edit-title">Title</Label>
                <Input
                  id="edit-title"
                  value={editForm.title}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, title: e.target.value }))
                  }
                />
              </div>
            </div>
            <div>
              <Label htmlFor="edit-review">Review text</Label>
              <Textarea
                id="edit-review"
                required
                value={editForm.review}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, review: e.target.value }))
                }
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={saving}>
                {saving ? "Saving…" : "Save changes"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditingId(null)}
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      ) : null}
      {error ? <p className="mt-3 text-[13px] text-rose-600">{error}</p> : null}
    </RequireAdmin>
  );
}
