"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import DashboardChrome from "@/app/components/DashboardChrome";

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

  const [form, setForm] = useState({
    title: "",
    slug: "",
    author: "Delly Singah",
    featured_image: "",
    content: "",
    published: true,
  });

  useEffect(() => {
    loadArticles();
  }, []);

  async function loadArticles() {
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

  function handleChange(event) {
    const { name, value, type, checked } = event.target;

    setForm((currentForm) => {
      const nextForm = {
        ...currentForm,
        [name]: type === "checkbox" ? checked : value,
      };

      if (name === "title") {
        nextForm.slug = makeSlug(value);
      }

      return nextForm;
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!form.title || !form.content) {
      alert("Title and article content are required.");
      return;
    }

    setSaving(true);

    const { error } = await supabase.from("articles").insert({
      title: form.title,
      slug: form.slug || makeSlug(form.title),
      author: form.author,
      featured_image: form.featured_image,
      content: form.content,
      published: form.published,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      alert(error.message);
      setSaving(false);
      return;
    }

    setForm({
      title: "",
      slug: "",
      author: "Delly Singah",
      featured_image: "",
      content: "",
      published: true,
    });

    await loadArticles();
    setSaving(false);
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

    const { error } = await supabase
      .from("articles")
      .delete()
      .eq("id", articleId);

    if (error) {
      alert(error.message);
      return;
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
            Create and publish Delly&apos;s articles directly from the admin
            dashboard.
          </p>

          <section className="mt-14 grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
            <form
              onSubmit={handleSubmit}
              className="rounded-[3rem] bg-[#c1121f] p-8 shadow-2xl md:p-10"
            >
              <h2 className="font-display text-5xl font-bold">
                New Article
              </h2>

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

                <input
                  type="text"
                  name="featured_image"
                  value={form.featured_image}
                  onChange={handleChange}
                  placeholder="Featured image URL optional"
                  className="h-16 w-full rounded-2xl border border-white/15 bg-white/10 px-5 text-white outline-none placeholder:text-white/60"
                />

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
                  disabled={saving}
                  className="w-full rounded-full bg-white py-5 text-lg font-black text-[#b30018] transition hover:scale-105 disabled:opacity-60"
                >
                  {saving ? "Publishing..." : "Publish Article"}
                </button>
              </div>
            </form>

            <section className="rounded-[3rem] bg-white p-8 text-black shadow-2xl md:p-10">
              <h2 className="font-display text-5xl font-bold">
                Published Articles
              </h2>

              {loading ? (
                <p className="mt-8 font-bold">Loading articles...</p>
              ) : articles.length === 0 ? (
                <p className="mt-8 text-black/60">
                  No articles published yet.
                </p>
              ) : (
                <div className="mt-8 space-y-5">
                  {articles.map((article) => (
                    <div
                      key={article.id}
                      className="rounded-[2rem] border border-black/10 bg-[#fff8f5] p-5"
                    >
                      <p className="text-xs font-black uppercase tracking-[0.25em] text-[#b30018]">
                        {article.published ? "Published" : "Draft"}
                      </p>

                      <h3 className="mt-3 text-2xl font-black">
                        {article.title}
                      </h3>

                      <p className="mt-2 text-sm text-black/60">
                        /articles/{article.slug}
                      </p>

                      <div className="mt-5 flex flex-wrap gap-3">
                        <a
                          href={`/articles/${article.slug}`}
                          target="_blank"
                          className="rounded-full bg-[#b30018] px-5 py-3 text-sm font-black text-white"
                        >
                          View
                        </a>

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
