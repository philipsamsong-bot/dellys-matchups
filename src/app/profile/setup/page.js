"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { SiteNav, SiteFooter } from "@/app/components/SiteChrome";

const emptyForm = {
  age: "",
  gender: "",
  country: "",
  city: "",
  phone: "",
  occupation: "",
  faith_background: "",
  relationship_goal: "",
  interests: "",
  bio: "",
};

const relationshipGoals = [
  "Intentional relationship",
  "Courtship leading to marriage",
  "Marriage preparation",
  "Friendship first",
  "Healing before relationship",
  "Counselling and mentorship",
];

export default function ProfileSetupPage() {
  const [user, setUser] = useState(null);
  const [photo, setPhoto] = useState(null);
  const [loading, setLoading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    const draft = localStorage.getItem("profile-draft");

    if (draft) {
      setForm(JSON.parse(draft));
    }

    async function getUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        window.location.href = "/auth/login";
        return;
      }

      setUser(user);

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profile) {
        setAvatarUrl(profile.avatar_url || "");
        setForm({
          age: profile.age || "",
          gender: profile.gender || "",
          country: profile.country || "",
          city: profile.city || "",
          phone: profile.phone || "",
          occupation: profile.occupation || "",
          faith_background: profile.faith_background || "",
          relationship_goal: profile.relationship_goal || "",
          interests: profile.interests || "",
          bio: profile.bio || "",
        });
      }
    }

    getUser();
  }, []);

  useEffect(() => {
    localStorage.setItem("profile-draft", JSON.stringify(form));
  }, [form]);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));
  }

  async function uploadPhoto() {
    if (!photo || !user) return null;

    const fileExt = photo.name.split(".").pop();
    const fileName = `${user.id}-${Date.now()}.${fileExt}`;
    const filePath = `${user.id}/${fileName}`;

    const { error } = await supabase.storage
      .from("profile-photos")
      .upload(filePath, photo, { upsert: true });

    if (error) {
      throw error;
    }

    const { data } = supabase.storage
      .from("profile-photos")
      .getPublicUrl(filePath);

    return data.publicUrl;
  }

  function isProfileComplete(updates) {
    return Boolean(
      updates.age &&
        updates.gender &&
        updates.country &&
        updates.city &&
        updates.relationship_goal &&
        updates.bio &&
        updates.interests
    );
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!user) {
      alert("Please login first.");
      return;
    }

    setLoading(true);

    try {
      const uploadedAvatarUrl = await uploadPhoto();

      const updates = {
        age: form.age ? Number(form.age) : null,
        gender: form.gender,
        country: form.country,
        city: form.city,
        phone: form.phone,
        occupation: form.occupation,
        faith_background: form.faith_background,
        relationship_goal: form.relationship_goal,
        interests: form.interests,
        bio: form.bio,
        updated_at: new Date().toISOString(),
      };

      updates.is_complete = isProfileComplete(updates);

      if (uploadedAvatarUrl) {
        updates.avatar_url = uploadedAvatarUrl;
        setAvatarUrl(uploadedAvatarUrl);
      }

      const { error } = await supabase.from("profiles").upsert({
        id: user.id,
        ...updates,
      });

      if (error) {
        alert(error.message);
        return;
      }

      localStorage.removeItem("profile-draft");
      alert("Profile saved!");
      window.location.href = "/dashboard";
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  }

  const completionFields = [
    form.age,
    form.gender,
    form.country,
    form.city,
    form.relationship_goal,
    form.interests,
    form.bio,
    previewUrl || avatarUrl,
  ];

  const completionPercentage = Math.round(
    (completionFields.filter(Boolean).length / completionFields.length) * 100
  );

  return (
    <>
      <SiteNav />

      <main className="min-h-screen bg-[#b30018] px-6 pb-24 pt-44 text-white">
        <div className="mx-auto max-w-5xl">
          <motion.div
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <p className="text-sm font-black uppercase tracking-[0.45em] text-red-100">
              Profile Setup
            </p>

            <h1 className="font-display mt-6 text-6xl font-bold leading-none md:text-8xl">
              Build Your Profile
            </h1>

            <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-white/80">
              Help us understand your relationship journey so Delly&apos;s
              Matchups can support intentional, meaningful connections.
            </p>
          </motion.div>

          <div className="mx-auto mt-10 max-w-3xl">
            <div className="mb-3 flex items-center justify-between text-sm font-bold text-white">
              <span>Profile Completion</span>
              <span>{completionPercentage}%</span>
            </div>

            <div className="h-3 overflow-hidden rounded-full bg-white/20">
              <div
                className="h-full rounded-full bg-white transition-all duration-500"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </div>

          <motion.form
            onSubmit={handleSubmit}
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="mx-auto mt-14 rounded-[3rem] bg-[#c1121f] p-8 shadow-2xl md:p-12"
          >
            <div className="rounded-[2rem] border border-white/15 bg-white/10 p-6">
              <h2 className="font-display text-4xl font-bold">
                Profile Photo
              </h2>

              {(previewUrl || avatarUrl) && (
                <div className="mt-6 flex justify-center">
                  <img
                    src={previewUrl || avatarUrl}
                    alt="Profile"
                    className="h-40 w-40 rounded-full border-4 border-white object-cover shadow-xl"
                  />
                </div>
              )}

              <input
                type="file"
                accept="image/*"
                className="mt-6 w-full rounded-2xl border border-white/15 bg-white/10 px-5 py-4 text-white outline-none file:mr-4 file:rounded-full file:border-0 file:bg-white file:px-5 file:py-2 file:font-bold file:text-[#b30018]"
                onChange={(event) => {
                  const selectedFile = event.target.files?.[0] || null;
                  setPhoto(selectedFile);

                  if (selectedFile) {
                    setPreviewUrl(URL.createObjectURL(selectedFile));
                  }
                }}
              />
            </div>

            <div className="mt-8 rounded-[2rem] border border-white/15 bg-white/10 p-6">
              <h2 className="font-display text-4xl font-bold">
                Personal Information
              </h2>

              <div className="mt-6 grid gap-6 md:grid-cols-2">
                <input
                  type="number"
                  name="age"
                  placeholder="Age"
                  min="18"
                  className="h-16 rounded-2xl border border-white/15 bg-white/10 px-5 text-white outline-none placeholder:text-white/60"
                  value={form.age}
                  onChange={handleChange}
                />

                <select
                  name="gender"
                  className="h-16 rounded-2xl border border-white/15 bg-white/10 px-5 text-white outline-none"
                  value={form.gender}
                  onChange={handleChange}
                >
                  <option value="" className="text-black">
                    Select gender
                  </option>
                  <option value="Woman" className="text-black">
                    Woman
                  </option>
                  <option value="Man" className="text-black">
                    Man
                  </option>
                  <option value="Prefer not to say" className="text-black">
                    Prefer not to say
                  </option>
                </select>

                <input
                  type="text"
                  name="country"
                  placeholder="Country"
                  className="h-16 rounded-2xl border border-white/15 bg-white/10 px-5 text-white outline-none placeholder:text-white/60"
                  value={form.country}
                  onChange={handleChange}
                />

                <input
                  type="text"
                  name="city"
                  placeholder="City"
                  className="h-16 rounded-2xl border border-white/15 bg-white/10 px-5 text-white outline-none placeholder:text-white/60"
                  value={form.city}
                  onChange={handleChange}
                />

                <input
                  type="tel"
                  name="phone"
                  placeholder="Phone number"
                  className="h-16 rounded-2xl border border-white/15 bg-white/10 px-5 text-white outline-none placeholder:text-white/60"
                  value={form.phone}
                  onChange={handleChange}
                />

                <input
                  type="text"
                  name="occupation"
                  placeholder="Occupation"
                  className="h-16 rounded-2xl border border-white/15 bg-white/10 px-5 text-white outline-none placeholder:text-white/60"
                  value={form.occupation}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="mt-8 rounded-[2rem] border border-white/15 bg-white/10 p-6">
              <h2 className="font-display text-4xl font-bold">
                Faith & Relationship Journey
              </h2>

              <div className="mt-6 grid gap-6">
                <input
                  type="text"
                  name="faith_background"
                  placeholder="Faith background e.g. Christian, church community, ministry"
                  className="h-16 rounded-2xl border border-white/15 bg-white/10 px-5 text-white outline-none placeholder:text-white/60"
                  value={form.faith_background}
                  onChange={handleChange}
                />

                <select
                  name="relationship_goal"
                  className="h-16 rounded-2xl border border-white/15 bg-white/10 px-5 text-white outline-none"
                  value={form.relationship_goal}
                  onChange={handleChange}
                >
                  <option value="" className="text-black">
                    Select relationship goal
                  </option>

                  {relationshipGoals.map((goal) => (
                    <option key={goal} value={goal} className="text-black">
                      {goal}
                    </option>
                  ))}
                </select>

                <input
                  type="text"
                  name="interests"
                  placeholder="Interests e.g. faith, family, travel, business"
                  className="h-16 rounded-2xl border border-white/15 bg-white/10 px-5 text-white outline-none placeholder:text-white/60"
                  value={form.interests}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="mt-8 rounded-[2rem] border border-white/15 bg-white/10 p-6">
              <h2 className="font-display text-4xl font-bold">About You</h2>

              <textarea
                name="bio"
                placeholder="Tell us about yourself, your values, and what you are prayerfully looking for..."
                rows="6"
                className="mt-6 w-full rounded-2xl border border-white/15 bg-white/10 px-5 py-5 text-white outline-none placeholder:text-white/60"
                value={form.bio}
                onChange={handleChange}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-10 w-full rounded-full bg-white py-5 text-lg font-black text-[#b30018] transition hover:scale-105 disabled:opacity-60"
            >
              {loading ? "Saving..." : "Save Profile"}
            </button>
          </motion.form>
        </div>
      </main>

      <SiteFooter />
    </>
  );
}
