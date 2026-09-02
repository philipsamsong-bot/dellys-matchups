// src/app/support/partner/page.js

"use client";

import { useEffect, useRef, useState } from "react";
import { SiteNav, SiteFooter } from "@/app/components/SiteChrome";
import { supabase } from "@/lib/supabase";

const PAYPAL_CREATE_ORDER_URL =
  "/api/partner/paypal/create-order";

const PAYPAL_CAPTURE_ORDER_URL =
  "/api/partner/paypal/capture-order";

const MANUAL_PAYMENT_URL =
  "/api/partner/manual-payment";

const PAYPAL_SDK_URL =
  "https://www.paypal.com/web-sdk/v6/core";

const PAYMENT_PROOF_BUCKET =
  "content-images";

const MAX_PROOF_SIZE_BYTES =
  10 * 1024 * 1024;

const ALLOWED_PROOF_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
]);

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

const partnershipTypes = [
  "Monthly Support",
  "Project Partnership",
  "Corporate Partnership",
];

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
];

const emptyForm = {
  customer_name: "",
  customer_email: "",
  country: "",
  postal_code: "",
  phone_code: "",
  phone: "",
  organization: "",
  partnership_type: "Monthly Support",
  amount: "",
  payment_method: "PayPal / Card",
  transaction_reference: "",
  notes: "",
};

function splitPhoneNumber(phone) {
  if (!phone) {
    return {
      phone_code: "",
      phone: "",
    };
  }

  const matchedCode = [...dialCodes]
    .sort(
      (left, right) =>
        right.length - left.length,
    )
    .find((code) =>
      phone.startsWith(code),
    );

  if (!matchedCode) {
    return {
      phone_code: "",
      phone,
    };
  }

  return {
    phone_code: matchedCode,
    phone: phone
      .slice(matchedCode.length)
      .trim(),
  };
}

function sanitizeFileName(fileName) {
  return fileName
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

async function parseJsonResponse(response) {
  const text =
    await response.text();

  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text);
  } catch {
    return {};
  }
}

function getApiError(result, fallback) {
  return (
    result?.error ||
    result?.message ||
    fallback
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

      <p className="mt-1 break-words text-lg font-black">
        {value}
      </p>
    </div>
  );
}

