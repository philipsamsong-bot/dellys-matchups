// src/app/admin/articles/page.js

"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import DashboardChrome from "@/app/components/DashboardChrome";

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
    .replace(/-+/g, "-");
}

export default function AdminArticlesPage() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const isEditing = Boolean(form.id);

  useEffect(() => {
    loadArticles();
  }, []);

  async function loadArticles() {
    setLoading(true);

    const { data, error } = await supabase
      .from("articles")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      alert(error.message);
      setLoading(false);
      return;
    }

    setArticles(data || []);
    setLoading(false);
  }

  function resetForm() {
    setForm(emptyForm);
  }

  function handleChange(event) {
    const { name, value, type, checked } = event.target;

    setForm((currentForm) => {
      const nextForm = {
        ...currentForm,
        [name]: type === "checkbox" ? checked : value,
      };

      if (name === "title" && !currentForm.id) {
        nextForm.slug = makeSlug(value);
      }

      return nextForm;
    });
  }

  async function uploadFeaturedImage(file) {
    if (!file) return null;

    setUploading(true);

    const fileExt = file.name.split(".").pop();
    const fileName = `articles/${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}.${fileExt}`;

    const { error } = await supabase.storage
      .from("content-images")
      .upload(fileName, file, {
        upsert: true,
      });

    if (error) {
      setUploading(false);
      alert(error.message);
      return null;
    }

    const { data } = supabase.storage
      .from("content-images")
      .getPublicUrl(fileName);

    setUploading(false);
    return data.publicUrl;
  }

  async function handleImageUpload(event) {
    const file = event.target.files?.[0];

    if (!file) return;

    const imageUrl = await uploadFeaturedImage(file);

    if (!imageUrl) return;

    setForm((currentForm) => ({
      ...currentForm,
      featured_image: imageUrl,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!form.title.trim() || !form.content.trim()) {
      alert("Title and article content are required.");
      return;
    }

    setSaving(true);

    const payload = {
      title: form.title.trim(),
      slug: form.slug.trim() || makeSlug(form.title),
      author: form.author.trim() || "Delly Singah",
      featured_image: form.featured_image.trim(),
      content: form.content.trim(),
      published: form.published,
      updated_at: new Date().toISOString(),
    };

    const request = isEditing
      ? supabase.from("articles").update(payload).eq("id", form.id)
      : supabase.from("articles").insert(payload);

    const { error } = await request;

    if (error) {
      alert(error.message);
      setSaving(false);
      return;
    }

    resetForm();
    await loadArticles();
    setSaving(false);

    alert(isEditing ? "Article updated." : "Article published.");
  }

  function editArticle(article) {
    setForm({
      id: article.id,
      title: article.title || "",
      slug: article.slug || "",
      author: article.author || "Delly Singah",
      featured_image: article.featured_image || "",
      content: article.content || "",
      published: Boolean(article.published),
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function togglePublished(article) {
    const { error } = await supabase
      .from("articles")
      .update({
        published: !article.published,
        updated_at: new Date().toISOString(),
      })
      .eq("id", article.id);

    if (error) {
      alert(error.message);
      return;
    }

    await loadArticles();
  }

  async function deleteArticle(articleId) {
    const confirmed = confirm("Delete this article?");
    if (!confirmed) return;

    const { error } = await supabase.from("articles").delete().eq("id", articleId);

    if (error) {
      alert(error.message);
      return;
    }

    if (form.id === articleId) {
      resetForm();
    }

    await loadArticles();
  }

  return (
    <>
      <DashboardChrome />

      <main className="min-h-screen bg-[#b30018] px-6 pb-24 pt-16 text-white">
        <div className="mx-auto max-w-7xl">
          <p className="text-sm font-black uppercase tracking-[0.45em] text-red-100">
            Admin
          </p>

          <h1 className="font-display mt-5 text-6xl font-bold leading-none md:text-8xl">
            Articles
          </h1>

          <p className="mt-6 max-w-3xl text-lg leading-8 text-white/80">
            Create, upload photos, edit, update, publish, unpublish, and delete
            Delly&apos;s articles directly from the admin dashboard.
          </p>

          <section className="mt-14 grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
            <form
              onSubmit={handleSubmit}
              className="rounded-[3rem] bg-[#c1121f] p-8 shadow-2xl md:p-10"
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <h2 className="font-display text-5xl font-bold">
                  {isEditing ? "Edit Article" : "New Article"}
                </h2>

                {isEditing && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="rounded-full border border-white/20 px-5 py-3 font-black text-white"
                  >
                    Cancel Edit
                  </button>
                )}
              </div>

              <div className="mt-8 space-y-5">
                <input
                  type="text"
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  placeholder="Article title"
                  className="h-16 w-full rounded-2xl border border-white/15 bg-white/10 px-5 text-white outline-none placeholder:text-white/60"
                />

                <input
                  type="text"
                  name="slug"
                  value={form.slug}
                  onChange={handleChange}
                  placeholder="article-slug"
                  className="h-16 w-full rounded-2xl border border-white/15 bg-white/10 px-5 text-white outline-none placeholder:text-white/60"
                />

                <input
                  type="text"
                  name="author"
                  value={form.author}
                  onChange={handleChange}
                  placeholder="Author"
                  className="h-16 w-full rounded-2xl border border-white/15 bg-white/10 px-5 text-white outline-none placeholder:text-white/60"
                />

                <div className="rounded-[2rem] border border-white/15 bg-white/10 p-5">
                  <p className="text-sm font-black uppercase tracking-[0.25em] text-red-100">
                    Featured Photo
                  </p>

                  {form.featured_image && (
                    <img
                      src={form.featured_image}
                      alt="Article preview"
                      className="mt-5 h-64 w-full rounded-[2rem] object-cover object-top"
                    />
                  )}

                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="mt-5 w-full rounded-2xl border border-white/15 bg-white/10 px-5 py-4 text-white file:mr-4 file:rounded-full file:border-0 file:bg-white file:px-5 file:py-2 file:font-bold file:text-[#b30018]"
                  />

                  {uploading && (
                    <p className="mt-3 text-sm font-bold text-white/70">
                      Uploading photo...
                    </p>
                  )}

                  <input
                    type="text"
                    name="featured_image"
                    value={form.featured_image}
                    onChange={handleChange}
                    placeholder="Or paste featured image URL"
                    className="mt-5 h-16 w-full rounded-2xl border border-white/15 bg-white/10 px-5 text-white outline-none placeholder:text-white/60"
                  />
                </div>

                <textarea
                  name="content"
                  value={form.content}
                  onChange={handleChange}
                  placeholder="Paste article exactly as written..."
                  rows="18"
                  className="w-full rounded-2xl border border-white/15 bg-white/10 px-5 py-5 text-white outline-none placeholder:text-white/60"
                />

                <label className="flex items-center gap-3 font-bold">
                  <input
                    type="checkbox"
                    name="published"
                    checked={form.published}
                    onChange={handleChange}
                    className="h-5 w-5"
                  />
                  Publish immediately
                </label>

                <button
                  type="submit"
                  disabled={saving || uploading}
                  className="w-full rounded-full bg-white py-5 text-lg font-black text-[#b30018] transition hover:scale-105 disabled:opacity-60"
                >
                  {saving
                    ? isEditing
                      ? "Updating..."
                      : "Publishing..."
                    : isEditing
                      ? "Update Article"
                      : "Publish Article"}
                </button>
              </div>
            </form>

            <section className="rounded-[3rem] bg-white p-8 text-black shadow-2xl md:p-10">
              <h2 className="font-display text-5xl font-bold">
                Articles
              </h2>

              {loading ? (
                <p className="mt-8 font-bold">Loading articles...</p>
              ) : articles.length === 0 ? (
                <p className="mt-8 text-black/60">No articles published yet.</p>
              ) : (
                <div className="mt-8 space-y-5">
                  {articles.map((article) => (
                    <div
                      key={article.id}
                      className="rounded-[2rem] border border-black/10 bg-[#fff8f5] p-5"
                    >
                      {article.featured_image && (
                        <img
                          src={article.featured_image}
                          alt={article.title}
                          className="mb-5 h-40 w-full rounded-[1.5rem] object-cover object-top"
                        />
                      )}

                      <p className="text-xs font-black uppercase tracking-[0.25em] text-[#b30018]">
                        {article.published ? "Published" : "Draft"}
                      </p>

                      <h3 className="mt-3 text-2xl font-black">
                        {article.title}
                      </h3>

                      <p className="mt-2 text-sm text-black/60">
                        /blog/articles/{article.slug}
                      </p>

                      <div className="mt-5 flex flex-wrap gap-3">
                        <a
                          href={`/blog/articles/${article.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-full bg-[#b30018] px-5 py-3 text-sm font-black text-white"
                        >
                          View
                        </a>

                        <button
                          type="button"
                          onClick={() => editArticle(article)}
                          className="rounded-full bg-yellow-300 px-5 py-3 text-sm font-black text-black"
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => togglePublished(article)}
                          className="rounded-full border border-[#b30018]/20 px-5 py-3 text-sm font-black text-[#b30018]"
                        >
                          {article.published ? "Unpublish" : "Publish"}
                        </button>

                        <button
                          type="button"
                          onClick={() => deleteArticle(article.id)}
                          className="rounded-full bg-black px-5 py-3 text-sm font-black text-white"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </section>
        </div>
      </main>
    </>
  );
}
