// src/app/profile/setup/page.js

"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { compressImage } from "@/lib/compressImage";
import { SiteNav, SiteFooter } from "@/app/components/SiteChrome";

const ISO_COUNTRY_CODES = [
  "AF", "AL", "DZ", "AD", "AO", "AG", "AR", "AM", "AU", "AT", "AZ", "BS", "BH", "BD", "BB", "BY", "BE", "BZ", "BJ", "BT",
  "BO", "BA", "BW", "BR", "BN", "BG", "BF", "BI", "CV", "KH", "CM", "CA", "CF", "TD", "CL", "CN", "CO", "KM", "CG", "CD",
  "CR", "CI", "HR", "CU", "CY", "CZ", "DK", "DJ", "DM", "DO", "EC", "EG", "SV", "GQ", "ER", "EE", "SZ", "ET", "FJ", "FI",
  "FR", "GA", "GM", "GE", "DE", "GH", "GR", "GD", "GT", "GN", "GW", "GY", "HT", "HN", "HU", "IS", "IN", "ID", "IR", "IQ",
  "IE", "IL", "IT", "JM", "JP", "JO", "KZ", "KE", "KI", "KP", "KR", "KW", "KG", "LA", "LV", "LB", "LS", "LR", "LY", "LI",
  "LT", "LU", "MG", "MW", "MY", "MV", "ML", "MT", "MH", "MR", "MU", "MX", "FM", "MD", "MC", "MN", "ME", "MA", "MZ", "MM",
  "NA", "NR", "NP", "NL", "NZ", "NI", "NE", "NG", "MK", "NO", "OM", "PK", "PW", "PA", "PG", "PY", "PE", "PH", "PL", "PT",
  "QA", "RO", "RU", "RW", "KN", "LC", "VC", "WS", "SM", "ST", "SA", "SN", "RS", "SC", "SL", "SG", "SK", "SI", "SB", "SO",
  "ZA", "SS", "ES", "LK", "SD", "SR", "SE", "CH", "SY", "TJ", "TZ", "TH", "TL", "TG", "TO", "TT", "TN", "TR", "TM", "TV",
  "UG", "UA", "AE", "GB", "US", "UY", "UZ", "VU", "VA", "VE", "VN", "YE", "ZM", "ZW",
];

const COUNTRY_NAME_OVERRIDES = {
  AE: "United Arab Emirates",
  BO: "Bolivia",
  BN: "Brunei",
  CV: "Cape Verde",
  CZ: "Czech Republic",
  FM: "Micronesia",
  GB: "United Kingdom",
  IR: "Iran",
  KR: "South Korea",
  KP: "North Korea",
  LA: "Laos",
  MD: "Moldova",
  MK: "North Macedonia",
  RU: "Russia",
  SY: "Syria",
  TZ: "Tanzania",
  US: "United States",
  VE: "Venezuela",
  VN: "Vietnam",
};

const FALLBACK_COUNTRIES = [
  "Australia",
  "Belgium",
  "Brazil",
  "Cameroon",
  "Canada",
  "China",
  "Finland",
  "France",
  "Germany",
  "Ghana",
  "India",
  "Ireland",
  "Italy",
  "Kenya",
  "Netherlands",
  "Nigeria",
  "Qatar",
  "Rwanda",
  "Saudi Arabia",
  "South Africa",
  "Spain",
  "Sweden",
  "Switzerland",
  "Tanzania",
  "Uganda",
  "United Arab Emirates",
  "United Kingdom",
  "United States",
  "Zambia",
  "Zimbabwe",
  "Other",
];

const COUNTRY_DIAL_CODES = {
  Australia: "+61",
  Belgium: "+32",
  Brazil: "+55",
  Cameroon: "+237",
  Canada: "+1",
  China: "+86",
  Finland: "+358",
  France: "+33",
  Germany: "+49",
  Ghana: "+233",
  India: "+91",
  Ireland: "+353",
  Italy: "+39",
  Kenya: "+254",
  Netherlands: "+31",
  Nigeria: "+234",
  Norway: "+47",
  Portugal: "+351",
  Qatar: "+974",
  Rwanda: "+250",
  "Saudi Arabia": "+966",
  "South Africa": "+27",
  Spain: "+34",
  Sweden: "+46",
  Switzerland: "+41",
  Tanzania: "+255",
  Uganda: "+256",
  "United Arab Emirates": "+971",
  "United Kingdom": "+44",
  "United States": "+1",
  Zambia: "+260",
  Zimbabwe: "+263",
  Other: "",
};

