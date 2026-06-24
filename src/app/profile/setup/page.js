"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { SiteNav, SiteFooter } from "@/app/components/SiteChrome";

const countries = [
  "Cameroon",
  "Nigeria",
  "Ghana",
  "South Africa",
  "Kenya",
  "Uganda",
  "Tanzania",
  "Rwanda",
  "Zambia",
  "Zimbabwe",
  "Ethiopia",
  "United Kingdom",
  "United States",
  "Canada",
  "France",
  "Germany",
  "Belgium",
  "Netherlands",
  "Italy",
  "Spain",
  "Ireland",
  "Switzerland",
  "Australia",
  "United Arab Emirates",
  "Qatar",
  "Saudi Arabia",
  "China",
  "India",
  "Brazil",
  "Other",
];

const countryDialCodes = {
  Cameroon: "+237",
  Nigeria: "+234",
  Ghana: "+233",
  "South Africa": "+27",
  Kenya: "+254",
  Uganda: "+256",
  Tanzania: "+255",
  Rwanda: "+250",
  Zambia: "+260",
  Zimbabwe: "+263",
  Ethiopia: "+251",
  "United Kingdom": "+44",
  "United States": "+1",
  Canada: "+1",
  France: "+33",
  Germany: "+49",
  Belgium: "+32",
  Netherlands: "+31",
  Italy: "+39",
  Spain: "+34",
  Ireland: "+353",
  Switzerland: "+41",
  Australia: "+61",
  "United Arab Emirates": "+971",
  Qatar: "+974",
  "Saudi Arabia": "+966",
  China: "+86",
  India: "+91",
  Brazil: "+55",
  Other: "",
};

const dialCodes = [...new Set(Object.values(countryDialCodes).filter(Boolean))];

