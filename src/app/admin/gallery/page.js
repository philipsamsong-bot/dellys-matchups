// src/app/admin/gallery/page.js

"use client";

import { useEffect, useState } from "react";
import DashboardChrome from "@/app/components/DashboardChrome";
import { supabase } from "@/lib/supabase";

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const emptyForm = {
  title: "",
  category: "General",
  image_url: "",
  featured: false,
  published: true,
};

function getErrorMessage(error) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Something went wrong.";
}

function getImageExtension(file) {
  switch (file.type) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    default:
      return "";
  }
}

export default function AdminGalleryPage() {
  const [form, setForm] = useState(emptyForm);
  const [images, setImages] = useState([]);
  const [loadingImages, setLoadingImages] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  const [pageError, setPageError] = useState("");
  const [adminReady, setAdminReady] = useState(false);

  useEffect(() => {
    void loadImages();
  }, []);

  async function getAccessToken() {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) {
      throw new Error(error.message);
    }

    if (!session?.access_token) {
      window.location.href = "/auth/login";
      throw new Error("Not authenticated.");
    }

    return session.access_token;
  }

  async function adminFetch(url, options = {}) {
    const token = await getAccessToken();

    const response = await fetch(url, {
      ...options,
      headers: {
        ...(options.headers || {}),
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    let data = {};

    try {
      data = await response.json();
    } catch {
      data = {};
    }

    if (response.status === 401) {
      window.location.href = "/auth/login";
      throw new Error(data.error || "Your session has expired.");
    }

    if (response.status === 403) {
      window.location.href = "/dashboard";
      throw new Error(data.error || "Admin access required.");
    }

    if (!response.ok) {
      throw new Error(
        data.error || "Unable to complete the admin request.",
      );
    }

    return data;
  }

  async function loadImages() {
    setLoadingImages(true);
    setPageError("");

    try {
      const data = await adminFetch("/api/admin/gallery", {
        method: "GET",
      });

      setImages(
        Array.isArray(data.images)
          ? data.images
          : [],
      );

      setAdminReady(true);
    } catch (error) {
      setAdminReady(false);
      setPageError(getErrorMessage(error));
    } finally {
      setLoadingImages(false);
    }
  }

  async function handleImageUpload(event) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!adminReady) {
      alert("Admin access has not been verified.");
      event.target.value = "";
      return;
    }

    if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
      alert("Gallery image must be JPG, PNG, or WEBP.");
      event.target.value = "";
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      alert("Gallery image must be 10 MB or smaller.");
      event.target.value = "";
      return;
    }

    const extension = getImageExtension(file);

    if (!extension) {
      alert("Unsupported image format.");
      event.target.value = "";
      return;
    }

    setUploading(true);

    try {
      const fileName =
        `gallery/${Date.now()}-${crypto.randomUUID()}.${extension}`;

      const { error } = await supabase.storage
        .from("content-images")
        .upload(fileName, file, {
          cacheControl: "3600",
          contentType: file.type,
          upsert: false,
        });

      if (error) {
        throw new Error(error.message);
      }

      const { data } = supabase.storage
        .from("content-images")
        .getPublicUrl(fileName);

      if (!data?.publicUrl) {
        throw new Error(
          "Uploaded gallery image URL was not returned.",
        );
      }

      setForm((current) => ({
        ...current,
        image_url: data.publicUrl,
      }));
    } catch (error) {
      alert(getErrorMessage(error));
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (submitting || uploading) {
      return;
    }

    const title = form.title.trim();
    const category = form.category.trim() || "General";
    const imageUrl = form.image_url.trim();

    if (!title || !imageUrl) {
      alert("Title and image are required.");
      return;
    }

    setSubmitting(true);

    try {
      const data = await adminFetch("/api/admin/gallery", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          category,
          image_url: imageUrl,
          featured: Boolean(form.featured),
          published: Boolean(form.published),
        }),
      });

      if (!data.image) {
        throw new Error(
          "The created gallery image was not returned.",
        );
      }

      setImages((currentImages) => [
        data.image,
        ...currentImages,
      ]);

      setForm(emptyForm);

      alert(
        data.image.published
          ? "Gallery image published."
          : "Gallery image saved as draft.",
      );
    } catch (error) {
      alert(getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  async function togglePublished(image) {
    if (updatingId !== null) {
      return;
    }

    const nextPublished = !image.published;

    const confirmed = window.confirm(
      `${nextPublished ? "Publish" : "Unpublish"} "${image.title}"?`,
    );

    if (!confirmed) {
      return;
    }

    setUpdatingId(image.id);

    try {
      const data = await adminFetch("/api/admin/gallery", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: image.id,
          published: nextPublished,
        }),
      });

      if (!data.image) {
        throw new Error(
          "The updated gallery image was not returned.",
        );
      }

      setImages((currentImages) =>
        currentImages.map((currentImage) =>
          currentImage.id === image.id
            ? data.image
            : currentImage,
        ),
      );

      alert(
        nextPublished
          ? "Gallery image published."
          : "Gallery image unpublished.",
      );
    } catch (error) {
      alert(getErrorMessage(error));
    } finally {
      setUpdatingId(null);
    }
  }

  async function toggleFeatured(image) {
    if (updatingId !== null) {
      return;
    }

    const nextFeatured = !image.featured;

    setUpdatingId(image.id);

    try {
      const data = await adminFetch("/api/admin/gallery", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: image.id,
          featured: nextFeatured,
        }),
      });

      if (!data.image) {
        throw new Error(
          "The updated gallery image was not returned.",
        );
      }

      setImages((currentImages) =>
        currentImages.map((currentImage) =>
          currentImage.id === image.id
            ? data.image
            : currentImage,
        ),
      );

      alert(
        nextFeatured
          ? "Gallery image marked as featured."
          : "Gallery image removed from featured.",
      );
    } catch (error) {
      alert(getErrorMessage(error));
    } finally {
      setUpdatingId(null);
    }
  }

  async function deleteImage(image) {
    if (updatingId !== null) {
      return;
    }

    const confirmed = window.confirm(
      `Delete "${image.title}" permanently?`,
    );

    if (!confirmed) {
      return;
    }

    setUpdatingId(image.id);

    try {
      await adminFetch(
        `/api/admin/gallery?id=${encodeURIComponent(image.id)}`,
        {
          method: "DELETE",
        },
      );

      setImages((currentImages) =>
        currentImages.filter(
          (currentImage) =>
            currentImage.id !== image.id,
        ),
      );

      alert("Gallery image deleted.");
    } catch (error) {
      alert(getErrorMessage(error));
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <>
      <DashboardChrome />

      <main className="min-h-screen bg-[#b30018] px-6 py-16 text-white">
        <div className="mx-auto max-w-7xl">
          <a
            href="/dashboard"
            className="font-bold text-white/70 hover:text-white"
          >
            ← Back to Dashboard
          </a>

          <p className="mt-8 font-black uppercase tracking-[0.35em] text-red-100">
            Admin
          </p>

          <h1 className="font-display mt-4 text-6xl font-bold">
            Gallery
          </h1>

          <p className="mt-5 max-w-3xl text-white/70">
            Upload gallery images, save drafts, publish or
            unpublish them, feature or unfeature items, and
            remove old media.
          </p>

          {pageError && (
            <div className="mt-8 rounded-[2rem] bg-white p-6 text-[#b30018]">
              <p className="font-black">
                Unable to load gallery images
              </p>

              <p className="mt-3">
                {pageError}
              </p>

              <button
                type="button"
                onClick={() => void loadImages()}
                className="mt-5 rounded-full bg-[#b30018] px-5 py-3 font-black text-white"
              >
                Try Again
              </button>
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="mt-10 rounded-[3rem] bg-black/25 p-8 shadow-2xl"
          >
            <input
              type="text"
              placeholder="Image title"
              value={form.title}
              maxLength={300}
              required
              disabled={!adminReady || submitting}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  title: event.target.value,
                }))
              }
              className="w-full rounded-2xl bg-white/10 px-5 py-4 text-white outline-none placeholder:text-white/50 disabled:opacity-50"
            />

            <input
              type="text"
              placeholder="Category"
              value={form.category}
              maxLength={150}
              disabled={!adminReady || submitting}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  category: event.target.value,
                }))
              }
              className="mt-5 w-full rounded-2xl bg-white/10 px-5 py-4 text-white outline-none placeholder:text-white/50 disabled:opacity-50"
            />

            <div className="mt-5 rounded-2xl bg-white/10 p-5">
              <p className="mb-3 font-black">
                Gallery Image
              </p>

              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                disabled={
                  !adminReady ||
                  uploading ||
                  submitting
                }
                onChange={handleImageUpload}
                className="w-full rounded-2xl bg-white/10 px-5 py-4 text-white disabled:opacity-50"
              />

              <p className="mt-3 text-sm text-white/60">
                JPG, PNG or WEBP. Maximum 10 MB.
              </p>

              {uploading && (
                <p className="mt-3 text-sm text-white/70">
                  Uploading image...
                </p>
              )}

              {form.image_url && (
                <div className="mt-5">
                  <img
                    src={form.image_url}
                    alt="Gallery preview"
                    className="max-h-[420px] w-full rounded-2xl object-contain"
                  />

                  <button
                    type="button"
                    disabled={submitting || uploading}
                    onClick={() =>
                      setForm((current) => ({
                        ...current,
                        image_url: "",
                      }))
                    }
                    className="mt-4 rounded-full border border-white/20 px-5 py-3 font-black text-white disabled:opacity-50"
                  >
                    Remove Image
                  </button>
                </div>
              )}
            </div>

            <div className="mt-5 flex flex-wrap gap-6">
              <label className="flex items-center gap-3 font-bold">
                <input
                  type="checkbox"
                  checked={form.featured}
                  disabled={!adminReady || submitting}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      featured: event.target.checked,
                    }))
                  }
                />
                Featured
              </label>

              <label className="flex items-center gap-3 font-bold">
                <input
                  type="checkbox"
                  checked={form.published}
                  disabled={!adminReady || submitting}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      published: event.target.checked,
                    }))
                  }
                />
                Publish immediately
              </label>
            </div>

            <button
              type="submit"
              disabled={
                !adminReady ||
                submitting ||
                uploading
              }
              className="mt-8 rounded-full bg-white px-8 py-4 font-black text-[#b30018] disabled:opacity-60"
            >
              {submitting
                ? form.published
                  ? "Publishing..."
                  : "Saving Draft..."
                : form.published
                  ? "Publish Gallery Image"
                  : "Save Gallery Image as Draft"}
            </button>
          </form>

          <section className="mt-14">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <h2 className="font-display text-4xl font-bold">
                Gallery Images
              </h2>

              <button
                type="button"
                disabled={loadingImages}
                onClick={() => void loadImages()}
                className="rounded-full border border-white/20 px-5 py-3 font-black text-white disabled:opacity-50"
              >
                Refresh
              </button>
            </div>

            {loadingImages ? (
              <div className="rounded-[2rem] bg-black/25 p-8">
                <p className="font-black">
                  Loading gallery images...
                </p>
              </div>
            ) : images.length === 0 ? (
              <div className="rounded-[2rem] bg-black/25 p-8 text-center">
                <p className="font-black">
                  No gallery images found.
                </p>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {images.map((image) => {
                  const busy =
                    updatingId === image.id;

                  return (
                    <div
                      key={image.id}
                      className="rounded-[2rem] bg-black/25 p-5"
                    >
                      <img
                        src={image.image_url}
                        alt={image.title || "Gallery image"}
                        className="h-72 w-full rounded-[2rem] object-cover"
                      />

                      <h3 className="font-display mt-5 text-3xl font-bold">
                        {image.title}
                      </h3>

                      <p className="mt-2 text-sm text-white/60">
                        {image.category || "General"} ·{" "}
                        {image.featured
                          ? "Featured"
                          : "Normal"}{" "}
                        ·{" "}
                        {image.published
                          ? "Published"
                          : "Draft"}
                      </p>

                      <div className="mt-5 flex flex-wrap gap-3">
                        <button
                          type="button"
                          disabled={updatingId !== null}
                          onClick={() =>
                            void togglePublished(image)
                          }
                          className="rounded-full bg-white/10 px-5 py-3 font-black text-white disabled:opacity-50"
                        >
                          {busy
                            ? "Updating..."
                            : image.published
                              ? "Unpublish"
                              : "Publish"}
                        </button>

                        <button
                          type="button"
                          disabled={updatingId !== null}
                          onClick={() =>
                            void toggleFeatured(image)
                          }
                          className="rounded-full bg-white/10 px-5 py-3 font-black text-white disabled:opacity-50"
                        >
                          {busy
                            ? "Updating..."
                            : image.featured
                              ? "Unfeature"
                              : "Feature"}
                        </button>

                        <button
                          type="button"
                          disabled={updatingId !== null}
                          onClick={() =>
                            void deleteImage(image)
                          }
                          className="rounded-full bg-black px-5 py-3 font-black text-white disabled:opacity-50"
                        >
                          {busy
                            ? "Working..."
                            : "Delete"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </main>
    </>
  );
}