const COUNTRY_POSTAL_RULES = {
  Australia: {
    label: "Postcode",
    required: true,
    regex: /^\d{4}$/,
    hint: "4 digits",
  },
  Austria: {
    label: "Postal code",
    required: true,
    regex: /^\d{4}$/,
    hint: "4 digits",
  },
  Belgium: {
    label: "Postal code",
    required: true,
    regex: /^\d{4}$/,
    hint: "4 digits",
  },
  Brazil: {
    label: "CEP",
    required: true,
    regex: /^\d{5}-?\d{3}$/,
    hint: "12345-678",
  },
  Canada: {
    label: "Postal code",
    required: true,
    regex: /^[A-Z]\d[A-Z][ -]?\d[A-Z]\d$/i,
    hint: "A1A 1A1",
  },
  China: {
    label: "Postal code",
    required: true,
    regex: /^\d{6}$/,
    hint: "6 digits",
  },
  Finland: {
    label: "Postal code",
    required: true,
    regex: /^\d{5}$/,
    hint: "5 digits",
  },
  France: {
    label: "Postal code",
    required: true,
    regex: /^\d{5}$/,
    hint: "5 digits",
  },
  Germany: {
    label: "Postal code",
    required: true,
    regex: /^\d{5}$/,
    hint: "5 digits",
  },
  India: {
    label: "PIN code",
    required: true,
    regex: /^\d{6}$/,
    hint: "6 digits",
  },
  Ireland: {
    label: "Eircode",
    required: false,
    regex: /^[AC-FHKNPRTV-Y]\d{2}\s?[0-9AC-FHKNPRTV-Y]{4}$/i,
    hint: "Optional, e.g. D02 X285",
  },
  Italy: {
    label: "Postal code",
    required: true,
    regex: /^\d{5}$/,
    hint: "5 digits",
  },
  Netherlands: {
    label: "Postcode",
    required: true,
    regex: /^\d{4}\s?[A-Z]{2}$/i,
    hint: "1234 AB",
  },
  Nigeria: {
    label: "Postal code",
    required: true,
    regex: /^\d{6}$/,
    hint: "6 digits",
  },
  Norway: {
    label: "Postal code",
    required: true,
    regex: /^\d{4}$/,
    hint: "4 digits",
  },
  Portugal: {
    label: "Postal code",
    required: true,
    regex: /^\d{4}-\d{3}$/,
    hint: "1234-567",
  },
  "Saudi Arabia": {
    label: "Postal code",
    required: true,
    regex: /^\d{5}$/,
    hint: "5 digits",
  },
  "South Africa": {
    label: "Postal code",
    required: true,
    regex: /^\d{4}$/,
    hint: "4 digits",
  },
  Spain: {
    label: "Postal code",
    required: true,
    regex: /^\d{5}$/,
    hint: "5 digits",
  },
  Sweden: {
    label: "Postcode",
    required: true,
    regex: /^\d{3}\s?\d{2}$/,
    hint: "123 45",
  },
  Switzerland: {
    label: "Postal code",
    required: true,
    regex: /^\d{4}$/,
    hint: "4 digits",
  },
  "United Kingdom": {
    label: "Postcode",
    required: true,
    regex: /^[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}$/i,
    hint: "SW1A 1AA",
  },
  "United States": {
    label: "ZIP code",
    required: true,
    regex: /^\d{5}(-\d{4})?$/,
    hint: "12345 or 12345-6789",
  },
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

const genotypes = ["AA", "AS", "SS", "AC", "SC", "Not sure", "Prefer not to say"];

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
  religious_background: "",
  genotype: "",
  height: "",
  relationship_goal: "",
  interests: "",
  bio: "",
};

function getPlan(profile) {
  return profile?.plan || profile?.membership_plan || profile?.subscription || "free";
}

function getGalleryLimit(plan) {
  if (plan === "vip") return Infinity;
  if (plan === "premium") return 5;
  return 0;
}

