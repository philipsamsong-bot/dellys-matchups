"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { SiteNav, SiteFooter } from "@/app/components/SiteChrome";
import PostInteractions from "@/app/components/PostInteractions";
import { supabase } from "@/lib/supabase";

export default function ExceptionalCaseDetailPage() {
  const params = useParams();
  const caseId = params.id;

  const [caseItem, setCaseItem] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadExceptionalCase() {
      const { data, error } = await supabase
        .from("exceptional_cases")
        .select("*")
        .eq("id", caseId)
        .eq("published", true)
        .single();

      if (error) {
        setCaseItem(null);
        setLoading(false);
        return;
      }

      setCaseItem(data);
      setLoading(false);
    }

    if (caseId) {
      loadExceptionalCase();
    }
  }, [caseId]);

  if (loading) {
    return (
      <>
        <SiteNav />
        <main className="min-h-screen bg-[#b30018] px-6 pt-44 text-white">
          <p className="text-center text-xl font-black">
            Loading Exceptional Case...
          </p>
        </main>
        <SiteFooter />
      </>
    );
  }

  if (!caseItem) {
    return (
      <>
        <SiteNav />
        <main className="min-h-screen bg-[#b30018] px-6 pt-44 text-white">
          <div className="mx-auto max-w-5xl rounded-[3rem] bg-black/25 p-10 text-center">
            <h1 className="font-display text-6xl font-bold">
              Case Not Found
            </h1>

            <p className="mt-5 text-white/70">
              This Exceptional Case may have been removed or unpublished.
            </p>

            <a
              href="/blog/exceptional-cases"
              className="mt-8 inline-flex rounded-full bg-white px-8 py-4 font-black text-[#b30018]"
            >
              Back to Exceptional Cases
            </a>
          </div>
        </main>
        <SiteFooter />
      </>
    );
  }

  return (
    <>
      <SiteNav />

      <main className="min-h-screen bg-[#b30018] px-6 pb-24 pt-40 text-white">
      <section className="rounded-[3rem] bg-black/25 p-8 shadow-2xl backdrop-blur-xl md:p-12">
  <div className="grid gap-10 lg:grid-cols-[1.4fr_0.8fr]">
    
    <div>
      <p className="font-black uppercase tracking-[0.35em] text-red-100">
        Exceptional Case
      </p>

      <h1 className="font-display mt-5 text-5xl font-bold leading-tight md:text-7xl">
        {caseItem.title}
      </h1>

      <div className="mt-5 flex flex-wrap gap-4 text-sm font-bold text-white/60">
        <span>{caseItem.anonymous_name || "Anonymous"}</span>
        <span>•</span>
        <span>
          {new Date(caseItem.created_at).toLocaleDateString()}
        </span>
      </div>

      <div className="mt-10 rounded-[2rem] bg-white/10 p-8 md:p-10">
        <p className="whitespace-pre-line text-[1.18rem] leading-[2.15rem] tracking-[0.025em] text-white/90">
          {caseItem.content}
        </p>
      </div>
    </div>

    {caseItem.image_url && (
      <div>
        <div className="overflow-hidden rounded-[2.5rem] bg-white/10 p-3">
          <img
            src={caseItem.image_url}
            alt={caseItem.title}
            className="h-[800px] w-full rounded-[2rem] object-cover object-top"
          />
        </div>
      </div>
    )}

  </div>
</section>
<div className="mt-12">
            <PostInteractions
              postType="exceptional_case"
              postId={caseItem.id}
            />
          </div>
    
    

      </main>

      <SiteFooter />
    </>
  );
}
