// src/app/admin/articles/page.js

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
  id: null,
  title: "",
  slug: "",
  author: "Delly Singah",
  featured_image: "",
  content: "",
  published: true,
};

function makeSlug(title) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function getErrorMessage(error) {
  if (
    error instanceof Error &&
    error.message
  ) {
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

export default function AdminArticlesPage() {
  const [
    articles,
    setArticles,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    uploading,
    setUploading,
  ] = useState(false);

  const [
    updatingId,
    setUpdatingId,
  ] = useState(null);

  const [
    pageError,
    setPageError,
  ] = useState("");

  const [
    adminReady,
    setAdminReady,
  ] = useState(false);

  const [
    form,
    setForm,
  ] = useState(emptyForm);

  const isEditing =
    Boolean(form.id);

  useEffect(() => {
    void loadArticles();
  }, []);

  async function getAccessToken() {
    const {
      data: {
        session,
      },
      error,
    } =
      await supabase.auth.getSession();

    if (error) {
      throw new Error(
        error.message,
      );
    }

    if (
      !session?.access_token
    ) {
      window.location.href =
        "/auth/login";

      throw new Error(
        "Not authenticated.",
      );
    }

    return session.access_token;
  }

  async function adminFetch(
    url,
    options = {},
  ) {
    const token =
      await getAccessToken();

    const response =
      await fetch(
        url,
        {
          ...options,

          headers: {
            ...(options.headers ||
              {}),

            Authorization:
              `Bearer ${token}`,
          },

          cache:
            "no-store",
        },
      );

    let data = {};

    try {
      data =
        await response.json();
    } catch {
      data = {};
    }

    if (
      response.status === 401
    ) {
      window.location.href =
        "/auth/login";

      throw new Error(
        data.error ||
          "Your session has expired.",
      );
    }

    if (
      response.status === 403
    ) {
      window.location.href =
        "/dashboard";

      throw new Error(
        data.error ||
          "Admin access required.",
      );
    }

    if (!response.ok) {
      throw new Error(
        data.error ||
          "Unable to complete the admin request.",
      );
    }

    return data;
  }

  async function loadArticles() {
    setLoading(true);
    setPageError("");

    try {
      const data =
        await adminFetch(
          "/api/admin/articles",
          {
            method: "GET",
          },
        );

      setArticles(
        Array.isArray(
          data.articles,
        )
          ? data.articles
          : [],
      );

      setAdminReady(true);
    } catch (error) {
      setAdminReady(false);

      setPageError(
        getErrorMessage(
          error,
        ),
      );
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setForm(emptyForm);
  }

  function handleChange(
    event,
  ) {
    const {
      name,
      value,
      type,
      checked,
    } = event.target;

    setForm(
      (currentForm) => {
        const nextForm = {
          ...currentForm,

          [name]:
            type === "checkbox"
              ? checked
              : value,
        };

        if (
          name === "title" &&
          !currentForm.id
        ) {
          nextForm.slug =
            makeSlug(value);
        }

        return nextForm;
      },
    );
  }

  async function uploadFeaturedImage(
    file,
  ) {
    if (!file) {
      return null;
    }

    if (
      !ALLOWED_IMAGE_TYPES.has(
        file.type,
      )
    ) {
      throw new Error(
        "Featured image must be JPG, PNG, or WEBP.",
      );
    }

    if (
      file.size >
      MAX_IMAGE_SIZE
    ) {
      throw new Error(
        "Featured image must be 10 MB or smaller.",
      );
    }

    const extension =
      getImageExtension(
        file,
      );

    if (!extension) {
      throw new Error(
        "Unsupported image format.",
      );
    }

    setUploading(true);

    try {
      const fileName =
        `articles/${Date.now()}-${crypto.randomUUID()}.${extension}`;

      const {
        error,
      } =
        await supabase.storage
          .from(
            "content-images",
          )
          .upload(
            fileName,
            file,
            {
              cacheControl:
                "3600",

              contentType:
                file.type,

              upsert:
                false,
            },
          );

      if (error) {
        throw new Error(
          error.message,
        );
      }

      const {
        data,
      } =
        supabase.storage
          .from(
            "content-images",
          )
          .getPublicUrl(
            fileName,
          );

      if (
        !data?.publicUrl
      ) {
        throw new Error(
          "Uploaded image URL was not returned.",
        );
      }

      return data.publicUrl;
    } finally {
      setUploading(false);
    }
  }

  async function handleImageUpload(
    event,
  ) {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!adminReady) {
      alert(
        "Admin access has not been verified.",
      );

      event.target.value =
        "";

      return;
    }

    try {
      const imageUrl =
        await uploadFeaturedImage(
          file,
        );

      if (!imageUrl) {
        return;
      }

      setForm(
        (currentForm) => ({
          ...currentForm,

          featured_image:
            imageUrl,
        }),
      );
    } catch (error) {
      alert(
        getErrorMessage(
          error,
        ),
      );
    } finally {
      event.target.value =
        "";
    }
  }

  async function handleSubmit(
    event,
  ) {
    event.preventDefault();

    if (
      saving ||
      uploading
    ) {
      return;
    }

    const title =
      form.title.trim();

    const slug =
      form.slug.trim() ||
      makeSlug(title);

    const author =
      form.author.trim() ||
      "Delly Singah";

    const featuredImage =
      form.featured_image.trim();

    const content =
      form.content.trim();

    if (
      !title ||
      !content
    ) {
      alert(
        "Title and article content are required.",
      );

      return;
    }

    if (!slug) {
      alert(
        "Article slug is required.",
      );

      return;
    }

    setSaving(true);

    const wasEditing =
      isEditing;

    try {
      const payload = {
        title,
        slug,
        author,
        featured_image:
          featuredImage,
        content,
        published:
          Boolean(
            form.published,
          ),
      };

      const data =
        await adminFetch(
          "/api/admin/articles",
          {
            method:
              wasEditing
                ? "PATCH"
                : "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify(
                wasEditing
                  ? {
                      id:
                        form.id,

                      ...payload,
                    }
                  : payload,
              ),
          },
        );

      if (
        !data.article
      ) {
        throw new Error(
          "The saved article was not returned.",
        );
      }

      if (wasEditing) {
        setArticles(
          (
            currentArticles,
          ) =>
            currentArticles.map(
              (article) =>
                article.id ===
                data.article.id
                  ? data.article
                  : article,
            ),
        );
      } else {
        setArticles(
          (
            currentArticles,
          ) => [
            data.article,
            ...currentArticles,
          ],
        );
      }

      resetForm();

      alert(
        wasEditing
          ? "Article updated."
          : data.article.published
            ? "Article published."
            : "Article saved as draft.",
      );
    } catch (error) {
      alert(
        getErrorMessage(
          error,
        ),
      );
    } finally {
      setSaving(false);
    }
  }

  function editArticle(
    article,
  ) {
    setForm({
      id:
        article.id,

      title:
        article.title ||
        "",

      slug:
        article.slug ||
        "",

      author:
        article.author ||
        "Delly Singah",

      featured_image:
        article.featured_image ||
        "",

      content:
        article.content ||
        "",

      published:
        Boolean(
          article.published,
        ),
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function togglePublished(
    article,
  ) {
    if (
      updatingId !==
      null
    ) {
      return;
    }

    const nextPublished =
      !article.published;

    const confirmed =
      window.confirm(
        `${
          nextPublished
            ? "Publish"
            : "Unpublish"
        } "${article.title}"?`,
      );

    if (!confirmed) {
      return;
    }

    setUpdatingId(
      article.id,
    );

    try {
      const data =
        await adminFetch(
          "/api/admin/articles",
          {
            method:
              "PATCH",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                id:
                  article.id,

                published:
                  nextPublished,
              }),
          },
        );

      if (
        !data.article
      ) {
        throw new Error(
          "The updated article was not returned.",
        );
      }

      setArticles(
        (
          currentArticles,
        ) =>
          currentArticles.map(
            (item) =>
              item.id ===
              article.id
                ? data.article
                : item,
          ),
      );

      if (
        form.id ===
        article.id
      ) {
        setForm(
          (currentForm) => ({
            ...currentForm,

            published:
              Boolean(
                data.article
                  .published,
              ),
          }),
        );
      }

      alert(
        nextPublished
          ? "Article published."
          : "Article unpublished.",
      );
    } catch (error) {
      alert(
        getErrorMessage(
          error,
        ),
      );
    } finally {
      setUpdatingId(
        null,
      );
    }
  }

  async function deleteArticle(
    article,
  ) {
    if (
      updatingId !==
      null
    ) {
      return;
    }

    const confirmed =
      window.confirm(
        `Delete "${article.title}" permanently?`,
      );

    if (!confirmed) {
      return;
    }

    setUpdatingId(
      article.id,
    );

    try {
      await adminFetch(
        `/api/admin/articles?id=${encodeURIComponent(
          article.id,
        )}`,
        {
          method:
            "DELETE",
        },
      );

      setArticles(
        (
          currentArticles,
        ) =>
          currentArticles.filter(
            (item) =>
              item.id !==
              article.id,
          ),
      );

      if (
        form.id ===
        article.id
      ) {
        resetForm();
      }

      alert(
        "Article deleted.",
      );
    } catch (error) {
      alert(
        getErrorMessage(
          error,
        ),
      );
    } finally {
      setUpdatingId(
        null,
      );
    }
  }

  return (
    <>
      <DashboardChrome />

      <main className="min-h-screen bg-[#b30018] px-6 pb-24 pt-16 text-white">
        <div className="mx-auto max-w-7xl">
          <a
            href="/dashboard"
            className="font-bold text-white/70 hover:text-white"
          >
            ← Back to Dashboard
          </a>

          <p className="mt-8 text-sm font-black uppercase tracking-[0.45em] text-red-100">
            Admin
          </p>

          <h1 className="font-display mt-5 text-6xl font-bold leading-none md:text-8xl">
            Articles
          </h1>

          <p className="mt-6 max-w-3xl text-lg leading-8 text-white/80">
            Create, upload
            photos, edit,
            publish, unpublish,
            save drafts and
            delete Delly&apos;s
            articles directly
            from the admin
            dashboard.
          </p>

          {pageError && (
            <div className="mt-8 rounded-[2rem] bg-white p-6 text-[#b30018]">
              <p className="font-black">
                Unable to load
                articles
              </p>

              <p className="mt-3">
                {pageError}
              </p>

              <button
                type="button"
                onClick={() =>
                  void loadArticles()
                }
                className="mt-5 rounded-full bg-[#b30018] px-5 py-3 font-black text-white"
              >
                Try Again
              </button>
            </div>
          )}

          <section className="mt-14 grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
            <form
              onSubmit={
                handleSubmit
              }
              className="rounded-[3rem] bg-[#c1121f] p-8 shadow-2xl md:p-10"
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <h2 className="font-display text-5xl font-bold">
                  {isEditing
                    ? "Edit Article"
                    : "New Article"}
                </h2>

                {isEditing && (
                  <button
                    type="button"
                    disabled={
                      saving ||
                      uploading
                    }
                    onClick={
                      resetForm
                    }
                    className="rounded-full border border-white/20 px-5 py-3 font-black text-white disabled:opacity-50"
                  >
                    Cancel Edit
                  </button>
                )}
              </div>

              <div className="mt-8 space-y-5">
                <input
                  type="text"
                  name="title"
                  value={
                    form.title
                  }
                  maxLength={
                    300
                  }
                  required
                  disabled={
                    !adminReady ||
                    saving
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Article title"
                  className="h-16 w-full rounded-2xl border border-white/15 bg-white/10 px-5 text-white outline-none placeholder:text-white/60 disabled:opacity-50"
                />

                <input
                  type="text"
                  name="slug"
                  value={
                    form.slug
                  }
                  maxLength={
                    300
                  }
                  required
                  disabled={
                    !adminReady ||
                    saving
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="article-slug"
                  className="h-16 w-full rounded-2xl border border-white/15 bg-white/10 px-5 text-white outline-none placeholder:text-white/60 disabled:opacity-50"
                />

                <input
                  type="text"
                  name="author"
                  value={
                    form.author
                  }
                  maxLength={
                    200
                  }
                  disabled={
                    !adminReady ||
                    saving
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Author"
                  className="h-16 w-full rounded-2xl border border-white/15 bg-white/10 px-5 text-white outline-none placeholder:text-white/60 disabled:opacity-50"
                />

                <div className="rounded-[2rem] border border-white/15 bg-white/10 p-5">
                  <p className="text-sm font-black uppercase tracking-[0.25em] text-red-100">
                    Featured
                    Photo
                  </p>

                  {form.featured_image && (
                    <div className="mt-5">
                      <img
                        src={
                          form.featured_image
                        }
                        alt="Article preview"
                        className="h-64 w-full rounded-[2rem] object-cover object-top"
                      />

                      <button
                        type="button"
                        disabled={
                          saving ||
                          uploading
                        }
                        onClick={() =>
                          setForm(
                            (
                              currentForm,
                            ) => ({
                              ...currentForm,

                              featured_image:
                                "",
                            }),
                          )
                        }
                        className="mt-4 rounded-full border border-white/20 px-5 py-3 font-black text-white disabled:opacity-50"
                      >
                        Remove
                        Image
                      </button>
                    </div>
                  )}

                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    disabled={
                      !adminReady ||
                      saving ||
                      uploading
                    }
                    onChange={
                      handleImageUpload
                    }
                    className="mt-5 w-full rounded-2xl border border-white/15 bg-white/10 px-5 py-4 text-white file:mr-4 file:rounded-full file:border-0 file:bg-white file:px-5 file:py-2 file:font-bold file:text-[#b30018] disabled:opacity-50"
                  />

                  <p className="mt-3 text-sm text-white/60">
                    JPG, PNG or
                    WEBP. Maximum
                    10 MB.
                  </p>

                  {uploading && (
                    <p className="mt-3 text-sm font-bold text-white/70">
                      Uploading
                      photo...
                    </p>
                  )}

                  <input
                    type="url"
                    name="featured_image"
                    value={
                      form.featured_image
                    }
                    maxLength={
                      2000
                    }
                    disabled={
                      !adminReady ||
                      saving
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Or paste featured image URL"
                    className="mt-5 h-16 w-full rounded-2xl border border-white/15 bg-white/10 px-5 text-white outline-none placeholder:text-white/60 disabled:opacity-50"
                  />
                </div>

                <textarea
                  name="content"
                  value={
                    form.content
                  }
                  required
                  disabled={
                    !adminReady ||
                    saving
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Paste article exactly as written..."
                  rows={18}
                  className="w-full rounded-2xl border border-white/15 bg-white/10 px-5 py-5 text-white outline-none placeholder:text-white/60 disabled:opacity-50"
                />

                <label className="flex items-center gap-3 font-bold">
                  <input
                    type="checkbox"
                    name="published"
                    checked={
                      form.published
                    }
                    disabled={
                      !adminReady ||
                      saving
                    }
                    onChange={
                      handleChange
                    }
                    className="h-5 w-5"
                  />

                  Publish
                  immediately
                </label>

                <button
                  type="submit"
                  disabled={
                    !adminReady ||
                    saving ||
                    uploading
                  }
                  className="w-full rounded-full bg-white py-5 text-lg font-black text-[#b30018] transition hover:scale-105 disabled:opacity-60"
                >
                  {saving
                    ? isEditing
                      ? "Updating..."
                      : form.published
                        ? "Publishing..."
                        : "Saving Draft..."
                    : isEditing
                      ? "Update Article"
                      : form.published
                        ? "Publish Article"
                        : "Save Article as Draft"}
                </button>
              </div>
            </form>

            <section className="rounded-[3rem] bg-white p-8 text-black shadow-2xl md:p-10">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <h2 className="font-display text-5xl font-bold">
                  Articles
                </h2>

                <button
                  type="button"
                  disabled={
                    loading
                  }
                  onClick={() =>
                    void loadArticles()
                  }
                  className="rounded-full border border-black/15 px-5 py-3 text-sm font-black text-black disabled:opacity-50"
                >
                  Refresh
                </button>
              </div>

              {loading ? (
                <p className="mt-8 font-bold">
                  Loading
                  articles...
                </p>
              ) : articles.length ===
                0 ? (
                <p className="mt-8 text-black/60">
                  No articles
                  found.
                </p>
              ) : (
                <div className="mt-8 space-y-5">
                  {articles.map(
                    (
                      article,
                    ) => {
                      const busy =
                        updatingId ===
                        article.id;

                      return (
                        <div
                          key={
                            article.id
                          }
                          className="rounded-[2rem] border border-black/10 bg-[#fff8f5] p-5"
                        >
                          {article.featured_image && (
                            <img
                              src={
                                article.featured_image
                              }
                              alt={
                                article.title ||
                                "Article"
                              }
                              className="mb-5 h-40 w-full rounded-[1.5rem] object-cover object-top"
                            />
                          )}

                          <p className="text-xs font-black uppercase tracking-[0.25em] text-[#b30018]">
                            {article.published
                              ? "Published"
                              : "Draft"}
                          </p>

                          <h3 className="mt-3 text-2xl font-black">
                            {
                              article.title
                            }
                          </h3>

                          <p className="mt-2 break-all text-sm text-black/60">
                            /blog/articles/
                            {
                              article.slug
                            }
                          </p>

                          <div className="mt-5 flex flex-wrap gap-3">
                            <a
                              href={`/blog/articles/${encodeURIComponent(
                                article.slug,
                              )}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="rounded-full bg-[#b30018] px-5 py-3 text-sm font-black text-white"
                            >
                              View
                            </a>

                            <button
                              type="button"
                              disabled={
                                updatingId !==
                                null
                              }
                              onClick={() =>
                                editArticle(
                                  article,
                                )
                              }
                              className="rounded-full bg-yellow-300 px-5 py-3 text-sm font-black text-black disabled:opacity-50"
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              disabled={
                                updatingId !==
                                null
                              }
                              onClick={() =>
                                void togglePublished(
                                  article,
                                )
                              }
                              className="rounded-full border border-[#b30018]/20 px-5 py-3 text-sm font-black text-[#b30018] disabled:opacity-50"
                            >
                              {busy
                                ? "Updating..."
                                : article.published
                                  ? "Unpublish"
                                  : "Publish"}
                            </button>

                            <button
                              type="button"
                              disabled={
                                updatingId !==
                                null
                              }
                              onClick={() =>
                                void deleteArticle(
                                  article,
                                )
                              }
                              className="rounded-full bg-black px-5 py-3 text-sm font-black text-white disabled:opacity-50"
                            >
                              {busy
                                ? "Working..."
                                : "Delete"}
                            </button>
                          </div>
                        </div>
                      );
                    },
                  )}
                </div>
              )}
            </section>
          </section>
        </div>
      </main>
    </>
  );
}