function buildCountryList() {
  if (typeof Intl === "undefined" || typeof Intl.DisplayNames !== "function") {
    return FALLBACK_COUNTRIES;
  }

  const regionNames = new Intl.DisplayNames(["en"], { type: "region" });

  return [
    ...ISO_COUNTRY_CODES.map((code) => COUNTRY_NAME_OVERRIDES[code] || regionNames.of(code))
      .filter((name) => typeof name === "string" && name.trim())
      .sort((a, b) => a.localeCompare(b)),
    "Other",
  ];
}

function getDialCodes() {
  return [...new Set(Object.values(COUNTRY_DIAL_CODES).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b)
  );
}

function splitPhoneNumber(phone) {
  if (!phone) return { phone_code: "", phone: "" };

  const dialCodes = getDialCodes();
  const matchedCode = [...dialCodes]
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

function getGallery(profile) {
  const gallery = profile?.gallery_urls || profile?.photos || profile?.photo_urls || [];
  return Array.isArray(gallery) ? gallery.filter(Boolean) : [];
}

function getPostalConfig(country) {
  if (!country || country === "Other") {
    return {
      label: "Postal code",
      required: false,
      regex: null,
      hint: "Optional",
    };
  }

  return (
    COUNTRY_POSTAL_RULES[country] || {
      label: "Postal code",
      required: false,
      regex: null,
      hint: "Optional",
    }
  );
}

function normalizePostalCode(value) {
  return value.trim().toUpperCase();
}

function validatePostalCode(country, postalCode) {
  const config = getPostalConfig(country);
  const value = normalizePostalCode(postalCode);

  if (!config.required && !value) {
    return "";
  }

  if (config.required && !value) {
    return `${config.label} is required for ${country}.`;
  }

  if (config.regex && value && !config.regex.test(value)) {
    return `Enter a valid ${config.label.toLowerCase()} for ${country}${config.hint ? ` (${config.hint})` : ""}.`;
  }

  return "";
}

function ProfileSetupPage() {
  const [user, setUser] = useState(null);
  const [plan, setPlan] = useState("free");
  const [photo, setPhoto] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [galleryUrls, setGalleryUrls] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [postalError, setPostalError] = useState("");

  const countries = useMemo(buildCountryList, []);
  const dialCodes = useMemo(getDialCodes, []);
  const selectedPostalConfig = useMemo(() => getPostalConfig(form.country), [form.country]);

  const galleryLimit = getGalleryLimit(plan);
  const canUploadGallery = galleryLimit > 0;
  const remainingGallerySlots =
    galleryLimit === Infinity ? Infinity : Math.max(galleryLimit - galleryUrls.length, 0);

  useEffect(() => {
    async function getUser() {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (!authUser) {
        window.location.href = "/auth/login";
        return;
      }

      setUser(authUser);

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", authUser.id)
        .single();

      const metadataName = authUser.user_metadata?.full_name || "";
      const profilePhone = splitPhoneNumber(profile?.phone || "");

      if (profile) {
        setPlan(getPlan(profile));
        setAvatarUrl(profile.avatar_url || "");
        setGalleryUrls(getGallery(profile));

        setForm({
          full_name: profile.full_name || metadataName || "",
          email: profile.email || authUser.email || "",
          age: profile.age || "",
          gender: profile.gender || "",
          marital_status: profile.marital_status || "",
          country: profile.country || "",
          postal_code: profile.postal_code || "",
          phone_code: profilePhone.phone_code || COUNTRY_DIAL_CODES[profile.country] || "",
          phone: profilePhone.phone || "",
          city: profile.city || "",
          occupation: profile.occupation || "",
          religious_background: profile.religious_background || profile.faith_background || "",
          genotype: profile.genotype || "",
          height: profile.height || "",
          relationship_goal: profile.relationship_goal || "",
          interests: profile.interests || "",
          bio: profile.bio || "",
        });

        return;
      }

      setForm((current) => ({
        ...current,
        full_name: metadataName,
        email: authUser.email || "",
      }));
    }

    getUser();
  }, []);

  useEffect(() => {
    localStorage.setItem("profile-draft", JSON.stringify(form));
  }, [form]);

  useEffect(() => {
    if (!form.country) {
      setPostalError("");
      return;
    }

    setPostalError(validatePostalCode(form.country, form.postal_code));
  }, [form.country, form.postal_code]);

  const completionPercentage = useMemo(() => {
    const baseFields = [
      form.full_name,
      form.email,
      form.age,
      form.gender,
      form.marital_status,
      form.country,
      form.city,
      form.relationship_goal,
      form.interests,
      form.bio,
      previewUrl || avatarUrl,
    ];

    const completionFields = selectedPostalConfig.required
      ? [...baseFields, form.postal_code]
      : baseFields;

    return Math.round((completionFields.filter(Boolean).length / completionFields.length) * 100);
  }, [form, previewUrl, avatarUrl, selectedPostalConfig.required]);

  function handleChange(event) {
    const { name, value } = event.target;

    if (name === "country") {
      setForm((currentForm) => ({
        ...currentForm,
        country: value,
        postal_code: "",
        phone_code: COUNTRY_DIAL_CODES[value] || currentForm.phone_code,
      }));
      setPostalError("");
      return;
    }

    setForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));
  }

  async function uploadPhoto() {
    if (!photo || !user) return null;

    const compressedPhoto = await compressImage(photo, {
      maxWidth: 900,
      maxHeight: 1200,
      quality: 0.78,
      outputType: "image/webp",
    });

    const fileName = `${user.id}-${Date.now()}.webp`;
    const filePath = `${user.id}/${fileName}`;

    const { error } = await supabase.storage.from("profile-photos").upload(filePath, compressedPhoto, {
      contentType: "image/webp",
      upsert: true,
    });

    if (error) {
      throw error;
    }

    const { data } = supabase.storage.from("profile-photos").getPublicUrl(filePath);
    return data.publicUrl;
  }

  async function uploadGalleryFiles(event) {
    const selectedFiles = Array.from(event.target.files || []);

    if (!selectedFiles.length || !user) return;

    if (!canUploadGallery) {
      alert("Gallery uploads are available for Premium and VIP members only.");
      return;
    }

    const allowedFiles =
      galleryLimit === Infinity ? selectedFiles : selectedFiles.slice(0, remainingGallerySlots);

    if (galleryLimit !== Infinity && selectedFiles.length > remainingGallerySlots) {
      alert(`Premium members can upload up to ${galleryLimit} gallery photos.`);
    }

    if (!allowedFiles.length) return;

    setUploadingGallery(true);

    try {
      const uploadedUrls = [];

      for (const file of allowedFiles) {
        const compressedFile = await compressImage(file, {
          maxWidth: 900,
          maxHeight: 1200,
          quality: 0.78,
          outputType: "image/webp",
        });

        const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.webp`;
        const filePath = `${user.id}/gallery/${fileName}`;

        const { error } = await supabase.storage
          .from("profile-photos")
          .upload(filePath, compressedFile, {
            contentType: "image/webp",
            upsert: true,
          });

        if (error) {
          throw error;
        }

        const { data } = supabase.storage.from("profile-photos").getPublicUrl(filePath);
        uploadedUrls.push(data.publicUrl);
      }

      setGalleryUrls((current) => [...current, ...uploadedUrls]);
    } catch (error) {
      alert(error.message);
    } finally {
      setUploadingGallery(false);
      event.target.value = "";
    }
  }

  function removeGalleryImage(imageUrl) {
    setGalleryUrls((current) => current.filter((url) => url !== imageUrl));
  }

  function isProfileComplete(updates) {
    const postalConfig = getPostalConfig(updates.country);
    const hasPostal = postalConfig.required ? Boolean(updates.postal_code) : true;

    return Boolean(
      updates.full_name &&
        updates.email &&
        updates.age &&
        updates.gender &&
        updates.marital_status &&
        updates.country &&
        updates.city &&
        updates.relationship_goal &&
        updates.bio &&
        updates.interests &&
        updates.avatar_url &&
        hasPostal
    );
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!user) {
      alert("Please login first.");
      return;
    }

    const normalizedPostalCode = normalizePostalCode(form.postal_code);
    const postalValidationMessage = validatePostalCode(form.country, normalizedPostalCode);

    if (postalValidationMessage) {
      setPostalError(postalValidationMessage);
      alert(postalValidationMessage);
      return;
    }

    setLoading(true);

    try {
      const uploadedAvatarUrl = await uploadPhoto();
      const cleanPhone = form.phone.replace(/^0+/, "").trim();
      const fullPhone = form.phone_code && cleanPhone ? `${form.phone_code}${cleanPhone}` : "";

      const updates = {
        id: user.id,
        full_name: form.full_name.trim(),
        email: form.email.trim().toLowerCase(),
        age: form.age ? Number(form.age) : null,
        gender: form.gender,
        marital_status: form.marital_status,
        country: form.country,
        postal_code: normalizedPostalCode || null,
        phone: fullPhone,
        city: form.city.trim(),
        occupation: form.occupation.trim(),
        religious_background: form.religious_background.trim(),
        faith_background: form.religious_background.trim(),
        genotype: form.genotype,
        height: form.height.trim(),
        relationship_goal: form.relationship_goal,
        interests: form.interests.trim(),
        bio: form.bio.trim(),
        gallery_urls: galleryUrls,
        matchups_eligible: form.marital_status !== "Married",
        is_visible: form.marital_status !== "Married",
        updated_at: new Date().toISOString(),
        avatar_url: uploadedAvatarUrl || avatarUrl || null,
      };

      updates.is_complete = isProfileComplete(updates);

      const { error } = await supabase.from("profiles").upsert(updates);

      if (error) {
        alert(error.message);
        return;
      }

      if (uploadedAvatarUrl) {
        setAvatarUrl(uploadedAvatarUrl);
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
              Complete your profile so Delly&apos;s Matchups can support intentional,
              meaningful connections.
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
              <h2 className="font-display text-4xl font-bold">Profile Photo</h2>

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
              <h2 className="font-display text-4xl font-bold">Gallery Photos</h2>

              <p className="mt-3 text-white/75">
                {plan === "vip"
                  ? "VIP members can upload unlimited gallery photos."
                  : plan === "premium"
                    ? "Premium members can upload up to 5 gallery photos."
                    : "Gallery uploads are available for Premium and VIP members."}
              </p>

              {galleryUrls.length > 0 && (
                <div className="mt-6 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                  {galleryUrls.map((imageUrl) => (
                    <div key={imageUrl} className="relative overflow-hidden rounded-[2rem]">
                      <img
                        src={imageUrl}
                        alt="Gallery"
                        className="h-56 w-full object-cover object-top"
                      />
                      <button
                        type="button"
                        onClick={() => removeGalleryImage(imageUrl)}
                        className="absolute right-3 top-3 rounded-full bg-black/70 px-4 py-2 text-sm font-black text-white"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {canUploadGallery ? (
                <>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    disabled={uploadingGallery || remainingGallerySlots === 0}
                    onChange={uploadGalleryFiles}
                    className="mt-6 w-full rounded-2xl border border-white/15 bg-white/10 px-5 py-4 text-white outline-none file:mr-4 file:rounded-full file:border-0 file:bg-white file:px-5 file:py-2 file:font-bold file:text-[#b30018] disabled:opacity-50"
                  />

                  <p className="mt-3 text-sm text-white/65">
                    {uploadingGallery
                      ? "Compressing and uploading gallery photos..."
                      : galleryLimit === Infinity
                        ? `${galleryUrls.length} gallery photos uploaded.`
                        : `${galleryUrls.length}/${galleryLimit} gallery photos uploaded.`}
                  </p>
                </>
              ) : (
                <a
                  href="/matchups/checkout?plan=premium"
                  className="mt-6 inline-flex rounded-full bg-white px-8 py-4 font-black text-[#b30018] transition hover:scale-105"
                >
                  Upgrade to Add Gallery Photos
                </a>
              )}
            </div>

            <div className="mt-8 rounded-[2rem] border border-white/15 bg-white/10 p-6">
              <h2 className="font-display text-4xl font-bold">Personal Information</h2>

              <div className="mt-6 grid gap-6 md:grid-cols-2">
                <input
                  type="text"
                  name="full_name"
                  placeholder="Enter your full name"
                  className="h-16 rounded-2xl border border-white/15 bg-white/10 px-5 text-white outline-none placeholder:text-white/60"
                  value={form.full_name}
                  onChange={handleChange}
                />

                <input
                  type="email"
                  name="email"
                  placeholder="Enter your email address"
                  className="h-16 rounded-2xl border border-white/15 bg-white/10 px-5 text-white outline-none placeholder:text-white/60"
                  value={form.email}
                  onChange={handleChange}
                />

                <input
                  type="number"
                  name="age"
                  placeholder="Enter your age"
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
                />

                <select
                  name="country"
                  className="h-16 rounded-2xl border border-white/15 bg-white/10 px-5 text-white outline-none md:col-span-2"
                  value={form.country}
                  onChange={handleChange}
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

                <div className="md:col-span-2">
                  <input
                    type="text"
                    name="postal_code"
                    placeholder={
                      selectedPostalConfig.hint
                        ? `${selectedPostalConfig.label}${selectedPostalConfig.required ? "" : " optional"} e.g. ${selectedPostalConfig.hint}`
                        : `${selectedPostalConfig.label}${selectedPostalConfig.required ? "" : " optional"}`
                    }
                    className="h-16 w-full rounded-2xl border border-white/15 bg-white/10 px-5 text-white outline-none placeholder:text-white/60"
                    value={form.postal_code}
                    onChange={handleChange}
                  />
                  {postalError ? (
                    <p className="mt-2 text-sm font-semibold text-red-100">{postalError}</p>
                  ) : (
                    <p className="mt-2 text-sm text-white/65">
                      {selectedPostalConfig.required
                        ? `${selectedPostalConfig.label} is required${selectedPostalConfig.hint ? ` (${selectedPostalConfig.hint})` : ""}.`
                        : `${selectedPostalConfig.label} is optional${selectedPostalConfig.hint ? ` (${selectedPostalConfig.hint})` : ""}.`}
                    </p>
                  )}
                </div>

                <div className="flex h-16 overflow-hidden rounded-2xl border border-white/15 bg-white/10 md:col-span-2">
                  <select
                    name="phone_code"
                    value={form.phone_code}
                    onChange={handleChange}
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
                    placeholder="Phone / WhatsApp number optional"
                    className="min-w-0 flex-1 bg-transparent px-4 text-white outline-none placeholder:text-white/60"
                    value={form.phone}
                    onChange={handleChange}
                  />
                </div>

                <input
                  type="text"
                  name="occupation"
                  placeholder="Enter your occupation"
                  className="h-16 rounded-2xl border border-white/15 bg-white/10 px-5 text-white outline-none placeholder:text-white/60"
                  value={form.occupation}
                  onChange={handleChange}
                />

                <input
                  type="text"
                  name="height"
                  placeholder="Enter your height e.g. 5'7 or 170cm"
                  className="h-16 rounded-2xl border border-white/15 bg-white/10 px-5 text-white outline-none placeholder:text-white/60"
                  value={form.height}
                  onChange={handleChange}
                />

                <select
                  name="genotype"
                  className="h-16 rounded-2xl border border-white/15 bg-white/10 px-5 text-white outline-none"
                  value={form.genotype}
                  onChange={handleChange}
                >
                  <option value="" className="text-black">
                    Select genotype optional
                  </option>
                  {genotypes.map((genotype) => (
                    <option key={genotype} value={genotype} className="text-black">
                      {genotype}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-8 rounded-[2rem] border border-white/15 bg-white/10 p-6">
              <h2 className="font-display text-4xl font-bold">Faith & Relationship Journey</h2>

              <div className="mt-6 grid gap-6">
                <input
                  type="text"
                  name="religious_background"
                  placeholder="Religious background e.g. Christian, Catholic, Pentecostal, Baptist, non-denominational"
                  className="h-16 rounded-2xl border border-white/15 bg-white/10 px-5 text-white outline-none placeholder:text-white/60"
                  value={form.religious_background}
                  onChange={handleChange}
                />

                <select
                  name="relationship_goal"
                  className="h-16 rounded-2xl border border-white/15 bg-white/10 px-5 text-white outline-none"
                  value={form.relationship_goal}
                  onChange={handleChange}
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
              disabled={loading || uploadingGallery}
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
