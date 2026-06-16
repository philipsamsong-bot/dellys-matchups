"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import DashboardChrome from "@/app/components/DashboardChrome";

const emptyForm = {
  title: "",
  anonymous_name: "Anonymous",
  image_url: "",
  content: "",
  published: true,
};

export default function AdminExceptionalCasesPage() {
  const [form, setForm] = useState(emptyForm);
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadCases();
  }, []);

  async function getAccessToken() {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      window.location.href = "/auth/login";
      return null;
    }

    return session.access_token;
  }

  async function loadCases() {
    const token = await getAccessToken();

    if (!token) return;

    const response = await fetch("/api/admin/exceptional-cases", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.error || "Unable to load Exceptional Cases.");
      return;
    }

    setCases(data.cases || []);
  }

  async function handleImageUpload(event) {
    const file = event.target.files?.[0];

    if (!file) return;

    setUploading(true);

    const fileExt = file.name.split(".").pop();
    const fileName = `exceptional-cases/${Date.now()}.${fileExt}`;

    const { error } = await supabase.storage
      .from("content-images")
      .upload(fileName, file, { upsert: true });

    if (error) {
      setUploading(false);
      alert(error.message);
      return;
    }

    const { data } = supabase.storage
      .from("content-images")
      .getPublicUrl(fileName);

    setForm((current) => ({
      ...current,
      image_url: data.publicUrl,
    }));

    setUploading(false);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!form.title.trim() || !form.content.trim()) {
      alert("Title and content are required.");
      return;
    }

    const token = await getAccessToken();

    if (!token) return;

    setLoading(true);

    const response = await fetch("/api/admin/exceptional-cases", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(form),
    });

    const data = await response.json();

    setLoading(false);

    if (!response.ok) {
      alert(data.error || "Unable to publish Exceptional Case.");
      return;
    }

    alert("Exceptional Case published.");
    setForm(emptyForm);
    await loadCases();
  }

  async function togglePublished(caseItem) {
    const token = await getAccessToken();

    if (!token) return;

    const response = await fetch("/api/admin/exceptional-cases", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        id: caseItem.id,
        published: !caseItem.published,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.error || "Unable to update case.");
      return;
    }

    await loadCases();
  }

  async function deleteCase(caseId) {
    const confirmed = confirm("Delete this Exceptional Case permanently?");

    if (!confirmed) return;

    const token = await getAccessToken();

    if (!token) return;

    const response = await fetch(`/api/admin/exceptional-cases?id=${caseId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.error || "Unable to delete case.");
      return;
    }

    await loadCases();
  }

  return (
    <>
      <DashboardChrome />

      <main className="min-h-screen bg-[#b30018] px-6 py-16 text-white">
        <div className="mx-auto max-w-7xl">
          <p className="font-black uppercase tracking-[0.35em] text-red-100">
            Admin
          </p>

          <h1 className="font-display mt-4 text-6xl font-bold">
            Exceptional Cases
          </h1>

          <form
            onSubmit={handleSubmit}
            className="mt-10 rounded-[3rem] bg-black/25 p-8 shadow-2xl"
          >
            <input
              type="text"
              placeholder="Case title"
              className="w-full rounded-2xl bg-white/10 px-5 py-4 text-white outline-none placeholder:text-white/50"
              value={form.title}
              onChange={(event) =>
                setForm({ ...form, title: event.target.value })
              }
            />

            <div className="mt-5 rounded-2xl bg-white/10 p-5">
              <p className="mb-3 font-black">Featured Image</p>

              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="w-full rounded-2xl bg-white/10 px-5 py-4 text-white"
              />

              {uploading && (
                <p className="mt-3 text-sm text-white/70">Uploading image...</p>
              )}

              {form.image_url && (
                <img
                  src={form.image_url}
                  alt="Preview"
                  className="mt-5 h-72 w-full rounded-2xl object-cover"
                />
              )}
            </div>

            <input
              type="text"
              placeholder="Anonymous name"
              className="mt-5 w-full rounded-2xl bg-white/10 px-5 py-4 text-white outline-none placeholder:text-white/50"
              value={form.anonymous_name}
              onChange={(event) =>
                setForm({ ...form, anonymous_name: event.target.value })
              }
            />

            <textarea
              rows="16"
              placeholder="Paste the Exceptional Case exactly as received..."
              className="mt-5 w-full rounded-2xl bg-white/10 px-5 py-4 text-white outline-none placeholder:text-white/50"
              value={form.content}
              onChange={(event) =>
                setForm({ ...form, content: event.target.value })
              }
            />

            <label className="mt-5 flex items-center gap-3 font-bold">
              <input
                type="checkbox"
                checked={form.published}
                onChange={(event) =>
                  setForm({ ...form, published: event.target.checked })
                }
              />
              Publish immediately
            </label>

            <button
              type="submit"
              disabled={loading || uploading}
              className="mt-8 rounded-full bg-white px-8 py-4 font-black text-[#b30018] disabled:opacity-60"
            >
              {loading ? "Publishing..." : "Publish Exceptional Case"}
            </button>
          </form>

          <section className="mt-14 grid gap-6">
            {cases.map((caseItem) => (
              <div key={caseItem.id} className="rounded-[2rem] bg-black/25 p-6">
                {caseItem.image_url && (
                  <img
                    src={caseItem.image_url}
                    alt={caseItem.title}
                    className="mb-6 h-64 w-full rounded-[2rem] object-cover"
                  />
                )}

                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="font-display text-3xl font-bold">
                      {caseItem.title}
                    </h2>

                    <p className="mt-2 text-sm text-white/60">
                      {caseItem.anonymous_name || "Anonymous"} ·{" "}
                      {caseItem.published ? "Published" : "Draft"}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <a
                      href={`/blog/exceptional-cases/${caseItem.id}`}
                      className="rounded-full bg-white px-5 py-3 font-black text-[#b30018]"
                    >
                      View
                    </a>

                    <button
                      type="button"
                      onClick={() => togglePublished(caseItem)}
                      className="rounded-full bg-white/10 px-5 py-3 font-black text-white"
                    >
                      {caseItem.published ? "Unpublish" : "Publish"}
                    </button>

                    <button
                      type="button"
                      onClick={() => deleteCase(caseItem.id)}
                      className="rounded-full bg-black px-5 py-3 font-black text-white"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </section>
        </div>
      </main>
    </>
  );
}
