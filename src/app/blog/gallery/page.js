"use client";

import { useEffect, useMemo, useState } from "react";
import { SiteNav, SiteFooter } from "@/app/components/SiteChrome";
import { supabase } from "@/lib/supabase";

export default function GalleryPage() {
  const [images, setImages] = useState([]);
  const [activeCategory, setActiveCategory] = useState("All");
  const [selectedImage, setSelectedImage] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadGalleryImages() {
      const { data, error } = await supabase
        .from("gallery_images")
        .select("*")
        .eq("published", true)
        .order("featured", { ascending: false })
        .order("created_at", { ascending: false });

      if (!error) {
        setImages(data || []);
      }

      setLoading(false);
    }

    loadGalleryImages();
  }, []);

  const categories = useMemo(() => {
    const uniqueCategories = images
      .map((image) => image.category || "General")
      .filter(Boolean);

    return ["All", ...new Set(uniqueCategories)];
  }, [images]);

  const filteredImages =
    activeCategory === "All"
      ? images
      : images.filter((image) => image.category === activeCategory);

  return (
    <>
      <SiteNav />

      <main className="min-h-screen bg-[#b30018] px-6 pb-24 pt-44 text-white">
        <section className="mx-auto max-w-7xl">
          <div className="text-center">
            <p className="font-black uppercase tracking-[0.35em] text-red-100">
              Gallery
            </p>

            <h1 className="font-display mt-5 text-6xl font-bold md:text-8xl">
              Moments & Memories
            </h1>

            <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-white/75">
              Photos, events, memories, and highlights from Delly&apos;s
              Matchups.
            </p>
          </div>

          {loading && (
            <p className="mt-16 text-center text-xl font-black">
              Loading gallery...
            </p>
          )}

          {!loading && images.length === 0 && (
            <div className="mx-auto mt-16 max-w-3xl rounded-[3rem] bg-black/25 p-10 text-center shadow-2xl">
              <h2 className="font-display text-5xl font-bold">
                No Gallery Images Yet
              </h2>

              <p className="mt-5 text-white/70">
                Gallery images will appear here once published.
              </p>
            </div>
          )}

          {!loading && images.length > 0 && (
            <>
              <div className="mt-12 flex flex-wrap justify-center gap-3">
                {categories.map((category) => (
                  <button
                    key={category}
                    type="button"
                    onClick={() => setActiveCategory(category)}
                    className={`rounded-full px-6 py-3 font-black transition ${
                      activeCategory === category
                        ? "bg-white text-[#b30018]"
                        : "bg-black/25 text-white hover:bg-white/10"
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>

              <div className="mt-14 columns-1 gap-6 md:columns-2 xl:columns-3">
                {filteredImages.map((image) => (
                  <button
                    key={image.id}
                    type="button"
                    onClick={() => setSelectedImage(image)}
                    className="mb-6 block w-full overflow-hidden rounded-[2.5rem] bg-black/25 p-3 text-left shadow-2xl transition hover:scale-[1.01]"
                  >
                    <img
                      src={image.image_url}
                      alt={image.title}
                      className="w-full rounded-[2rem] object-cover"
                    />

                    <div className="p-4">
                      <div className="flex items-center justify-between gap-4">
                        <h2 className="font-display text-3xl font-bold">
                          {image.title}
                        </h2>

                        {image.featured && (
                          <span className="rounded-full bg-white px-4 py-2 text-xs font-black uppercase text-[#b30018]">
                            Featured
                          </span>
                        )}
                      </div>

                      <p className="mt-2 text-sm font-bold text-white/60">
                        {image.category || "General"}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}
        </section>
      </main>

      {selectedImage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 px-6">
          <button
            type="button"
            onClick={() => setSelectedImage(null)}
            className="absolute right-6 top-6 rounded-full bg-white px-5 py-3 font-black text-[#b30018]"
          >
            Close
          </button>

          <div className="max-h-[90vh] max-w-6xl">
            <img
              src={selectedImage.image_url}
              alt={selectedImage.title}
              className="max-h-[80vh] w-full rounded-[2rem] object-contain"
            />

            <div className="mt-5 text-center text-white">
              <h2 className="font-display text-4xl font-bold">
                {selectedImage.title}
              </h2>

              <p className="mt-2 text-white/60">
                {selectedImage.category || "General"}
              </p>
            </div>
          </div>
        </div>
      )}

      <SiteFooter />
    </>
  );
}
