"use client";

import { useEffect, useState } from "react";

import DashboardChrome from "@/app/components/DashboardChrome";

import { supabase } from "@/lib/supabase";

export default function MyAcademyPage() {

  const [courses, setCourses] = useState([]);

  const [loading, setLoading] = useState(true);

  useEffect(() => {

    loadCourses();

  }, []);

  async function loadCourses() {

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {

      window.location.href = "/auth/login";

      return;
    }

    const { data, error } = await supabase

      .from("academy_enrollments")

      .select("*")

      .eq("user_email", user.email)

      .eq("status", "active")

      .order("created_at", {
        ascending: false,
      });

    if (error) {

      alert(error.message);

      setLoading(false);

      return;
    }

    setCourses(data || []);

    setLoading(false);
  }

  return (

    <>

      <DashboardChrome />

      <main className="min-h-screen bg-[#b30018] px-6 pt-32 pb-20 text-white">

        <div className="mx-auto max-w-6xl">

          <p className="font-black uppercase tracking-[0.35em] text-red-100">

            My Academy

          </p>

          <h1 className="mt-5 font-serif text-6xl font-black">

            Unlocked Courses

          </h1>

          <p className="mt-5 max-w-2xl text-lg text-white/70">

            Continue your learning journey.

          </p>
          {loading ? (

<div className="mt-12 rounded-[2rem] bg-black/25 p-8">

  <p className="text-xl font-bold">
    Loading your courses...
  </p>

</div>

) : courses.length === 0 ? (

<div className="mt-12 rounded-[2rem] border border-white/10 bg-black/25 p-10 text-center">

  <h2 className="font-serif text-4xl font-black">
    No Courses Unlocked Yet
  </h2>

  <p className="mx-auto mt-4 max-w-xl text-white/70">
    Once your academy payment is approved, your unlocked courses
    will appear here.
  </p>

  <a
    href="/about/academy"
    className="mt-8 inline-flex rounded-full bg-white px-8 py-4 font-black text-[#b30018]"
  >
    Browse Academy
  </a>

</div>

) : (

<section className="mt-12 grid gap-6 md:grid-cols-2">

  {courses.map((course) => {

    const isFullAcademy =
      course.course_key === "full-academy" ||
      course.access_type === "full";

    const courseLink = isFullAcademy
      ? "/academy"
      : `/academy/learn/${course.course_key}`;

    return (

      <div
        key={course.id}
        className="rounded-[2rem] border border-white/10 bg-black/25 p-7 shadow-2xl"
      >

        <div className="inline-flex rounded-full bg-yellow-300 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-black">
          {isFullAcademy ? "Full Access" : "Unlocked"}
        </div>

        <h2 className="mt-5 font-serif text-4xl font-black">
          {course.course_title || "Academy Course"}
        </h2>

        <p className="mt-4 text-white/70">
          Status: {course.status || "active"}
        </p>

        <p className="mt-2 text-white/60">
          Access Type: {course.access_type || "single"}
        </p>

        <a
          href={courseLink}
          className="mt-8 inline-flex rounded-full bg-white px-7 py-4 font-black text-[#b30018] transition hover:scale-105"
        >
          Continue Learning
        </a>

      </div>

    );
  })}

</section>

)}

</div>

</main>

</>

);
}