export default function PartnerPage() {
  const paypalRef =
    useRef(null);

  const paypalGenerationRef =
    useRef(0);

  const formRef =
    useRef(emptyForm);

  const proofInputRef =
    useRef(null);

  const paypalClientId =
    process.env
      .NEXT_PUBLIC_PAYPAL_CLIENT_ID;

  const [form, setForm] =
    useState(emptyForm);

  const [proofFile, setProofFile] =
    useState(null);

  const [
    paypalBusy,
    setPayPalBusy,
  ] = useState(false);

  const [
    manualBusy,
    setManualBusy,
  ] = useState(false);

  const [
    uploading,
    setUploading,
  ] = useState(false);

  const [
    paypalError,
    setPayPalError,
  ] = useState("");

  const [
    manualError,
    setManualError,
  ] = useState("");

  const [
    manualResult,
    setManualResult,
  ] = useState(null);

  formRef.current = form;

  useEffect(() => {
    async function loadUserProfile() {
      const {
        data: { user },
      } =
        await supabase.auth.getUser();

      if (!user) {
        return;
      }

      const {
        data: profile,
      } = await supabase
        .from("profiles")
        .select(
          "full_name,email,phone,country,postal_code",
        )
        .eq("id", user.id)
        .maybeSingle();

      if (!profile) {
        return;
      }

      const phoneParts =
        splitPhoneNumber(
          profile.phone || "",
        );

      setForm((current) => ({
        ...current,
        customer_name:
          current.customer_name ||
          profile.full_name ||
          "",
        customer_email:
          current.customer_email ||
          profile.email ||
          user.email ||
          "",
        country:
          current.country ||
          profile.country ||
          "",
        postal_code:
          current.postal_code ||
          profile.postal_code ||
          "",
        phone_code:
          current.phone_code ||
          phoneParts.phone_code ||
          countryDialCodes[
            profile.country
          ] ||
          "",
        phone:
          current.phone ||
          phoneParts.phone ||
          "",
      }));
    }

    void loadUserProfile();
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
        phone_code:
          countryDialCodes[value] ||
          current.phone_code,
      }));

      return;
    }

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function getFullPhone(
    currentForm = formRef.current,
  ) {
    return `${currentForm.phone_code}${currentForm.phone
      .replace(/^0+/, "")
      .trim()}`;
  }

  function validateForm(
    currentForm = formRef.current,
  ) {
    if (
      !currentForm.customer_name.trim() ||
      !currentForm.customer_email.trim()
    ) {
      alert(
        "Please enter your name and email.",
      );

      return false;
    }

    const supportAmount =
      Number(
        currentForm.amount,
      );

    if (
      !Number.isFinite(
        supportAmount,
      ) ||
      supportAmount < 1 ||
      supportAmount > 100000
    ) {
      alert(
        "Please enter a support amount between $1 and $100,000.",
      );

      return false;
    }

    if (
      !partnershipTypes.includes(
        currentForm.partnership_type,
      )
    ) {
      alert(
        "Please select a valid partnership type.",
      );

      return false;
    }

    if (!currentForm.country) {
      alert(
        "Please select your country.",
      );

      return false;
    }

    if (
      !currentForm.postal_code.trim()
    ) {
      alert(
        "Please enter your postal / ZIP code.",
      );

      return false;
    }

    if (
      !currentForm.phone_code ||
      !currentForm.phone.trim()
    ) {
      alert(
        "Please enter your phone number.",
      );

      return false;
    }

    if (
      currentForm.organization
        .trim().length > 200
    ) {
      alert(
        "Organization name must not exceed 200 characters.",
      );

      return false;
    }

    if (
      currentForm.notes
        .trim().length > 1000
    ) {
      alert(
        "Partnership note must not exceed 1000 characters.",
      );

      return false;
    }

    return true;
  }

  function resetPartnerForm() {
    setProofFile(null);
    setManualError("");
    setPayPalError("");

    if (
      proofInputRef.current
    ) {
      proofInputRef.current.value =
        "";
    }

    setForm(emptyForm);
  }

  function handleProofUpload(
    event,
  ) {
    const file =
      event.target.files?.[0] ||
      null;

    setManualError("");

    if (!file) {
      setProofFile(null);
      return;
    }

    if (
      !ALLOWED_PROOF_TYPES.has(
        file.type,
      )
    ) {
      event.target.value = "";
      setProofFile(null);

      setManualError(
        "Payment proof must be a JPG, PNG, WEBP, or PDF file.",
      );

      return;
    }

    if (
      file.size >
      MAX_PROOF_SIZE_BYTES
    ) {
      event.target.value = "";
      setProofFile(null);

      setManualError(
        "Payment proof must not exceed 10 MB.",
      );

      return;
    }

    setProofFile(file);
  }

  async function uploadPaymentProof() {
    if (!proofFile) {
      return "";
    }

    if (
      !ALLOWED_PROOF_TYPES.has(
        proofFile.type,
      )
    ) {
      throw new Error(
        "Unsupported payment proof file type.",
      );
    }

    if (
      proofFile.size >
      MAX_PROOF_SIZE_BYTES
    ) {
      throw new Error(
        "Payment proof must not exceed 10 MB.",
      );
    }

    const safeName =
      sanitizeFileName(
        proofFile.name,
      ) ||
      "partner-payment-proof";

    const filePath = [
      "payment-proofs",
      "partner",
      `${Date.now()}-${crypto.randomUUID()}-${safeName}`,
    ].join("/");

    setUploading(true);

    try {
      const {
        error: uploadError,
      } = await supabase.storage
        .from(
          PAYMENT_PROOF_BUCKET,
        )
        .upload(
          filePath,
          proofFile,
          {
            cacheControl:
              "3600",
            upsert: false,
            contentType:
              proofFile.type,
          },
        );

      if (uploadError) {
        throw new Error(
          `Unable to upload payment proof: ${uploadError.message}`,
        );
      }

      const {
        data: publicUrlData,
      } = supabase.storage
        .from(
          PAYMENT_PROOF_BUCKET,
        )
        .getPublicUrl(
          filePath,
        );

      const proofUrl =
        publicUrlData?.publicUrl ||
        "";

      if (
        !proofUrl.startsWith(
          "https://",
        )
      ) {
        throw new Error(
          "Payment proof URL could not be generated.",
        );
      }

      return proofUrl;
    } finally {
      setUploading(false);
    }
  }

  async function createPayPalOrder() {
    const current =
      formRef.current;

    if (
      !validateForm(
        current,
      )
    ) {
      throw new Error(
        "Partnership information is incomplete.",
      );
    }

    const response =
      await fetch(
        PAYPAL_CREATE_ORDER_URL,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            customerName:
              current.customer_name.trim(),
            customerEmail:
              current.customer_email
                .trim()
                .toLowerCase(),
            country:
              current.country,
            postalCode:
              current.postal_code.trim(),
            customerPhone:
              getFullPhone(
                current,
              ),
            organization:
              current.organization.trim(),
            partnershipType:
              current.partnership_type,
            amount:
              Number(
                current.amount,
              ),
            notes:
              current.notes.trim(),
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
          "Unable to create your PayPal partnership payment.",
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
    const response =
      await fetch(
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
      result.status !==
        "paid"
    ) {
      throw new Error(
        getApiError(
          result,
          "Your partnership payment could not be confirmed. Please check your PayPal activity before attempting another payment.",
        ),
      );
    }

    return result;
  }

  async function handleManualSubmit() {
    const current =
      formRef.current;

    setManualError("");
    setManualResult(null);

    if (
      !validateForm(
        current,
      )
    ) {
      return;
    }

    if (
      current.payment_method !==
        "Mobile Money" &&
      current.payment_method !==
        "Bank Transfer"
    ) {
      setManualError(
        "Please select Mobile Money or Bank Transfer.",
      );

      return;
    }

    const transactionReference =
      current.transaction_reference.trim();

    if (
      !transactionReference
    ) {
      setManualError(
        "Transaction / payment reference is required.",
      );

      return;
    }

    if (
      transactionReference.length >
      200
    ) {
      setManualError(
        "Transaction reference is too long.",
      );

      return;
    }

    try {
      setManualBusy(true);

      const proofUrl =
        await uploadPaymentProof();

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
              customerName:
                current.customer_name.trim(),
              customerEmail:
                current.customer_email
                  .trim()
                  .toLowerCase(),
              country:
                current.country,
              postalCode:
                current.postal_code.trim(),
              customerPhone:
                getFullPhone(
                  current,
                ),
              organization:
                current.organization.trim(),
              partnershipType:
                current.partnership_type,
              amount:
                Number(
                  current.amount,
                ),
              paymentMethod:
                current.payment_method,
              transactionReference,
              proofUrl,
              notes:
                current.notes.trim(),
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
            "Unable to submit your partnership payment.",
          ),
        );
      }

      if (
        result.status !==
        "pending_confirmation"
      ) {
        throw new Error(
          "The partnership payment returned an unexpected status.",
        );
      }

      setManualResult({
        paymentId:
          result.paymentId ||
          "",
        partnershipType:
          result.partnershipType ||
          current.partnership_type,
        amount:
          result.amount,
        currency:
          result.currency ||
          "USD",
        paymentMethod:
          result.paymentMethod ||
          current.payment_method,
        alreadySubmitted:
          Boolean(
            result.alreadySubmitted,
          ),
      });

      resetPartnerForm();
    } catch (error) {
      console.error(
        "PARTNER MANUAL PAYMENT ERROR:",
        error,
      );

      setManualError(
        error instanceof Error
          ? error.message
          : "Unable to submit your partnership payment.",
      );
    } finally {
      setManualBusy(false);
    }
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

    const generation =
      paypalGenerationRef.current +
      1;

    paypalGenerationRef.current =
      generation;

    let cancelled = false;

    function isCurrent() {
      return (
        !cancelled &&
        paypalGenerationRef.current ===
          generation
      );
    }

    function clearContainer() {
      if (
        paypalRef.current
      ) {
        paypalRef.current.innerHTML =
          "";
      }
    }

    async function setupPayPal() {
      if (
        !isCurrent() ||
        !paypalRef.current
      ) {
        return;
      }

      if (
        !window.paypal ||
        typeof window.paypal
          .createInstance !==
          "function"
      ) {
        setPayPalError(
          "PayPal Checkout did not initialize correctly.",
        );

        return;
      }

      try {
        clearContainer();
        setPayPalError("");

        const sdkInstance =
          await window.paypal.createInstance(
            {
              clientId:
                paypalClientId,
              components: [
                "paypal-payments",
              ],
            },
          );

        if (!isCurrent()) {
          return;
        }

        const eligibility =
          await sdkInstance.findEligibleMethods();

        if (!isCurrent()) {
          return;
        }

        if (
          !eligibility.isEligible(
            "paypal",
          )
        ) {
          setPayPalError(
            "PayPal is not available for this partnership payment.",
          );

          return;
        }

        const checkoutSession =
          await sdkInstance.createPayPalOneTimePaymentSession(
            {
              async onApprove(
                data,
              ) {
                try {
                  setPayPalBusy(true);
                  setPayPalError("");

                  const result =
                    await capturePayPalOrder(
                      data.orderId,
                    );

                  alert(
                    `Thank you. Your ${result.partnershipType} payment of $${Number(
                      result.amount,
                    ).toFixed(
                      2,
                    )} was successful.`,
                  );

                  resetPartnerForm();
                } catch (error) {
                  console.error(
                    "PARTNER PAYPAL CAPTURE ERROR:",
                    error,
                  );

                  const message =
                    error instanceof Error
                      ? error.message
                      : "Unable to confirm your partnership payment.";

                  setPayPalError(
                    message,
                  );

                  alert(message);
                } finally {
                  setPayPalBusy(false);
                }
              },

              onCancel() {
                setPayPalBusy(false);

                setPayPalError(
                  "Payment cancelled. Your partnership payment has not been marked as paid.",
                );
              },

              onError(error) {
                console.error(
                  "PARTNER PAYPAL ERROR:",
                  error,
                );

                setPayPalBusy(false);

                setPayPalError(
                  "PayPal partnership payment failed. Please try again.",
                );
              },
            },
          );

        if (
          !isCurrent() ||
          !paypalRef.current
        ) {
          return;
        }

        clearContainer();

        const button =
          document.createElement(
            "paypal-button",
          );

        button.addEventListener(
          "click",
          async () => {
            try {
              setPayPalBusy(true);
              setPayPalError("");

              const createOrderPromise =
                createPayPalOrder();

              await checkoutSession.start(
                {
                  presentationMode:
                    "auto",
                },
                createOrderPromise,
              );
            } catch (error) {
              console.error(
                "PARTNER PAYPAL START ERROR:",
                error,
              );

              setPayPalError(
                error instanceof Error
                  ? error.message
                  : "Unable to start PayPal partnership payment.",
              );
            } finally {
              setPayPalBusy(false);
            }
          },
        );

        paypalRef.current.appendChild(
          button,
        );
      } catch (error) {
        if (!isCurrent()) {
          return;
        }

        console.error(
          "PARTNER PAYPAL SETUP ERROR:",
          error,
        );

        setPayPalError(
          error instanceof Error
            ? error.message
            : "Unable to initialize PayPal.",
        );
      }
    }

    function handleScriptLoad() {
      void setupPayPal();
    }

    const existingScript =
      document.querySelector(
        "#partner-paypal-sdk-v6",
      );

    if (
      existingScript
    ) {
      if (
        window.paypal &&
        typeof window.paypal
          .createInstance ===
          "function"
      ) {
        void setupPayPal();
      } else {
        existingScript.addEventListener(
          "load",
          handleScriptLoad,
          {
            once: true,
          },
        );
      }

      return () => {
        cancelled = true;
        paypalGenerationRef.current +=
          1;

        existingScript.removeEventListener(
          "load",
          handleScriptLoad,
        );

        clearContainer();
      };
    }

    const script =
      document.createElement(
        "script",
      );

    script.id =
      "partner-paypal-sdk-v6";

    script.src =
      PAYPAL_SDK_URL;

    script.async = true;

    script.addEventListener(
      "load",
      handleScriptLoad,
      {
        once: true,
      },
    );

    script.addEventListener(
      "error",
      () => {
        if (
          isCurrent()
        ) {
          setPayPalError(
            "Unable to load PayPal Checkout.",
          );
        }
      },
      {
        once: true,
      },
    );

    document.body.appendChild(
      script,
    );

    return () => {
      cancelled = true;
      paypalGenerationRef.current +=
        1;

      script.removeEventListener(
        "load",
        handleScriptLoad,
      );

      clearContainer();
    };
  }, [
    paypalClientId,
    form.payment_method,
  ]);

  return (
    <>
      <SiteNav />

      <main className="min-h-screen bg-[#b30018] px-6 pb-24 pt-44 text-white">
        <section className="mx-auto max-w-5xl rounded-[3rem] bg-black/25 p-10 shadow-2xl md:p-16">
          <div className="text-center">
            <p className="font-black uppercase tracking-[0.35em] text-red-100">
              Support
            </p>

            <h1 className="font-display mt-5 text-6xl font-bold">
              Become a Partner
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-white/75">
              Partner with Delly&apos;s Matchups to support relationship
              education, counselling, matchmaking, community growth, and
              life-changing conversations.
            </p>
          </div>

          {manualResult ? (
            <div className="mt-10 rounded-[2rem] bg-white p-8 text-[#b30018]">
              <p className="font-black uppercase tracking-[0.25em]">
                Partnership Payment Submitted
              </p>

              <h2 className="font-display mt-4 text-5xl font-bold">
                Awaiting Confirmation
              </h2>

              <p className="mt-5 text-lg leading-8 text-black/70">
                Your payment details have been received. The payment will remain
                pending until it is manually verified.
              </p>

              <p className="mt-6 text-lg">
                <strong>
                  Partnership Type:
                </strong>{" "}
                {
                  manualResult.partnershipType
                }
              </p>

              <p className="mt-3 text-lg">
                <strong>
                  Payment Method:
                </strong>{" "}
                {
                  manualResult.paymentMethod
                }
              </p>

              <p className="mt-3 text-lg">
                <strong>
                  Amount:
                </strong>{" "}
                $
                {Number(
                  manualResult.amount,
                ).toFixed(
                  2,
                )}{" "}
                {
                  manualResult.currency
                }
              </p>

              <p className="mt-6 rounded-2xl bg-yellow-50 p-5 font-bold text-[#8f0013]">
                Please do not send the same payment again while confirmation is
                pending.
              </p>

              <button
                type="button"
                onClick={() =>
                  setManualResult(
                    null,
                  )
                }
                className="mt-8 rounded-full bg-[#b30018] px-8 py-4 font-black text-white"
              >
                Submit Another Partnership Payment
              </button>
            </div>
          ) : (
            <>
              <div className="mt-10 grid gap-5 text-left md:grid-cols-3">
                {partnershipTypes.map(
                  (item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() =>
                        setForm(
                          (
                            current,
                          ) => ({
                            ...current,
                            partnership_type:
                              item,
                          }),
                        )
                      }
                      className={`rounded-[2rem] p-6 text-left transition ${
                        form.partnership_type ===
                        item
                          ? "bg-white text-[#b30018]"
                          : "bg-white/10 text-white hover:bg-white/20"
                      }`}
                    >
                      <h2 className="font-black">
                        {item}
                      </h2>

                      <p className="mt-3 text-sm opacity-75">
                        {item ===
                        "Monthly Support"
                          ? "Give consistently to support the mission."
                          : item ===
                            "Project Partnership"
                          ? "Support events, content, outreach, and community programs."
                          : "Collaborate with Delly's Matchups as an organization."}
                      </p>
                    </button>
                  ),
                )}
              </div>

              <form
                onSubmit={(
                  event,
                ) =>
                  event.preventDefault()
                }
                className="mt-10 grid gap-6"
              >
                <div className="grid gap-5 md:grid-cols-2">
                  <input
                    type="text"
                    name="customer_name"
                    value={
                      form.customer_name
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Enter your full name"
                    className="rounded-2xl bg-white/10 px-5 py-4 text-white outline-none placeholder:text-white/50"
                  />

                  <input
                    type="email"
                    name="customer_email"
                    value={
                      form.customer_email
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Enter your email address"
                    className="rounded-2xl bg-white/10 px-5 py-4 text-white outline-none placeholder:text-white/50"
                  />

                  <select
                    name="country"
                    value={
                      form.country
                    }
                    onChange={
                      handleChange
                    }
                    className="rounded-2xl bg-white/10 px-5 py-4 text-white outline-none md:col-span-2"
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
                          key={
                            country
                          }
                          value={
                            country
                          }
                          className="text-black"
                        >
                          {country}
                        </option>
                      ),
                    )}
                  </select>

                  <input
                    name="postal_code"
                    value={
                      form.postal_code
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Enter postal / ZIP code"
                    className="rounded-2xl bg-white/10 px-5 py-4 text-white outline-none placeholder:text-white/50"
                  />

                  <div className="flex overflow-hidden rounded-2xl bg-white/10">
                    <select
                      name="phone_code"
                      value={
                        form.phone_code
                      }
                      onChange={
                        handleChange
                      }
                      className="w-28 bg-white/10 px-3 text-white outline-none"
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
                            key={
                              code
                            }
                            value={
                              code
                            }
                            className="text-black"
                          >
                            {code}
                          </option>
                        ),
                      )}
                    </select>

                    <input
                      name="phone"
                      value={
                        form.phone
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="Phone / WhatsApp number"
                      className="min-w-0 flex-1 bg-transparent px-4 py-4 text-white outline-none placeholder:text-white/50"
                    />
                  </div>

                  <input
                    type="text"
                    name="organization"
                    value={
                      form.organization
                    }
                    onChange={
                      handleChange
                    }
                    maxLength={200}
                    placeholder="Organization / company optional"
                    className="rounded-2xl bg-white/10 px-5 py-4 text-white outline-none placeholder:text-white/50 md:col-span-2"
                  />
                </div>

                <input
                  type="number"
                  name="amount"
                  value={
                    form.amount
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Support amount in USD"
                  min="1"
                  max="100000"
                  step="0.01"
                  className="rounded-2xl bg-white/10 px-5 py-4 text-white outline-none placeholder:text-white/50"
                />

                <textarea
                  name="notes"
                  value={
                    form.notes
                  }
                  onChange={
                    handleChange
                  }
                  maxLength={1000}
                  rows={5}
                  placeholder="Tell us how you would like to partner..."
                  className="rounded-2xl bg-white/10 px-5 py-4 text-white outline-none placeholder:text-white/50"
                />

                <PaymentMethodSelector
                  form={form}
                  setForm={
                    setForm
                  }
                  setPayPalError={
                    setPayPalError
                  }
                  setManualError={
                    setManualError
                  }
                />

                {form.payment_method ===
                "PayPal / Card" ? (
                  <div className="rounded-[2rem] bg-white p-6 text-[#b30018]">
                    <h2 className="font-display text-3xl font-bold">
                      PayPal / Card
                    </h2>

                    <p className="mt-3 text-black/65">
                      Your selected support amount and partnership type are
                      verified by the server before payment.
                    </p>

                    {!paypalClientId ? (
                      <p className="mt-5 font-bold text-red-700">
                        Missing NEXT_PUBLIC_PAYPAL_CLIENT_ID.
                      </p>
                    ) : (
                      <div
                        ref={
                          paypalRef
                        }
                        className="mt-6"
                      />
                    )}

                    {paypalBusy ? (
                      <p className="mt-4 text-center font-bold text-black/60">
                        Processing payment...
                      </p>
                    ) : null}

                    {paypalError ? (
                      <p className="mt-4 rounded-xl bg-red-50 p-4 font-bold text-red-700">
                        {
                          paypalError
                        }
                      </p>
                    ) : null}
                  </div>
                ) : null}

                {form.payment_method ===
                "Mobile Money" ? (
                  <ManualPaymentBox
                    type="momo"
                    form={
                      form
                    }
                    mobileMoney={
                      mobileMoney
                    }
                    bankDetails={
                      bankDetails
                    }
                    proofFile={
                      proofFile
                    }
                    proofInputRef={
                      proofInputRef
                    }
                    saving={
                      manualBusy
                    }
                    uploading={
                      uploading
                    }
                    error={
                      manualError
                    }
                    handleChange={
                      handleChange
                    }
                    handleProofUpload={
                      handleProofUpload
                    }
                    handleManualSubmit={
                      handleManualSubmit
                    }
                  />
                ) : null}

                {form.payment_method ===
                "Bank Transfer" ? (
                  <ManualPaymentBox
                    type="bank"
                    form={
                      form
                    }
                    mobileMoney={
                      mobileMoney
                    }
                    bankDetails={
                      bankDetails
                    }
                    proofFile={
                      proofFile
                    }
                    proofInputRef={
                      proofInputRef
                    }
                    saving={
                      manualBusy
                    }
                    uploading={
                      uploading
                    }
                    error={
                      manualError
                    }
                    handleChange={
                      handleChange
                    }
                    handleProofUpload={
                      handleProofUpload
                    }
                    handleManualSubmit={
                      handleManualSubmit
                    }
                  />
                ) : null}
              </form>
            </>
          )}
        </section>
      </main>

      <SiteFooter />
    </>
  );
}

