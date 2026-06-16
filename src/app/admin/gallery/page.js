"use client";

import { useEffect, useState } from "react";
import DashboardChrome from "@/app/components/DashboardChrome";
import { supabase } from "@/lib/supabase";

const emptyForm = {
  title: "",
  category: "General",
  image_url: "",
  featured: false,
  published: true,
};

export default function AdminGalleryPage() {
  const [form, setForm] = useState(emptyForm);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadImages();
  }, []);

  async function loadImages() {
    const { data, error } = await supabase
      .from("gallery_images")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error) {
      setImages(data || []);
    }
  }

  async function handleImageUpload(event) {
    const file = event.target.files?.[0];

    if (!file) return;

    setUploading(true);

    const fileExt = file.name.split(".").pop();
    const fileName = `gallery/${Date.now()}.${fileExt}`;

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

    if (!form.title.trim() || !form.image_url) {
      alert("Title and image are required.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.from("gallery_images").insert({
      title: form.title,
      category: form.category || "General",
      image_url: form.image_url,
      featured: form.featured,
      published: form.published,
    });

    setLoading(false);

    if (error) {
      alert(error.message);
      return;
    }

    alert("Gallery image published.");
    setForm(emptyForm);
    await loadImages();
  }

  async function togglePublished(image) {
    const { error } = await supabase
      .from("gallery_images")
      .update({ published: !image.published })
      .eq("id", image.id);

    if (error) {
      alert(error.message);
      return;
    }

    await loadImages();
  }

  async function toggleFeatured(image) {
    const { error } = await supabase
      .from("gallery_images")
      .update({ featured: !image.featured })
      .eq("id", image.id);

    if (error) {
      alert(error.message);
      return;
    }

    await loadImages();
  }

  async function deleteImage(imageId) {
    const confirmed = confirm("Delete this gallery image permanently?");

    if (!confirmed) return;

    const { error } = await supabase
      .from("gallery_images")
      .delete()
      .eq("id", imageId);

    if (error) {
      alert(error.message);
      return;
    }

    await loadImages();
  }

  return (
    <>
      <DashboardChrome />

      <main className="min-h-screen bg-[#b30018] px-6 py-16 text-white">
        <div className="mx-auto max-w-7xl">
          <p className="font-black uppercase tracking-[0.35em] text-red-100">
            Admin
          </p>

          <h1 className="font-display mt-4 text-6xl font-bold">Gallery</h1>

          <form
            onSubmit={handleSubmit}
            className="mt-10 rounded-[3rem] bg-black/25 p-8 shadow-2xl"
          >
            <input
              type="text"
              placeholder="Image title"
              value={form.title}
              onChange={(event) =>
                setForm({ ...form, title: event.target.value })
              }
              className="w-full rounded-2xl bg-white/10 px-5 py-4 text-white outline-none placeholder:text-white/50"
            />

            <input
              type="text"
              placeholder="Category"
              value={form.category}
              onChange={(event) =>
                setForm({ ...form, category: event.target.value })
              }
              className="mt-5 w-full rounded-2xl bg-white/10 px-5 py-4 text-white outline-none placeholder:text-white/50"
            />

            <div className="mt-5 rounded-2xl bg-white/10 p-5">
              <p className="mb-3 font-black">Gallery Image</p>

              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="w-full rounded-2xl bg-white/10 px-5 py-4 text-white"
              />

              {uploading && (
                <p className="mt-3 text-sm text-white/70">
                  Uploading image...
                </p>
              )}

              {form.image_url && (
                <img
                  src={form.image_url}
                  alt="Preview"
                  className="mt-5 max-h-[420px] w-full rounded-2xl object-contain"
                />
              )}
            </div>

            <div className="mt-5 flex flex-wrap gap-6">
              <label className="flex items-center gap-3 font-bold">
                <input
                  type="checkbox"
                  checked={form.featured}
                  onChange={(event) =>
                    setForm({ ...form, featured: event.target.checked })
                  }
                />
                Featured
              </label>

              <label className="flex items-center gap-3 font-bold">
                <input
                  type="checkbox"
                  checked={form.published}
                  onChange={(event) =>
                    setForm({ ...form, published: event.target.checked })
                  }
                />
                Publish immediately
              </label>
            </div>

            <button
              type="submit"
              disabled={loading || uploading}
              className="mt-8 rounded-full bg-white px-8 py-4 font-black text-[#b30018] disabled:opacity-60"
            >
              {loading ? "Publishing..." : "Publish Gallery Image"}
            </button>
          </form>

          <section className="mt-14 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {images.map((image) => (
              <div key={image.id} className="rounded-[2rem] bg-black/25 p-5">
                <img
                  src={image.image_url}
                  alt={image.title}
                  className="h-72 w-full rounded-[2rem] object-cover"
                />

                <h2 className="mt-5 font-display text-3xl font-bold">
                  {image.title}
                </h2>

                <p className="mt-2 text-sm text-white/60">
                  {image.category || "General"} ·{" "}
                  {image.featured ? "Featured" : "Normal"} ·{" "}
                  {image.published ? "Published" : "Draft"}
                </p>

                <div className="mt-5 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => togglePublished(image)}
                    className="rounded-full bg-white/10 px-5 py-3 font-black text-white"
                  >
                    {image.published ? "Unpublish" : "Publish"}
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleFeatured(image)}
                    className="rounded-full bg-white/10 px-5 py-3 font-black text-white"
                  >
                    {image.featured ? "Unfeature" : "Feature"}
                  </button>

                  <button
                    type="button"
                    onClick={() => deleteImage(image.id)}
                    className="rounded-full bg-black px-5 py-3 font-black text-white"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </section>
        </div>
      </main>
    </>
  );
}
