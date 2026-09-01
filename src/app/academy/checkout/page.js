// src/app/academy/checkout/page.js

"use client";

import {
  Suspense,
  useEffect,
  useRef,
  useState,
} from "react";
import { useSearchParams } from "next/navigation";
import {
  SiteNav,
  SiteFooter,
} from "@/app/components/SiteChrome";
import { supabase } from "@/lib/supabase";

const PAYPAL_CREATE_ORDER_URL =
  "/api/academy/paypal/create-order";

const PAYPAL_CAPTURE_ORDER_URL =
  "/api/academy/paypal/capture-order";

const MANUAL_PAYMENT_URL =
  "/api/academy/manual-payment";

const PAYPAL_SDK_URL =
  "https://www.paypal.com/web-sdk/v6/core";

const mobileMoney = {
  name: "Victorine Ncham",
  number: "+237 676 25 71 87",
  whatsapp: "https://wa.me/237676257187",
};

const bankDetails = {
  accountName: "DELLY'S MATCHUPS LTD",
  bankName: "Lloyds Bank",
  sortCode: "30-54-66",
  accountNumber: "22464963",
  iban: "GB23LOYD30546622464963",
  bic: "LOYDGB21F95",
};

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

const dialCodes = [
  ...new Set(
    Object.values(countryDialCodes).filter(Boolean),
  ),
].sort(
  (left, right) =>
    right.length - left.length,
);

const courses = {
  "full-academy": {
    title: "Full Academy Programme",
    price: 500,
    description:
      "Access all 7 academy modules.",
  },
  "module-1": {
    title: "Module 1: Counselling 101",
    price: 100,
    description:
      "Enroll in this academy module.",
  },
  "module-2": {
    title: "Module 2: Counselling 102",
    price: 100,
    description:
      "Enroll in this academy module.",
  },
  "module-3": {
    title: "Module 3: Counselling 103",
    price: 100,
    description:
      "Enroll in this academy module.",
  },
  "module-4": {
    title:
      "Module 4: Leadership & Influence",
    price: 100,
    description:
      "Enroll in this academy module.",
  },
  "module-5": {
    title:
      "Module 5: Healing & Restoration",
    price: 100,
    description:
      "Enroll in this academy module.",
  },
  "module-6": {
    title: "Module 6: Master Classes",
    price: 100,
    description:
      "Enroll in this academy module.",
  },
  "module-7": {
    title: "Module 7: Virginity 101",
    price: 100,
    description:
      "Enroll in this academy module.",
  },
};

const moduleOptions =
  Object.entries(courses).filter(
    ([key]) => key !== "full-academy",
  );

const emptyForm = {
  customer_name: "",
  customer_email: "",
  country: "",
  custom_country: "",
  phone_code: "",
  phone: "",
  payment_method: "PayPal / Card",
  provider_reference: "",
  proof_url: "",
  notes: "",
};

function splitPhoneNumber(phone) {
  if (!phone) {
    return {
      phone_code: "",
      phone: "",
    };
  }

  const cleaned =
    String(phone).trim();

  const matchedCode =
    dialCodes.find((code) =>
      cleaned.startsWith(code),
    );

  if (!matchedCode) {
    return {
      phone_code: "",
      phone: cleaned,
    };
  }

  return {
    phone_code: matchedCode,
    phone: cleaned
      .slice(matchedCode.length)
      .trim(),
  };
}

async function parseJsonResponse(response) {
  const text = await response.text();

  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text);
  } catch {
    return {};
  }
}

function getApiError(
  result,
  fallback,
) {
  return (
    result?.error ||
    result?.message ||
    fallback
  );
}

function getPayPalErrorMessage(error) {
  const message =
    error instanceof Error
      ? error.message
      : String(error || "");

  if (
    message.includes(
      "INSUFFICIENT_FUNDS",
    )
  ) {
    return "Payment declined due to insufficient funds.";
  }

  if (
    message.includes(
      "INSTRUMENT_DECLINED",
    )
  ) {
    return "Your payment method was declined. Please try another payment method.";
  }

  if (
    message.includes(
      "TRANSACTION_REFUSED",
    )
  ) {
    return "The transaction was refused. Please try another payment method or contact support.";
  }

  if (
    message.includes(
      "DUPLICATE_INVOICE",
    )
  ) {
    return "This payment has already been processed.";
  }

  return (
    message ||
    "PayPal payment failed. Please try again."
  );
}

