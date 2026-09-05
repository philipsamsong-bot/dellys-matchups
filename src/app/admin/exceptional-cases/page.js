// src/app/admin/exceptional-cases/page.js

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
  anonymous_name: "Anonymous",
  image_url: "",
  content: "",
  published: true,
};

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

export default function AdminExceptionalCasesPage() {
  const [
    form,
    setForm,
  ] = useState(emptyForm);

  const [
    cases,
    setCases,
  ] = useState([]);

  const [
    loadingCases,
    setLoadingCases,
  ] = useState(true);

  const [
    submitting,
    setSubmitting,
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

  useEffect(() => {
    void loadCases();
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

  async function loadCases() {
    setLoadingCases(true);
    setPageError("");

    try {
      const data =
        await adminFetch(
          "/api/admin/exceptional-cases",
          {
            method: "GET",
          },
        );

      setCases(
        Array.isArray(
          data.cases,
        )
          ? data.cases
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
      setLoadingCases(false);
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

    if (
      !adminReady
    ) {
      alert(
        "Admin access has not been verified.",
      );

      event.target.value =
        "";

      return;
    }

    if (
      !ALLOWED_IMAGE_TYPES.has(
        file.type,
      )
    ) {
      alert(
        "Featured image must be JPG, PNG, or WEBP.",
      );

      event.target.value =
        "";

      return;
    }

    if (
      file.size >
      MAX_IMAGE_SIZE
    ) {
      alert(
        "Featured image must be 10 MB or smaller.",
      );

      event.target.value =
        "";

      return;
    }

    const extension =
      getImageExtension(
        file,
      );

    if (!extension) {
      alert(
        "Unsupported image format.",
      );

      event.target.value =
        "";

      return;
    }

    setUploading(true);

    try {
      const fileName =
        `exceptional-cases/${Date.now()}-${crypto.randomUUID()}.${extension}`;

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

      setForm(
        (current) => ({
          ...current,

          image_url:
            data.publicUrl,
        }),
      );
    } catch (error) {
      alert(
        getErrorMessage(
          error,
        ),
      );
    } finally {
      setUploading(false);

      event.target.value =
        "";
    }
  }

  async function handleSubmit(
    event,
  ) {
    event.preventDefault();

    if (
      submitting ||
      uploading
    ) {
      return;
    }

    const title =
      form.title.trim();

    const anonymousName =
      form.anonymous_name.trim();

    const content =
      form.content.trim();

    if (
      !title ||
      !content
    ) {
      alert(
        "Title and content are required.",
      );

      return;
    }

    setSubmitting(true);

    try {
      await adminFetch(
        "/api/admin/exceptional-cases",
        {
          method:
            "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body:
            JSON.stringify({
              title,

              anonymous_name:
                anonymousName ||
                "Anonymous",

              image_url:
                form.image_url.trim(),

              content,

              published:
                Boolean(
                  form.published,
                ),
            }),
        },
      );

      alert(
        form.published
          ? "Exceptional Case published."
          : "Exceptional Case saved as a draft.",
      );

      setForm(
        emptyForm,
      );

      await loadCases();
    } catch (error) {
      alert(
        getErrorMessage(
          error,
        ),
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function togglePublished(
    caseItem,
  ) {
    if (
      updatingId
    ) {
      return;
    }

    const nextPublished =
      !caseItem.published;

    const action =
      nextPublished
        ? "publish"
        : "unpublish";

    const confirmed =
      window.confirm(
        `${
          nextPublished
            ? "Publish"
            : "Unpublish"
        } "${caseItem.title}"?`,
      );

    if (!confirmed) {
      return;
    }

    setUpdatingId(
      caseItem.id,
    );

    try {
      await adminFetch(
        "/api/admin/exceptional-cases",
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
                caseItem.id,

              published:
                nextPublished,
            }),
        },
      );

      setCases(
        (
          currentCases,
        ) =>
          currentCases.map(
            (item) =>
              item.id ===
              caseItem.id
                ? {
                    ...item,

                    published:
                      nextPublished,
                  }
                : item,
          ),
      );

      alert(
        `Exceptional Case ${action}ed.`,
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

  async function deleteCase(
    caseItem,
  ) {
    if (
      updatingId
    ) {
      return;
    }

    const confirmed =
      window.confirm(
        `Delete "${caseItem.title}" permanently?`,
      );

    if (!confirmed) {
      return;
    }

    setUpdatingId(
      caseItem.id,
    );

    try {
      await adminFetch(
        `/api/admin/exceptional-cases?id=${encodeURIComponent(
          caseItem.id,
        )}`,
        {
          method:
            "DELETE",
        },
      );

      setCases(
        (
          currentCases,
        ) =>
          currentCases.filter(
            (item) =>
              item.id !==
              caseItem.id,
          ),
      );

      alert(
        "Exceptional Case deleted.",
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
            Exceptional Cases
          </h1>

          <p className="mt-5 max-w-3xl text-white/70">
            Create Exceptional
            Cases, save drafts,
            publish or unpublish
            them, and manage
            existing entries.
          </p>

          {pageError && (
            <div className="mt-8 rounded-[2rem] bg-white p-6 text-[#b30018]">
              <p className="font-black">
                Unable to load
                Exceptional Cases
              </p>

              <p className="mt-3">
                {pageError}
              </p>

              <button
                type="button"
                onClick={() =>
                  void loadCases()
                }
                className="mt-5 rounded-full bg-[#b30018] px-5 py-3 font-black text-white"
              >
                Try Again
              </button>
            </div>
          )}

          <form
            onSubmit={
              handleSubmit
            }
            className="mt-10 rounded-[3rem] bg-black/25 p-8 shadow-2xl"
          >
            <input
              type="text"
              placeholder="Case title"
              maxLength={300}
              required
              disabled={
                !adminReady ||
                submitting
              }
              className="w-full rounded-2xl bg-white/10 px-5 py-4 text-white outline-none placeholder:text-white/50 disabled:opacity-50"
              value={
                form.title
              }
              onChange={(
                event,
              ) =>
                setForm(
                  (
                    current,
                  ) => ({
                    ...current,

                    title:
                      event
                        .target
                        .value,
                  }),
                )
              }
            />

            <div className="mt-5 rounded-2xl bg-white/10 p-5">
              <p className="mb-3 font-black">
                Featured Image
              </p>

              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                disabled={
                  !adminReady ||
                  uploading ||
                  submitting
                }
                onChange={
                  handleImageUpload
                }
                className="w-full rounded-2xl bg-white/10 px-5 py-4 text-white disabled:opacity-50"
              />

              <p className="mt-3 text-sm text-white/60">
                JPG, PNG or WEBP.
                Maximum 10 MB.
              </p>

              {uploading && (
                <p className="mt-3 text-sm text-white/70">
                  Uploading
                  image...
                </p>
              )}

              {form.image_url && (
                <div className="mt-5">
                  <img
                    src={
                      form.image_url
                    }
                    alt="Exceptional Case featured image preview"
                    className="h-72 w-full rounded-2xl object-cover"
                  />

                  <button
                    type="button"
                    disabled={
                      submitting ||
                      uploading
                    }
                    onClick={() =>
                      setForm(
                        (
                          current,
                        ) => ({
                          ...current,

                          image_url:
                            "",
                        }),
                      )
                    }
                    className="mt-4 rounded-full border border-white/20 px-5 py-3 font-black text-white disabled:opacity-50"
                  >
                    Remove Image
                  </button>
                </div>
              )}
            </div>

            <input
              type="text"
              placeholder="Anonymous name"
              maxLength={200}
              disabled={
                !adminReady ||
                submitting
              }
              className="mt-5 w-full rounded-2xl bg-white/10 px-5 py-4 text-white outline-none placeholder:text-white/50 disabled:opacity-50"
              value={
                form.anonymous_name
              }
              onChange={(
                event,
              ) =>
                setForm(
                  (
                    current,
                  ) => ({
                    ...current,

                    anonymous_name:
                      event
                        .target
                        .value,
                  }),
                )
              }
            />

            <textarea
              rows={16}
              placeholder="Paste the Exceptional Case exactly as received..."
              required
              disabled={
                !adminReady ||
                submitting
              }
              className="mt-5 w-full rounded-2xl bg-white/10 px-5 py-4 text-white outline-none placeholder:text-white/50 disabled:opacity-50"
              value={
                form.content
              }
              onChange={(
                event,
              ) =>
                setForm(
                  (
                    current,
                  ) => ({
                    ...current,

                    content:
                      event
                        .target
                        .value,
                  }),
                )
              }
            />

            <label className="mt-5 flex items-center gap-3 font-bold">
              <input
                type="checkbox"
                checked={
                  form.published
                }
                disabled={
                  !adminReady ||
                  submitting
                }
                onChange={(
                  event,
                ) =>
                  setForm(
                    (
                      current,
                    ) => ({
                      ...current,

                      published:
                        event
                          .target
                          .checked,
                    }),
                  )
                }
              />

              Publish immediately
            </label>

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
                  ? "Publish Exceptional Case"
                  : "Save Exceptional Case as Draft"}
            </button>
          </form>

          <section className="mt-14 grid gap-6">
            <div className="flex items-center justify-between gap-4">
              <h2 className="font-display text-4xl font-bold">
                Existing Cases
              </h2>

              <button
                type="button"
                disabled={
                  loadingCases
                }
                onClick={() =>
                  void loadCases()
                }
                className="rounded-full border border-white/20 px-5 py-3 font-black text-white disabled:opacity-50"
              >
                Refresh
              </button>
            </div>

            {loadingCases ? (
              <div className="rounded-[2rem] bg-black/25 p-8">
                <p className="font-black">
                  Loading
                  Exceptional
                  Cases...
                </p>
              </div>
            ) : cases.length ===
              0 ? (
              <div className="rounded-[2rem] bg-black/25 p-8 text-center">
                <p className="font-black">
                  No Exceptional
                  Cases found.
                </p>
              </div>
            ) : (
              cases.map(
                (
                  caseItem,
                ) => {
                  const busy =
                    updatingId ===
                    caseItem.id;

                  return (
                    <div
                      key={
                        caseItem.id
                      }
                      className="rounded-[2rem] bg-black/25 p-6"
                    >
                      {caseItem.image_url && (
                        <img
                          src={
                            caseItem.image_url
                          }
                          alt={
                            caseItem.title ||
                            "Exceptional Case"
                          }
                          className="mb-6 h-64 w-full rounded-[2rem] object-cover"
                        />
                      )}

                      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                          <h3 className="font-display text-3xl font-bold">
                            {caseItem.title}
                          </h3>

                          <p className="mt-2 text-sm text-white/60">
                            {caseItem.anonymous_name ||
                              "Anonymous"}{" "}
                            ·{" "}
                            {caseItem.published
                              ? "Published"
                              : "Draft"}
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-3">
                          <a
                            href={`/blog/exceptional-cases/${encodeURIComponent(
                              caseItem.id,
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded-full bg-white px-5 py-3 font-black text-[#b30018]"
                          >
                            View
                          </a>

                          <button
                            type="button"
                            disabled={
                              busy ||
                              updatingId !==
                                null
                            }
                            onClick={() =>
                              void togglePublished(
                                caseItem,
                              )
                            }
                            className="rounded-full bg-white/10 px-5 py-3 font-black text-white disabled:opacity-50"
                          >
                            {busy
                              ? "Updating..."
                              : caseItem.published
                                ? "Unpublish"
                                : "Publish"}
                          </button>

                          <button
                            type="button"
                            disabled={
                              busy ||
                              updatingId !==
                                null
                            }
                            onClick={() =>
                              void deleteCase(
                                caseItem,
                              )
                            }
                            className="rounded-full bg-black px-5 py-3 font-black text-white disabled:opacity-50"
                          >
                            {busy
                              ? "Working..."
                              : "Delete"}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                },
              )
            )}
          </section>
        </div>
      </main>
    </>
  );
}