const emptyForm = {
  full_name: "",
  email: "",
  age: "",
  gender: "",
  marital_status: "",
  country: "",
  postal_code: "",
  phone_code: "",
  phone: "",
  city: "",
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

const maritalStatuses = [
  "Single",
  "Dating",
  "Engaged",
  "Separated",
  "Divorced",
  "Widowed",
  "Married",
  "Prefer not to say",
];

function splitPhoneNumber(phone) {
  if (!phone) {
    return { phone_code: "", phone: "" };
  }

  const matchedCode = dialCodes
    .sort((a, b) => b.length - a.length)
    .find((code) => phone.startsWith(code));

  if (!matchedCode) {
    return { phone_code: "", phone };
  }

  return {
    phone_code: matchedCode,
    phone: phone.replace(matchedCode, "").trim(),
  };
}

function ProfileSetupPage() {
  const [user, setUser] = useState(null);
  const [photo, setPhoto] = useState(null);
  const [loading, setLoading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
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

      const metadataName = user.user_metadata?.full_name || "";
      const profilePhone = splitPhoneNumber(profile?.phone || "");

      if (profile) {
        setAvatarUrl(profile.avatar_url || "");
        setForm({
          full_name: profile.full_name || metadataName || "",
          email: profile.email || user.email || "",
          age: profile.age || "",
          gender: profile.gender || "",
          marital_status: profile.marital_status || "",
          country: profile.country || "",
          postal_code: profile.postal_code || "",
          phone_code:
            profilePhone.phone_code ||
            countryDialCodes[profile.country] ||
            "",
          phone: profilePhone.phone || "",
          city: profile.city || "",
          occupation: profile.occupation || "",
          faith_background: profile.faith_background || "",
          relationship_goal: profile.relationship_goal || "",
          interests: profile.interests || "",
          bio: profile.bio || "",
        });
        return;
      }

      setForm((current) => ({
        ...current,
        full_name: metadataName,
        email: user.email || "",
      }));
    }

    getUser();
  }, []);

  useEffect(() => {
    localStorage.setItem("profile-draft", JSON.stringify(form));
  }, [form]);

  const completionPercentage = useMemo(() => {
    const completionFields = [
      form.full_name,
      form.email,
      form.age,
      form.gender,
      form.marital_status,
      form.country,
      form.postal_code,
      form.phone_code,
      form.phone,
      form.city,
      form.relationship_goal,
      form.interests,
      form.bio,
      previewUrl || avatarUrl,
    ];

    return Math.round(
      (completionFields.filter(Boolean).length / completionFields.length) * 100
    );
  }, [form, previewUrl, avatarUrl]);

  function handleChange(event) {
    const { name, value } = event.target;

    if (name === "country") {
      setForm((currentForm) => ({
        ...currentForm,
        country: value,
        phone_code: countryDialCodes[value] || currentForm.phone_code,
      }));
      return;
    }

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

    if (error) throw error;

    const { data } = supabase.storage
      .from("profile-photos")
      .getPublicUrl(filePath);

    return data.publicUrl;
  }

  function isProfileComplete(updates) {
    return Boolean(
      updates.full_name &&
        updates.email &&
        updates.age &&
        updates.gender &&
        updates.marital_status &&
        updates.country &&
        updates.postal_code &&
        updates.phone &&
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
      const cleanPhone = form.phone.replace(/^0+/, "").trim();
      const fullPhone = `${form.phone_code}${cleanPhone}`;

      const updates = {
        id: user.id,
        full_name: form.full_name.trim(),
        email: form.email.trim().toLowerCase(),
        age: form.age ? Number(form.age) : null,
        gender: form.gender,
        marital_status: form.marital_status,
        country: form.country,
        postal_code: form.postal_code.trim(),
        phone: fullPhone,
        city: form.city.trim(),
        occupation: form.occupation.trim(),
        faith_background: form.faith_background.trim(),
        relationship_goal: form.relationship_goal,
        interests: form.interests.trim(),
        bio: form.bio.trim(),
        matchups_eligible: form.marital_status !== "Married",
        is_visible: form.marital_status !== "Married",
        updated_at: new Date().toISOString(),
      };

      updates.is_complete = isProfileComplete(updates);

      if (uploadedAvatarUrl) {
        updates.avatar_url = uploadedAvatarUrl;
        setAvatarUrl(uploadedAvatarUrl);
      }

      const { error } = await supabase.from("profiles").upsert(updates);

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
              Complete your profile so Delly&apos;s Matchups can support
              intentional, meaningful connections.
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
                    className="h-40 w-40 rounded-full border-4 border-white object-cover object-top shadow-xl"
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
                  type="text"
                  name="full_name"
                  placeholder="Enter your full name"
                  className="h-16 rounded-2xl border border-white/15 bg-white/10 px-5 text-white outline-none placeholder:text-white/60"
                  value={form.full_name}
                  onChange={handleChange}
                  required
                />

                <input
                  type="email"
                  name="email"
                  placeholder="Enter your email address"
                  className="h-16 rounded-2xl border border-white/15 bg-white/10 px-5 text-white outline-none placeholder:text-white/60"
                  value={form.email}
                  onChange={handleChange}
                  required
                />

                <input
                  type="number"
                  name="age"
                  placeholder="Enter your age"
                  min="18"
                  className="h-16 rounded-2xl border border-white/15 bg-white/10 px-5 text-white outline-none placeholder:text-white/60"
                  value={form.age}
                  onChange={handleChange}
                  required
                />

                <select
                  name="gender"
                  className="h-16 rounded-2xl border border-white/15 bg-white/10 px-5 text-white outline-none"
                  value={form.gender}
                  onChange={handleChange}
                  required
                >
                  <option value="" className="text-black">
                    Select your gender
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

                <select
                  name="marital_status"
                  className="h-16 rounded-2xl border border-white/15 bg-white/10 px-5 text-white outline-none"
                  value={form.marital_status}
                  onChange={handleChange}
                  required
                >
                  <option value="" className="text-black">
                    Select your relationship status
                  </option>
                  {maritalStatuses.map((status) => (
                    <option key={status} value={status} className="text-black">
                      {status}
                    </option>
                  ))}
                </select>

                <input
                  type="text"
                  name="city"
                  placeholder="Enter your city"
                  className="h-16 rounded-2xl border border-white/15 bg-white/10 px-5 text-white outline-none placeholder:text-white/60"
                  value={form.city}
                  onChange={handleChange}
                  required
                />

                <select
                  name="country"
                  className="h-16 rounded-2xl border border-white/15 bg-white/10 px-5 text-white outline-none md:col-span-2"
                  value={form.country}
                  onChange={handleChange}
                  required
                >
                  <option value="" className="text-black">
                    Select your country
                  </option>
                  {countries.map((country) => (
                    <option key={country} value={country} className="text-black">
                      {country}
                    </option>
                  ))}
                </select>

                <input
                  type="text"
                  name="postal_code"
                  placeholder="Enter postal / ZIP code"
                  className="h-16 rounded-2xl border border-white/15 bg-white/10 px-5 text-white outline-none placeholder:text-white/60"
                  value={form.postal_code}
                  onChange={handleChange}
                  required
                />

                <div className="flex h-16 overflow-hidden rounded-2xl border border-white/15 bg-white/10">
                  <select
                    name="phone_code"
                    value={form.phone_code}
                    onChange={handleChange}
                    required
                    className="w-28 bg-white/10 px-3 text-white outline-none"
                  >
                    <option value="" className="text-black">
                      Code
                    </option>
                    {dialCodes.map((code) => (
                      <option key={code} value={code} className="text-black">
                        {code}
                      </option>
                    ))}
                  </select>

                  <input
                    type="tel"
                    name="phone"
                    placeholder="Phone / WhatsApp number"
                    className="min-w-0 flex-1 bg-transparent px-4 text-white outline-none placeholder:text-white/60"
                    value={form.phone}
                    onChange={handleChange}
                    required
                  />
                </div>

                <input
                  type="text"
                  name="occupation"
                  placeholder="Enter your occupation"
                  className="h-16 rounded-2xl border border-white/15 bg-white/10 px-5 text-white outline-none placeholder:text-white/60 md:col-span-2"
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
                  required
                >
                  <option value="" className="text-black">
                    Select your relationship goal
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
                  required
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
                required
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

export default ProfileSetupPage;