function AcademyCheckoutContent() {
  const searchParams =
    useSearchParams();

  const paypalRef =
    useRef(null);

  const paypalClientId =
    process.env
      .NEXT_PUBLIC_PAYPAL_CLIENT_ID;

  const initialCourse =
    searchParams.get("course") ||
    "full-academy";

  const [
    selectedCourseKey,
    setSelectedCourseKey,
  ] = useState(
    courses[initialCourse]
      ? initialCourse
      : "full-academy",
  );

  const [form, setForm] =
    useState(emptyForm);

  const [saving, setSaving] =
    useState(false);

  const [uploading, setUploading] =
    useState(false);

  const [paypalError, setPayPalError] =
    useState("");

  const selectedCourse =
    courses[selectedCourseKey];

  useEffect(() => {
    let mounted = true;

    async function loadUserProfile() {
      try {
        const {
          data: { user },
          error: userError,
        } =
          await supabase.auth.getUser();

        if (userError) {
          throw userError;
        }

        if (!user) {
          return;
        }

        const {
          data: profile,
          error: profileError,
        } = await supabase
          .from("profiles")
          .select(
            "full_name,email,phone,country",
          )
          .eq("id", user.id)
          .maybeSingle();

        if (profileError) {
          console.error(
            "ACADEMY PROFILE LOAD ERROR:",
            profileError,
          );
          return;
        }

        if (!mounted) {
          return;
        }

        const phoneParts =
          splitPhoneNumber(
            profile?.phone || "",
          );

        const profileCountry =
          countries.includes(
            profile?.country,
          )
            ? profile.country
            : profile?.country
              ? "Other"
              : "";

        setForm((current) => ({
          ...current,
          customer_name:
            current.customer_name ||
            profile?.full_name ||
            "",
          customer_email:
            current.customer_email ||
            profile?.email ||
            user.email ||
            "",
          country:
            current.country ||
            profileCountry,
          custom_country:
            current.custom_country ||
            (
              profileCountry === "Other"
                ? profile?.country || ""
                : ""
            ),
          phone_code:
            current.phone_code ||
            phoneParts.phone_code ||
            (
              profileCountry &&
              profileCountry !== "Other"
                ? countryDialCodes[
                    profileCountry
                  ] || ""
                : ""
            ),
          phone:
            current.phone ||
            phoneParts.phone ||
            "",
        }));
      } catch (error) {
        console.error(
          "ACADEMY PROFILE LOAD ERROR:",
          error,
        );
      }
    }

    void loadUserProfile();

    return () => {
      mounted = false;
    };
  }, []);

  function handleChange(event) {
    const {
      name,
      value,
    } = event.target;

    if (name === "country") {
      setForm((current) => ({
        ...current,
        country: value,
        custom_country:
          value === "Other"
            ? current.custom_country
            : "",
        phone_code:
          value === "Other"
            ? ""
            : countryDialCodes[
                value
              ] || "",
      }));

      return;
    }

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function getCountryName() {
    if (
      form.country === "Other"
    ) {
      return form.custom_country.trim();
    }

    return form.country;
  }

  function getFullPhone() {
    const phoneCode =
      String(
        form.phone_code || "",
      ).trim();

    const phone =
      String(form.phone || "")
        .replace(/\D/g, "")
        .replace(/^0+/, "");

    return `${phoneCode}${phone}`;
  }

  function validateForm() {
    if (
      !form.customer_name.trim()
    ) {
      alert(
        "Please enter your full name.",
      );
      return false;
    }

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        form.customer_email
          .trim()
          .toLowerCase(),
      )
    ) {
      alert(
        "Please enter a valid email address.",
      );
      return false;
    }

    if (!form.country) {
      alert(
        "Please select your country.",
      );
      return false;
    }

    if (
      form.country === "Other" &&
      !form.custom_country.trim()
    ) {
      alert(
        "Please enter your country name.",
      );
      return false;
    }

    if (
      !form.phone_code ||
      !form.phone.trim()
    ) {
      alert(
        "Please enter your phone number.",
      );
      return false;
    }

    const fullPhone =
      getFullPhone();

    if (
      fullPhone.replace(
        /\D/g,
        "",
      ).length < 7
    ) {
      alert(
        "Please enter a valid phone or WhatsApp number.",
      );
      return false;
    }

    return true;
  }

  function validateManualPayment() {
    if (!validateForm()) {
      return false;
    }

    if (
      !form.provider_reference.trim()
    ) {
      alert(
        "Please enter the transaction ID or payment reference you received after making the payment.",
      );
      return false;
    }

    return true;
  }

  async function createPayPalOrder() {
    if (!validateForm()) {
      throw new Error(
        "Please complete your details before continuing to PayPal.",
      );
    }

    setPayPalError("");

    const response = await fetch(
      PAYPAL_CREATE_ORDER_URL,
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify({
          courseKey:
            selectedCourseKey,
          customerName:
            form.customer_name.trim(),
          customerEmail:
            form.customer_email
              .trim()
              .toLowerCase(),
          country:
            getCountryName(),
          phone:
            getFullPhone(),
        }),
      },
    );

    const result =
      await parseJsonResponse(
        response,
      );

    if (
      !response.ok ||
      !result.success ||
      !result.orderId
    ) {
      throw new Error(
        getApiError(
          result,
          "Unable to create PayPal Academy order.",
        ),
      );
    }

    return {
      orderId:
        result.orderId,
    };
  }

  async function capturePayPalOrder(
    orderId,
  ) {
    const response = await fetch(
      PAYPAL_CAPTURE_ORDER_URL,
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify({
          orderId,
        }),
      },
    );

    const result =
      await parseJsonResponse(
        response,
      );

    if (
      !response.ok ||
      !result.success ||
      result.status !== "paid"
    ) {
      throw new Error(
        getApiError(
          result,
          "Your PayPal payment could not be confirmed. Please check your PayPal activity before attempting another payment.",
        ),
      );
    }

    return result;
  }

  useEffect(() => {
    if (
      form.payment_method !==
        "PayPal / Card" ||
      !paypalClientId ||
      !paypalRef.current
    ) {
      return undefined;
    }

    let cancelled = false;
    let paypalButton = null;

    async function setupPayPal() {
      if (
        cancelled ||
        !window.paypal ||
        !paypalRef.current
      ) {
        return;
      }

      try {
        setPayPalError("");

        paypalRef.current.innerHTML =
          "";

        const sdkInstance =
          await window.paypal.createInstance({
            clientId:
              paypalClientId,
            components: [
              "paypal-payments",
            ],
          });

        if (cancelled) {
          return;
        }

        const eligibility =
          await sdkInstance.findEligibleMethods();

        if (
          !eligibility.isEligible(
            "paypal",
          )
        ) {
          setPayPalError(
            "PayPal is not currently available for this checkout.",
          );
          return;
        }

        paypalButton =
          document.createElement(
            "paypal-button",
          );

        paypalRef.current.append(
          paypalButton,
        );

        const paypalCheckoutSession =
          await sdkInstance.createPayPalOneTimePaymentSession(
            {
              async onApprove(data) {
                try {
                  setSaving(true);
                  setPayPalError("");

                  const result =
                    await capturePayPalOrder(
                      data.orderId,
                    );

                  alert(
                    "Payment successful. Your Academy access has been activated.",
                  );

                  window.location.href =
                    `/academy/payment-success?course=${
                      result.courseKey ||
                      selectedCourseKey
                    }`;
                } catch (error) {
                  const message =
                    getPayPalErrorMessage(
                      error,
                    );

                  console.error(
                    "ACADEMY PAYPAL CAPTURE ERROR:",
                    error,
                  );

                  setPayPalError(
                    message,
                  );

                  alert(message);
                } finally {
                  setSaving(false);
                }
              },

              onCancel() {
                setSaving(false);

                setPayPalError(
                  "Payment cancelled. No Academy access has been activated.",
                );
              },

              onError(error) {
                setSaving(false);

                const message =
                  getPayPalErrorMessage(
                    error,
                  );

                console.error(
                  "ACADEMY PAYPAL ERROR:",
                  error,
                );

                setPayPalError(
                  message,
                );
              },
            },
          );

        if (cancelled) {
          return;
        }

        paypalButton.addEventListener(
          "click",
          async () => {
            try {
              setSaving(true);
              setPayPalError("");

              // PayPal v6 requires preserving the user activation.
              const createOrderPromise =
                createPayPalOrder();

              await paypalCheckoutSession.start(
                {
                  presentationMode:
                    "auto",
                },
                createOrderPromise,
              );
            } catch (error) {
              const message =
                getPayPalErrorMessage(
                  error,
                );

              console.error(
                "ACADEMY PAYPAL START ERROR:",
                error,
              );

              setPayPalError(
                message,
              );
            } finally {
              setSaving(false);
            }
          },
        );
      } catch (error) {
        const message =
          getPayPalErrorMessage(
            error,
          );

        console.error(
          "ACADEMY PAYPAL SETUP ERROR:",
          error,
        );

        setPayPalError(
          message,
        );
      }
    }

    const existingScript =
      document.querySelector(
        "#academy-paypal-sdk-v6",
      );

    if (existingScript) {
      if (window.paypal) {
        void setupPayPal();
      } else {
        existingScript.addEventListener(
          "load",
          setupPayPal,
          {
            once: true,
          },
        );
      }

      return () => {
        cancelled = true;

        existingScript.removeEventListener(
          "load",
          setupPayPal,
        );

        if (
          paypalRef.current
        ) {
          paypalRef.current.innerHTML =
            "";
        }
      };
    }

    const script =
      document.createElement(
        "script",
      );

    script.id =
      "academy-paypal-sdk-v6";

    script.src =
      PAYPAL_SDK_URL;

    script.async = true;

    script.onload = () => {
      void setupPayPal();
    };

    script.onerror = () => {
      setPayPalError(
        "Unable to load PayPal Checkout. Please refresh the page and try again.",
      );
    };

    document.body.appendChild(
      script,
    );

    return () => {
      cancelled = true;

      if (
        paypalRef.current
      ) {
        paypalRef.current.innerHTML =
          "";
      }
    };
  }, [
    paypalClientId,
    form.payment_method,
    selectedCourseKey,
    form.customer_name,
    form.customer_email,
    form.country,
    form.custom_country,
    form.phone_code,
    form.phone,
  ]);

  async function handleProofUpload(
    event,
  ) {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    if (
      file.size >
      10 * 1024 * 1024
    ) {
      alert(
        "Payment proof must be 10 MB or smaller.",
      );
      return;
    }

    const validMimeTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
      "image/heic",
      "image/heif",
    ];

    if (
      file.type &&
      !validMimeTypes.includes(
        file.type,
      )
    ) {
      alert(
        "Please upload an image or PDF payment proof.",
      );
      return;
    }

    try {
      setUploading(true);

      const fileExt =
        file.name
          .split(".")
          .pop()
          ?.replace(
            /[^a-zA-Z0-9]/g,
            "",
          ) || "jpg";

      const randomPart =
        globalThis.crypto
          ?.randomUUID?.() ||
        `${Date.now()}-${Math.random()
          .toString(36)
          .slice(2)}`;

      const fileName =
        `payment-proofs/academy/` +
        `${randomPart}.${fileExt}`;

      const { error } =
        await supabase.storage
          .from("content-images")
          .upload(
            fileName,
            file,
            {
              upsert: false,
              contentType:
                file.type ||
                "application/octet-stream",
            },
          );

      if (error) {
        throw error;
      }

      const { data } =
        supabase.storage
          .from("content-images")
          .getPublicUrl(
            fileName,
          );

      if (!data.publicUrl) {
        throw new Error(
          "Payment proof URL was not returned.",
        );
      }

      setForm((current) => ({
        ...current,
        proof_url:
          data.publicUrl,
      }));
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Unable to upload payment proof.",
      );
    } finally {
      setUploading(false);
    }
  }

  async function handleManualSubmit() {
    if (
      saving ||
      uploading ||
      !validateManualPayment()
    ) {
      return;
    }

    if (
      form.payment_method !==
        "Mobile Money" &&
      form.payment_method !==
        "Bank Transfer"
    ) {
      return;
    }

    const confirmed =
      window.confirm(
        "Only submit if you have already made the payment. Academy access remains pending until Delly's Matchups verifies the transaction.",
      );

    if (!confirmed) {
      return;
    }

    try {
      setSaving(true);

      const response =
        await fetch(
          MANUAL_PAYMENT_URL,
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              courseKey:
                selectedCourseKey,
              customerName:
                form.customer_name.trim(),
              customerEmail:
                form.customer_email
                  .trim()
                  .toLowerCase(),
              country:
                getCountryName(),
              phone:
                getFullPhone(),
              paymentMethod:
                form.payment_method,
              providerReference:
                form.provider_reference.trim(),
              proofUrl:
                form.proof_url ||
                null,
              notes:
                form.notes.trim(),
            }),
          },
        );

      const result =
        await parseJsonResponse(
          response,
        );

      if (
        !response.ok ||
        !result.success
      ) {
        throw new Error(
          getApiError(
            result,
            "Unable to submit your payment for verification.",
          ),
        );
      }

      if (
        result.alreadySubmitted
      ) {
        alert(
          "This payment was already submitted. We have kept the existing payment record.",
        );
      } else {
        alert(
          "Your payment has been submitted and is pending verification.",
        );
      }

      window.location.href =
        `/academy/payment-pending?course=${
          result.courseKey ||
          selectedCourseKey
        }`;
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Unable to submit your payment for verification.",
      );
    } finally {
      setSaving(false);
    }
  }

  function selectPaymentMethod(
    method,
  ) {
    setPayPalError("");

    setForm((current) => ({
      ...current,
      payment_method: method,
      provider_reference: "",
      proof_url: "",
      notes: "",
    }));
  }

  return (
    <>
      <SiteNav />

      <main
        className="relative min-h-screen bg-[#b30018] bg-cover bg-center bg-no-repeat px-6 pb-24 pt-44 text-white"
        style={{
          backgroundImage:
            "url('/delly-usa.jpg')",
        }}
      >
        <div className="absolute inset-0 bg-[#5a000a]/75" />
        <div className="absolute inset-0 bg-gradient-to-br from-[#b30018]/90 via-[#b30018]/65 to-black/75" />

        <section className="relative z-10 mx-auto max-w-6xl">
          <div className="mx-auto max-w-5xl rounded-[3rem] border border-yellow-300/30 bg-black/35 p-8 shadow-2xl backdrop-blur-xl md:p-12">
            <p className="font-black uppercase tracking-[0.35em] text-yellow-300">
              Delly&apos;s Matchups Academy
            </p>

            <h1 className="font-display mt-5 text-6xl font-bold leading-none md:text-7xl">
              Academy Enrollment
            </h1>

            <p className="mt-6 max-w-3xl text-lg leading-8 text-white/85">
              Choose between enrolling in the
              complete Academy Programme or
              purchasing an individual module.
            </p>

            <div className="mt-10 rounded-[2rem] border border-yellow-300/40 bg-white p-7 text-[#b30018] shadow-2xl">
              <h2 className="font-display text-4xl font-bold">
                {selectedCourse.title}
              </h2>

              <p className="mt-3 text-black/70">
                {selectedCourse.description}
              </p>

              <p className="mt-5 text-5xl font-black">
                ${selectedCourse.price}

                <span className="ml-2 text-lg uppercase tracking-[0.2em]">
                  USD
                </span>
              </p>
            </div>

            <div className="mt-10">
              <h3 className="font-display text-4xl font-bold">
                Choose Enrollment
              </h3>

              <button
                type="button"
                onClick={() =>
                  setSelectedCourseKey(
                    "full-academy",
                  )
                }
                className={`mt-6 w-full rounded-2xl border p-5 text-left font-black transition hover:scale-[1.01] ${
                  selectedCourseKey ===
                  "full-academy"
                    ? "border-yellow-300 bg-gradient-to-r from-yellow-200 via-yellow-400 to-yellow-600 text-black shadow-xl"
                    : "border-white/15 bg-white/10 text-white hover:bg-white/20"
                }`}
              >
                Full Academy Programme — $500 USD
              </button>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                {moduleOptions.map(
                  ([key, course]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() =>
                        setSelectedCourseKey(
                          key,
                        )
                      }
                      className={`rounded-2xl border p-5 text-left font-black transition hover:scale-[1.01] ${
                        selectedCourseKey ===
                        key
                          ? "border-yellow-300 bg-gradient-to-r from-yellow-200 via-yellow-400 to-yellow-600 text-black shadow-xl"
                          : "border-white/15 bg-white/10 text-white hover:bg-white/20"
                      }`}
                    >
                      {course.title} — ${course.price} USD
                    </button>
                  ),
                )}
              </div>
            </div>

            <div className="mt-10 grid gap-5 md:grid-cols-2">
              <input
                type="text"
                name="customer_name"
                value={form.customer_name}
                onChange={handleChange}
                placeholder="Enter your full name"
                className="h-16 rounded-2xl bg-white/10 px-5 text-white outline-none placeholder:text-white/60"
                required
              />

              <input
                type="email"
                name="customer_email"
                value={form.customer_email}
                onChange={handleChange}
                placeholder="Enter your email address"
                className="h-16 rounded-2xl bg-white/10 px-5 text-white outline-none placeholder:text-white/60"
                required
              />

              <select
                name="country"
                value={form.country}
                onChange={handleChange}
                className="h-16 rounded-2xl bg-white/10 px-5 text-white outline-none md:col-span-2"
                required
              >
                <option
                  value=""
                  className="text-black"
                >
                  Select your country
                </option>

                {countries.map(
                  (country) => (
                    <option
                      key={country}
                      value={country}
                      className="text-black"
                    >
                      {country}
                    </option>
                  ),
                )}
              </select>

              {form.country ===
              "Other" ? (
                <input
                  type="text"
                  name="custom_country"
                  value={form.custom_country}
                  onChange={handleChange}
                  placeholder="Enter your country"
                  className="h-16 rounded-2xl bg-white/10 px-5 text-white outline-none placeholder:text-white/60 md:col-span-2"
                  required
                />
              ) : null}

              <div className="flex h-16 overflow-hidden rounded-2xl bg-white/10 md:col-span-2">
                {form.country ===
                "Other" ? (
                  <input
                    name="phone_code"
                    value={form.phone_code}
                    onChange={handleChange}
                    placeholder="+Code"
                    className="w-28 bg-white/10 px-3 text-white outline-none placeholder:text-white/60"
                    required
                  />
                ) : (
                  <select
                    name="phone_code"
                    value={form.phone_code}
                    onChange={handleChange}
                    className="w-28 bg-white/10 px-3 text-white outline-none"
                    required
                  >
                    <option
                      value=""
                      className="text-black"
                    >
                      Code
                    </option>

                    {dialCodes.map(
                      (code) => (
                        <option
                          key={code}
                          value={code}
                          className="text-black"
                        >
                          {code}
                        </option>
                      ),
                    )}
                  </select>
                )}

                <input
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="Phone / WhatsApp number"
                  className="min-w-0 flex-1 bg-transparent px-4 text-white outline-none placeholder:text-white/60"
                  required
                />
              </div>
            </div>

            <div className="mt-10">
              <h3 className="font-display text-4xl font-bold">
                Payment Method
              </h3>

              <div className="mt-6 grid gap-5 md:grid-cols-3">
                {[
                  "PayPal / Card",
                  "Mobile Money",
                  "Bank Transfer",
                ].map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() =>
                      selectPaymentMethod(
                        method,
                      )
                    }
                    className={`rounded-2xl p-6 font-black transition hover:scale-105 ${
                      form.payment_method ===
                      method
                        ? "bg-gradient-to-r from-yellow-200 via-yellow-400 to-yellow-600 text-black"
                        : "bg-white text-[#b30018]"
                    }`}
                  >
                    {method}
                  </button>
                ))}
              </div>
            </div>

            {form.payment_method ===
              "PayPal / Card" && (
              <div className="mt-8 rounded-[2rem] bg-white p-6 text-[#b30018]">
                <h3 className="font-display text-3xl font-bold">
                  PayPal / Card
                </h3>

                <p className="mt-3 leading-7 text-black/70">
                  Complete your payment securely
                  with PayPal. Academy access is
                  activated only after the server
                  verifies the completed payment.
                </p>

                {!paypalClientId ? (
                  <p className="mt-5 font-bold">
                    Missing PayPal Client ID.
                    Add NEXT_PUBLIC_PAYPAL_CLIENT_ID
                    to the production environment.
                  </p>
                ) : (
                  <div
                    ref={paypalRef}
                    className="mt-6"
                  />
                )}

                {saving && (
                  <p className="mt-4 text-center font-bold text-black/60">
                    Processing payment...
                  </p>
                )}

                {paypalError ? (
                  <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 font-bold text-red-700">
                    {paypalError}
                  </p>
                ) : null}
              </div>
            )}

            {form.payment_method ===
              "Mobile Money" && (
              <ManualPaymentBox
                type="momo"
                form={form}
                selectedCourse={selectedCourse}
                mobileMoney={mobileMoney}
                bankDetails={bankDetails}
                saving={saving}
                uploading={uploading}
                handleChange={handleChange}
                handleProofUpload={
                  handleProofUpload
                }
                handleManualSubmit={
                  handleManualSubmit
                }
              />
            )}

            {form.payment_method ===
              "Bank Transfer" && (
              <ManualPaymentBox
                type="bank"
                form={form}
                selectedCourse={selectedCourse}
                mobileMoney={mobileMoney}
                bankDetails={bankDetails}
                saving={saving}
                uploading={uploading}
                handleChange={handleChange}
                handleProofUpload={
                  handleProofUpload
                }
                handleManualSubmit={
                  handleManualSubmit
                }
              />
            )}
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}

