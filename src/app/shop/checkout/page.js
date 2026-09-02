// src/app/shop/checkout/page.js

"use client";

import {
  Suspense,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  SiteFooter,
  SiteNav,
} from "@/app/components/SiteChrome";
import { supabase } from "@/lib/supabase";

const PAYPAL_CREATE_ORDER_URL =
  "/api/paypal/shop-checkout";

const PAYPAL_CAPTURE_ORDER_URL =
  "/api/paypal/shop-capture";

const MANUAL_PAYMENT_URL =
  "/api/shop/manual-payment";

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
  address: "",
  city: "",
  country: "",
  postal_code: "",
  phone_code: "",
  phone: "",
  payment_method: "PayPal / Card",
  transaction_reference: "",
  notes: "",
};

function getPriceNumber(price) {
  return (
    Number(
      String(price ?? "")
        .replace("$", "")
        .trim(),
    ) || 0
  );
}

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

function normalizeCart(items) {
  if (!Array.isArray(items)) {
    return [];
  }

  const grouped = new Map();

  for (const item of items) {
    const id =
      typeof item?.id === "string"
        ? item.id.trim()
        : "";

    if (!id) {
      continue;
    }

    const rawQuantity =
      Number(item?.quantity ?? 1);

    const quantity =
      Number.isInteger(rawQuantity) &&
      rawQuantity > 0
        ? rawQuantity
        : 1;

    const existing =
      grouped.get(id);

    if (existing) {
      grouped.set(id, {
        ...existing,
        quantity:
          existing.quantity +
          quantity,
      });

      continue;
    }

    grouped.set(id, {
      ...item,
      id,
      quantity,
    });
  }

  return Array.from(
    grouped.values(),
  );
}