function PaymentMethodSelector({
  form,
  setForm,
  setPayPalError,
  setManualError,
}) {
  return (
    <div>
      <h3 className="font-display text-4xl font-bold">
        Payment Method
      </h3>

      <div className="mt-6 grid gap-5 md:grid-cols-3">
        {[
          "PayPal / Card",
          "Mobile Money",
          "Bank Transfer",
        ].map(
          (method) => (
            <button
              key={
                method
              }
              type="button"
              onClick={() => {
                setPayPalError("");
                setManualError("");

                setForm(
                  (
                    current,
                  ) => ({
                    ...current,
                    payment_method:
                      method,
                  }),
                );
              }}
              className={`rounded-2xl p-6 font-black transition hover:scale-105 ${
                form.payment_method ===
                method
                  ? "bg-gradient-to-r from-yellow-200 via-yellow-400 to-yellow-600 text-black"
                  : "bg-white text-[#b30018]"
              }`}
            >
              {method}
            </button>
          ),
        )}
      </div>
    </div>
  );
}

function ManualPaymentBox({
  type,
  form,
  mobileMoney,
  bankDetails,
  proofFile,
  proofInputRef,
  saving,
  uploading,
  error,
  handleChange,
  handleProofUpload,
  handleManualSubmit,
}) {
  const isMomo =
    type === "momo";

  return (
    <div className="rounded-[2rem] border border-white/15 bg-white/10 p-6">
      <p className="text-sm font-black uppercase tracking-[0.3em] text-red-100">
        {isMomo
          ? "MTN Mobile Money"
          : "Bank Transfer"}
      </p>

      {isMomo ? (
        <>
          <p className="mt-4 text-lg leading-8 text-white/80">
            Send your partnership payment using the Mobile Money details below.
          </p>

          <div className="mt-5 rounded-2xl bg-black/20 p-5">
            <DetailRow
              label="Account Name"
              value={
                mobileMoney.name
              }
            />

            <DetailRow
              label="Mobile Money Number"
              value={
                mobileMoney.number
              }
            />
          </div>
        </>
      ) : (
        <>
          <p className="mt-4 text-lg leading-8 text-white/80">
            Send your partnership payment using the bank details below.
          </p>

          <div className="mt-5 rounded-2xl bg-black/20 p-5">
            <DetailRow
              label="Account Name"
              value={
                bankDetails.accountName
              }
            />

            <DetailRow
              label="Bank"
              value={
                bankDetails.bankName
              }
            />

            <DetailRow
              label="Sort Code"
              value={
                bankDetails.sortCode
              }
            />

            <DetailRow
              label="Account Number"
              value={
                bankDetails.accountNumber
              }
            />

            <DetailRow
              label="IBAN"
              value={
                bankDetails.iban
              }
            />

            <DetailRow
              label="BIC"
              value={
                bankDetails.bic
              }
            />
          </div>
        </>
      )}

      <input
        type="text"
        name="transaction_reference"
        value={
          form.transaction_reference
        }
        onChange={
          handleChange
        }
        maxLength={200}
        placeholder={
          isMomo
            ? "Mobile Money transaction ID *"
            : "Bank transaction reference *"
        }
        className="mt-6 w-full rounded-2xl bg-white px-5 py-4 text-black outline-none placeholder:text-black/45"
      />

      <label className="mt-6 block rounded-2xl border border-white/20 p-5">
        <span className="block font-black">
          Payment proof (optional)
        </span>

        <span className="mt-1 block text-sm text-white/65">
          JPG, PNG, WEBP or PDF. Maximum 10 MB.
        </span>

        <input
          ref={
            proofInputRef
          }
          type="file"
          accept=".jpg,.jpeg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf"
          onChange={
            handleProofUpload
          }
          className="mt-4 w-full"
        />

        {proofFile ? (
          <span className="mt-3 block text-sm font-bold text-yellow-200">
            {
              proofFile.name
            }
          </span>
        ) : null}

        {uploading ? (
          <span className="mt-3 block text-sm text-white/70">
            Uploading proof...
          </span>
        ) : null}
      </label>

      {error ? (
        <p className="mt-5 rounded-xl bg-red-100 p-4 font-bold text-red-800">
          {error}
        </p>
      ) : null}

      <div className="mt-6 flex flex-col gap-4 sm:flex-row">
        <a
          href={
            mobileMoney.whatsapp
          }
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full bg-white px-8 py-4 text-center font-black text-[#b30018] transition hover:scale-105"
        >
          Contact on WhatsApp
        </a>

        <button
          type="button"
          onClick={
            handleManualSubmit
          }
          disabled={
            saving ||
            uploading
          }
          className="rounded-full border border-white/20 bg-white/10 px-8 py-4 font-black text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving
            ? "Submitting..."
            : "I Have Paid"}
        </button>
      </div>

      <p className="mt-5 text-sm text-white/65">
        Manual partnership payments remain pending until the transaction is
        verified.
      </p>
    </div>
  );
}