function DetailRow({
  label,
  value,
}) {
  return (
    <div className="border-b border-white/10 py-3 last:border-b-0">
      <p className="text-sm text-white/60">
        {label}
      </p>

      <p className="mt-1 break-words text-lg font-black text-white">
        {value}
      </p>
    </div>
  );
}

function ManualPaymentBox({
  type,
  form,
  selectedCourse,
  mobileMoney,
  bankDetails,
  saving,
  uploading,
  handleChange,
  handleProofUpload,
  handleManualSubmit,
}) {
  const isMomo =
    type === "momo";

  const whatsappMessage =
    encodeURIComponent(
      [
        "Hello Delly's Matchups,",
        "",
        "I need help with my Academy payment.",
        `Course: ${selectedCourse.title}`,
        `Amount: $${selectedCourse.price} USD`,
        `Payment Method: ${
          isMomo
            ? "Mobile Money"
            : "Bank Transfer"
        }`,
        form.provider_reference.trim()
          ? `Reference: ${form.provider_reference.trim()}`
          : "",
      ]
        .filter(Boolean)
        .join("\n"),
    );

  const whatsappUrl =
    `${mobileMoney.whatsapp}` +
    `?text=${whatsappMessage}`;

  return (
    <div className="mt-10 rounded-[2rem] border border-white/15 bg-white/10 p-6">
      <p className="text-sm font-black uppercase tracking-[0.3em] text-red-100">
        {isMomo
          ? "MTN Mobile Money"
          : "Bank Transfer"}
      </p>

      <h3 className="font-display mt-3 text-4xl font-bold">
        {isMomo
          ? "Mobile Money"
          : "Lloyds Bank"}
      </h3>

      <p className="mt-4 text-lg leading-8 text-white/80">
        Send the exact amount using the details
        below. Once the payment is complete,
        enter the transaction reference and
        submit it for verification.
      </p>

      <div className="mt-5 rounded-2xl bg-black/20 p-5">
        {isMomo ? (
          <>
            <DetailRow
              label="Account Name"
              value={mobileMoney.name}
            />

            <DetailRow
              label="Mobile Money Number"
              value={mobileMoney.number}
            />
          </>
        ) : (
          <>
            <DetailRow
              label="Account Name"
              value={bankDetails.accountName}
            />

            <DetailRow
              label="Bank"
              value={bankDetails.bankName}
            />

            <DetailRow
              label="Sort Code"
              value={bankDetails.sortCode}
            />

            <DetailRow
              label="Account Number"
              value={bankDetails.accountNumber}
            />

            <DetailRow
              label="IBAN"
              value={bankDetails.iban}
            />

            <DetailRow
              label="BIC"
              value={bankDetails.bic}
            />
          </>
        )}

        <DetailRow
          label="Amount"
          value={`$${selectedCourse.price} USD`}
        />
      </div>

      <label className="mt-6 block text-sm font-black uppercase tracking-[0.15em] text-yellow-200">
        Transaction ID / Reference
      </label>

      <input
        type="text"
        name="provider_reference"
        value={form.provider_reference}
        onChange={handleChange}
        placeholder="Enter your payment reference"
        className="mt-2 h-16 w-full rounded-2xl bg-white/10 px-5 text-white outline-none placeholder:text-white/60"
        required
      />

      <p className="mt-2 text-sm leading-6 text-white/60">
        Required. Use the transaction
        ID/reference supplied by your bank or
        Mobile Money provider.
      </p>

      <label className="mt-6 block text-sm font-black uppercase tracking-[0.15em] text-yellow-200">
        Note (Optional)
      </label>

      <textarea
        name="notes"
        value={form.notes}
        onChange={handleChange}
        rows={4}
        placeholder="Anything we should know?"
        className="mt-2 w-full rounded-2xl bg-white/10 px-5 py-4 text-white outline-none placeholder:text-white/60"
      />

      <label className="mt-6 block text-sm font-black uppercase tracking-[0.15em] text-yellow-200">
        Payment Proof (Optional)
      </label>

      <input
        type="file"
        accept="image/*,.pdf"
        onChange={handleProofUpload}
        className="mt-2 w-full rounded-2xl bg-white/10 px-5 py-4 text-white"
      />

      <p className="mt-2 text-sm leading-6 text-white/60">
        Optional but recommended. Upload a
        receipt image or PDF up to 10 MB.
      </p>

      {uploading && (
        <p className="mt-3 text-sm text-white/70">
          Uploading proof...
        </p>
      )}

      {form.proof_url && (
        <p className="mt-3 font-bold text-yellow-200">
          ✓ Payment proof uploaded
        </p>
      )}

      <div className="mt-6 flex flex-col gap-4 sm:flex-row">
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full bg-white px-8 py-4 text-center font-black text-[#b30018] transition hover:scale-105"
        >
          Contact Us on WhatsApp
        </a>

        <button
          type="button"
          onClick={handleManualSubmit}
          disabled={
            saving || uploading
          }
          className="rounded-full border border-white/20 bg-[#b30018] px-8 py-4 font-black text-white transition hover:bg-[#8f0013] disabled:opacity-60"
        >
          {saving
            ? "Submitting..."
            : "Submit Payment for Verification"}
        </button>
      </div>

      <p className="mt-5 text-center text-sm leading-6 text-white/65">
        Only submit after making the payment.
        Manual payments remain pending until
        Delly&apos;s Matchups verifies the
        transaction. Academy access is not
        activated automatically.
      </p>
    </div>
  );
}

export default function AcademyCheckoutPage() {
  return (
    <Suspense
      fallback={
        <main className="p-10">
          Loading...
        </main>
      }
    >
      <AcademyCheckoutContent />
    </Suspense>
  );
}