function createTrustedCartPayload(cart) {
  return cart.map((item) => ({
    id: item.id,
    quantity:
      Number(item.quantity) || 1,
  }));
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

function sanitizeFileName(fileName) {
  return fileName
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function clearShopCart() {
  localStorage.removeItem(
    "dm-cart",
  );

  localStorage.removeItem(
    "dm-checkout-cart",
  );

  window.dispatchEvent(
    new Event("cartUpdated"),
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

function ShopCheckoutContent() {
  const paypalContainerRef =
    useRef(null);

  const paypalGenerationRef =
    useRef(0);

  const formRef =
    useRef(emptyForm);

  const cartRef =
    useRef([]);

  const paypalClientId =
    process.env
      .NEXT_PUBLIC_PAYPAL_CLIENT_ID;

  const [cart, setCart] =
    useState([]);

  const [form, setForm] =
    useState(emptyForm);

  const [proofFile, setProofFile] =
    useState(null);

  const [
    loadingCart,
    setLoadingCart,
  ] = useState(true);

  const [
    paypalBusy,
    setPayPalBusy,
  ] = useState(false);

  const [
    manualBusy,
    setManualBusy,
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
  cartRef.current = cart;

  const itemCount =
    cart.reduce(
      (sum, item) =>
        sum +
        (Number(item.quantity) ||
          1),
      0,
    );

  const displayTotal =
    cart.reduce(
      (sum, item) =>
        sum +
        getPriceNumber(
          item.price,
        ) *
          (Number(item.quantity) ||
            1),
      0,
    );

  useEffect(() => {
    try {
      const savedCart =
        JSON.parse(
          localStorage.getItem(
            "dm-checkout-cart",
          ) ||
            localStorage.getItem(
              "dm-cart",
            ) ||
            "[]",
        );

      setCart(
        normalizeCart(savedCart),
      );
    } catch {
      setCart([]);
    } finally {
      setLoadingCart(false);
    }
  }, []);

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

  function handleProofChange(event) {
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

  function getFullPhone() {
    const current =
      formRef.current;

    return `${current.phone_code}${current.phone
      .replace(/^0+/, "")
      .trim()}`;
  }

  function validateCustomerDetails() {
    const current =
      formRef.current;

    const currentCart =
      cartRef.current;

    if (
      !Array.isArray(
        currentCart,
      ) ||
      currentCart.length === 0
    ) {
      alert(
        "Your Shop cart is empty.",
      );

      return false;
    }

    if (
      currentCart.some(
        (item) => !item.id,
      )
    ) {
      alert(
        "One or more Shop items are missing their secure product ID. Please remove them and add them again.",
      );

      return false;
    }

    if (
      !current.customer_name.trim() ||
      !current.customer_email.trim()
    ) {
      alert(
        "Please enter your full name and email address.",
      );

      return false;
    }

    if (!current.address.trim()) {
      alert(
        "Please enter your delivery address.",
      );

      return false;
    }

    if (!current.city.trim()) {
      alert(
        "Please enter your city.",
      );

      return false;
    }

    if (!current.country) {
      alert(
        "Please select your country.",
      );

      return false;
    }

    if (
      !current.postal_code.trim()
    ) {
      alert(
        "Please enter your postal / ZIP code.",
      );

      return false;
    }

    if (
      !current.phone_code ||
      !current.phone.trim()
    ) {
      alert(
        "Please enter your phone number.",
      );

      return false;
    }

    return true;
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
      ) || "payment-proof";

    const path = [
      "payment-proofs",
      "shop",
      `${Date.now()}-${crypto.randomUUID()}-${safeName}`,
    ].join("/");

    const {
      error: uploadError,
    } = await supabase.storage
      .from(
        PAYMENT_PROOF_BUCKET,
      )
      .upload(
        path,
        proofFile,
        {
          cacheControl: "3600",
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
      .getPublicUrl(path);

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
  }

  async function createPayPalOrder() {
    if (
      !validateCustomerDetails()
    ) {
      throw new Error(
        "Shop checkout information is incomplete.",
      );
    }

    const current =
      formRef.current;

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
            cart:
              createTrustedCartPayload(
                cartRef.current,
              ),
            customerName:
              current.customer_name.trim(),
            customerEmail:
              current.customer_email
                .trim()
                .toLowerCase(),
            customerPhone:
              getFullPhone(),
            address:
              current.address.trim(),
            city:
              current.city.trim(),
            country:
              current.country,
            postalCode:
              current.postal_code.trim(),
            note:
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
          "Unable to create your Shop PayPal order.",
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
      result.status !== "paid"
    ) {
      throw new Error(
        getApiError(
          result,
          "Your payment could not be confirmed. Please check your PayPal activity before attempting another payment.",
        ),
      );
    }

    return result;
  }

  async function submitManualPayment(
    event,
  ) {
    event.preventDefault();

    setManualError("");
    setManualResult(null);

    if (
      !validateCustomerDetails()
    ) {
      return;
    }

    const current =
      formRef.current;

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

    if (
      !current.transaction_reference.trim()
    ) {
      setManualError(
        "Transaction / payment reference is required.",
      );

      return;
    }

    if (
      current.transaction_reference
        .trim().length > 200
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
              cart:
                createTrustedCartPayload(
                  cartRef.current,
                ),
              customerName:
                current.customer_name.trim(),
              customerEmail:
                current.customer_email
                  .trim()
                  .toLowerCase(),
              customerPhone:
                getFullPhone(),
              address:
                current.address.trim(),
              city:
                current.city.trim(),
              country:
                current.country,
              postalCode:
                current.postal_code.trim(),
              paymentMethod:
                current.payment_method,
              transactionReference:
                current.transaction_reference.trim(),
              proofUrl,
              note:
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
            "Unable to submit your Shop payment.",
          ),
        );
      }

      if (
        result.status !==
        "pending_confirmation"
      ) {
        throw new Error(
          "The Shop payment returned an unexpected status.",
        );
      }

      clearShopCart();
      setCart([]);

      setManualResult({
        orderNumber:
          result.orderNumber ||
          "",
        shopOrderId:
          result.shopOrderId ||
          "",
        paymentId:
          result.paymentId ||
          "",
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

      setProofFile(null);

      setForm((previous) => ({
        ...previous,
        transaction_reference:
          "",
        notes: "",
      }));
    } catch (error) {
      console.error(
        "SHOP MANUAL PAYMENT ERROR:",
        error,
      );

      setManualError(
        error instanceof Error
          ? error.message
          : "Unable to submit your Shop payment.",
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
      !paypalContainerRef.current ||
      loadingCart ||
      cart.length === 0
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
        paypalContainerRef.current
      ) {
        paypalContainerRef.current.innerHTML =
          "";
      }
    }

    async function setupPayPal() {
      if (
        !isCurrent() ||
        !paypalContainerRef.current
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
            "PayPal is not available for this checkout.",
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

                  const firstName =
                    result.customerName
                      ?.trim()
                      ?.split(/\s+/)[0];

                  if (firstName) {
                    localStorage.setItem(
                      "clientName",
                      firstName,
                    );
                  }

                  clearShopCart();

                  window.location.href =
                    "/shop/payment-success";
                } catch (error) {
                  console.error(
                    "SHOP PAYPAL CAPTURE ERROR:",
                    error,
                  );

                  const message =
                    error instanceof Error
                      ? error.message
                      : "Unable to confirm your Shop payment.";

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
                  "Payment cancelled. Your order has not been marked as paid.",
                );
              },

              onError(error) {
                console.error(
                  "SHOP PAYPAL ERROR:",
                  error,
                );

                setPayPalBusy(false);

                setPayPalError(
                  "PayPal payment failed. Please try again.",
                );
              },
            },
          );

        if (
          !isCurrent() ||
          !paypalContainerRef.current
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
                "SHOP PAYPAL START ERROR:",
                error,
              );

              setPayPalError(
                error instanceof Error
                  ? error.message
                  : "Unable to start PayPal checkout.",
              );
            } finally {
              setPayPalBusy(false);
            }
          },
        );

        paypalContainerRef.current.appendChild(
          button,
        );
      } catch (error) {
        if (!isCurrent()) {
          return;
        }

        console.error(
          "SHOP PAYPAL SETUP ERROR:",
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
        "#shop-paypal-sdk-v6",
      );

    if (existingScript) {
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
      "shop-paypal-sdk-v6";

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
        if (isCurrent()) {
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
    loadingCart,
    cart.length,
  ]);

  if (loadingCart) {
    return (
      <>
        <SiteNav />

        <main className="flex min-h-screen items-center justify-center bg-[#b30018] text-white">
          Loading checkout...
        </main>

        <SiteFooter />
      </>
    );
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
              Delly&apos;s Matchups Shop
            </p>

            <h1 className="font-display mt-5 text-6xl font-bold leading-none md:text-7xl">
              Complete Your Order
            </h1>

            {manualResult ? (
              <div className="mt-10 rounded-[2rem] bg-white p-8 text-[#b30018]">
                <p className="font-black uppercase tracking-[0.25em]">
                  Payment Submitted
                </p>

                <h2 className="font-display mt-4 text-5xl font-bold">
                  Awaiting Confirmation
                </h2>

                <p className="mt-5 text-lg leading-8 text-black/70">
                  Your payment details have been received. Your order will
                  remain pending until the payment is verified.
                </p>

                {manualResult.orderNumber ? (
                  <p className="mt-6 text-lg">
                    <strong>
                      Order Number:
                    </strong>{" "}
                    {manualResult.orderNumber}
                  </p>
                ) : null}

                <p className="mt-3 text-lg">
                  <strong>
                    Payment Method:
                  </strong>{" "}
                  {manualResult.paymentMethod}
                </p>

                {Number.isFinite(
                  Number(
                    manualResult.amount,
                  ),
                ) ? (
                  <p className="mt-3 text-lg">
                    <strong>
                      Submitted Amount:
                    </strong>{" "}
                    $
                    {Number(
                      manualResult.amount,
                    ).toFixed(2)}{" "}
                    {manualResult.currency}
                  </p>
                ) : null}

                <p className="mt-6 rounded-2xl bg-yellow-50 p-5 font-bold text-[#8f0013]">
                  Please do not send the same payment again while confirmation
                  is pending.
                </p>

                <div className="mt-8 flex flex-wrap gap-4">
                  <a
                    href="/shop/books"
                    className="rounded-full bg-[#b30018] px-8 py-4 font-black text-white"
                  >
                    Continue Shopping
                  </a>

                  <a
                    href="/contact"
                    className="rounded-full border border-[#b30018]/20 px-8 py-4 font-black"
                  >
                    Contact Us
                  </a>
                </div>
              </div>
            ) : cart.length === 0 ? (
              <div className="mt-10 rounded-[2rem] bg-white p-8 text-[#b30018]">
                <h2 className="text-3xl font-black">
                  Your cart is empty
                </h2>

                <a
                  href="/shop/books"
                  className="mt-6 inline-flex rounded-full bg-[#b30018] px-8 py-4 font-black text-white"
                >
                  Return To Shop
                </a>
              </div>
            ) : (
              <>
                <div className="mt-10 rounded-[2rem] border border-yellow-300/40 bg-white p-7 text-[#b30018] shadow-2xl">
                  <p className="font-black uppercase tracking-[0.25em]">
                    Order Summary
                  </p>

                  <div className="mt-6 space-y-4">
                    {cart.map(
                      (
                        item,
                        index,
                      ) => (
                        <div
                          key={
                            item.id ||
                            `${item.title}-${index}`
                          }
                          className="flex items-start justify-between gap-6 border-b border-black/10 pb-4"
                        >
                          <div>
                            <p className="font-black">
                              {item.title ||
                                "Shop Item"}
                            </p>

                            <p className="mt-1 text-sm text-black/60">
                              Quantity:{" "}
                              {Number(
                                item.quantity,
                              ) || 1}
                            </p>
                          </div>

                          <p className="font-black">
                            $
                            {(
                              getPriceNumber(
                                item.price,
                              ) *
                              (Number(
                                item.quantity,
                              ) ||
                                1)
                            ).toFixed(2)}
                          </p>
                        </div>
                      ),
                    )}
                  </div>

                  <div className="mt-6 flex items-center justify-between">
                    <span className="text-xl font-black">
                      Display Total
                    </span>

                    <span className="text-4xl font-black">
                      $
                      {displayTotal.toFixed(
                        2,
                      )}
                    </span>
                  </div>

                  <p className="mt-3 text-sm text-black/60">
                    {itemCount} item
                    {itemCount === 1
                      ? ""
                      : "s"}
                    . Final amount is calculated from the trusted Shop catalogue
                    by the server.
                  </p>
                </div>

                <div className="mt-10 grid gap-5 md:grid-cols-2">
                  <input
                    type="text"
                    name="customer_name"
                    value={
                      form.customer_name
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Full name"
                    className="h-16 rounded-2xl bg-white/10 px-5 text-white outline-none placeholder:text-white/60"
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
                    placeholder="Email address"
                    className="h-16 rounded-2xl bg-white/10 px-5 text-white outline-none placeholder:text-white/60"
                  />

                  <input
                    type="text"
                    name="address"
                    value={
                      form.address
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Delivery address"
                    className="h-16 rounded-2xl bg-white/10 px-5 text-white outline-none placeholder:text-white/60 md:col-span-2"
                  />

                  <input
                    type="text"
                    name="city"
                    value={form.city}
                    onChange={
                      handleChange
                    }
                    placeholder="City"
                    className="h-16 rounded-2xl bg-white/10 px-5 text-white outline-none placeholder:text-white/60"
                  />

                  <input
                    type="text"
                    name="postal_code"
                    value={
                      form.postal_code
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Postal / ZIP code"
                    className="h-16 rounded-2xl bg-white/10 px-5 text-white outline-none placeholder:text-white/60"
                  />

                  <select
                    name="country"
                    value={
                      form.country
                    }
                    onChange={
                      handleChange
                    }
                    className="h-16 rounded-2xl bg-white/10 px-5 text-white outline-none md:col-span-2"
                  >
                    <option
                      value=""
                      className="text-black"
                    >
                      Select country
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

                  <div className="flex h-16 overflow-hidden rounded-2xl bg-white/10 md:col-span-2">
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
                      type="tel"
                      name="phone"
                      value={
                        form.phone
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="Phone / WhatsApp number"
                      className="min-w-0 flex-1 bg-transparent px-4 text-white outline-none placeholder:text-white/60"
                    />
                  </div>

                  <textarea
                    name="notes"
                    value={
                      form.notes
                    }
                    onChange={
                      handleChange
                    }
                    maxLength={1000}
                    rows={4}
                    placeholder="Delivery note or special instructions (optional)"
                    className="rounded-2xl bg-white/10 px-5 py-4 text-white outline-none placeholder:text-white/60 md:col-span-2"
                  />
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
                    ].map(
                      (method) => (
                        <button
                          key={method}
                          type="button"
                          onClick={() => {
                            setManualError("");
                            setPayPalError("");

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

                {form.payment_method ===
                "PayPal / Card" ? (
                  <div className="mt-8 rounded-[2rem] bg-white p-6 text-[#b30018]">
                    <h2 className="font-display text-3xl font-bold">
                      PayPal / Card
                    </h2>

                    <p className="mt-3 text-black/65">
                      Your final Shop total is calculated and verified by the
                      server before payment.
                    </p>

                    {!paypalClientId ? (
                      <p className="mt-5 font-bold text-red-700">
                        Missing NEXT_PUBLIC_PAYPAL_CLIENT_ID.
                      </p>
                    ) : (
                      <div
                        ref={
                          paypalContainerRef
                        }
                        className="mt-6"
                      />
                    )}

                    {paypalBusy ? (
                      <p className="mt-4 text-center font-bold text-black/60">
                        Processing...
                      </p>
                    ) : null}

                    {paypalError ? (
                      <p className="mt-4 rounded-xl bg-red-50 p-4 font-bold text-red-700">
                        {paypalError}
                      </p>
                    ) : null}
                  </div>
                ) : null}

                {form.payment_method ===
                "Mobile Money" ? (
                  <form
                    onSubmit={
                      submitManualPayment
                    }
                    className="mt-8 rounded-[2rem] border border-white/15 bg-white/10 p-6"
                  >
                    <h2 className="font-display text-4xl font-bold">
                      Mobile Money
                    </h2>

                    <div className="mt-5 rounded-2xl bg-black/20 p-5">
                      <DetailRow
                        label="Account Name"
                        value={
                          mobileMoney.name
                        }
                      />

                      <DetailRow
                        label="Number"
                        value={
                          mobileMoney.number
                        }
                      />
                    </div>

                    <a
                      href={
                        mobileMoney.whatsapp
                      }
                      target="_blank"
                      rel="noreferrer"
                      className="mt-5 inline-flex rounded-full bg-white px-6 py-3 font-black text-[#b30018]"
                    >
                      WhatsApp
                    </a>

                    <div className="mt-7 grid gap-5">
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
                        placeholder="Transaction / payment reference *"
                        className="h-16 rounded-2xl bg-white px-5 text-black outline-none placeholder:text-black/45"
                      />

                      <label className="rounded-2xl border border-white/20 p-5">
                        <span className="block font-black">
                          Payment proof
                          (optional)
                        </span>

                        <span className="mt-1 block text-sm text-white/65">
                          JPG, PNG, WEBP or PDF. Maximum 10 MB.
                        </span>

                        <input
                          type="file"
                          accept=".jpg,.jpeg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf"
                          onChange={
                            handleProofChange
                          }
                          className="mt-4 block w-full text-sm"
                        />

                        {proofFile ? (
                          <span className="mt-3 block text-sm font-bold text-yellow-200">
                            {proofFile.name}
                          </span>
                        ) : null}
                      </label>
                    </div>

                    {manualError ? (
                      <p className="mt-5 rounded-xl bg-red-100 p-4 font-bold text-red-800">
                        {manualError}
                      </p>
                    ) : null}

                    <button
                      type="submit"
                      disabled={
                        manualBusy
                      }
                      className="mt-7 w-full rounded-full bg-gradient-to-r from-yellow-200 via-yellow-400 to-yellow-600 py-5 text-lg font-black text-black disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {manualBusy
                        ? "Submitting..."
                        : "Submit Mobile Money Payment"}
                    </button>

                    <p className="mt-4 text-sm text-white/65">
                      Submission does not automatically mark your order as
                      paid. Payment must be verified first.
                    </p>
                  </form>
                ) : null}

                {form.payment_method ===
                "Bank Transfer" ? (
                  <form
                    onSubmit={
                      submitManualPayment
                    }
                    className="mt-8 rounded-[2rem] border border-white/15 bg-white/10 p-6"
                  >
                    <h2 className="font-display text-4xl font-bold">
                      Bank Transfer
                    </h2>

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

                    <div className="mt-7 grid gap-5">
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
                        placeholder="Bank transaction reference *"
                        className="h-16 rounded-2xl bg-white px-5 text-black outline-none placeholder:text-black/45"
                      />

                      <label className="rounded-2xl border border-white/20 p-5">
                        <span className="block font-black">
                          Payment proof
                          (optional)
                        </span>

                        <span className="mt-1 block text-sm text-white/65">
                          JPG, PNG, WEBP or PDF. Maximum 10 MB.
                        </span>

                        <input
                          type="file"
                          accept=".jpg,.jpeg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf"
                          onChange={
                            handleProofChange
                          }
                          className="mt-4 block w-full text-sm"
                        />

                        {proofFile ? (
                          <span className="mt-3 block text-sm font-bold text-yellow-200">
                            {proofFile.name}
                          </span>
                        ) : null}
                      </label>
                    </div>

                    {manualError ? (
                      <p className="mt-5 rounded-xl bg-red-100 p-4 font-bold text-red-800">
                        {manualError}
                      </p>
                    ) : null}

                    <button
                      type="submit"
                      disabled={
                        manualBusy
                      }
                      className="mt-7 w-full rounded-full bg-gradient-to-r from-yellow-200 via-yellow-400 to-yellow-600 py-5 text-lg font-black text-black disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {manualBusy
                        ? "Submitting..."
                        : "Submit Bank Transfer"}
                    </button>

                    <p className="mt-4 text-sm text-white/65">
                      Your order remains pending until the bank transfer is
                      verified.
                    </p>
                  </form>
                ) : null}
              </>
            )}
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}

export default function ShopCheckoutPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[#b30018] text-white">
          Loading checkout...
        </main>
      }
    >
      <ShopCheckoutContent />
    </Suspense>
  );
}
