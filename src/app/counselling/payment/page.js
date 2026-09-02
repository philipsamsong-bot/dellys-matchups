// src/app/counselling/payment/page.js

"use client";

import {
  Suspense,
  useEffect,
  useRef,
  useState,
} from "react";
import { useSearchParams } from "next/navigation";
import {
  SiteFooter,
  SiteNav,
} from "@/app/components/SiteChrome";
import { supabase } from "@/lib/supabase";

const PAYPAL_CREATE_ORDER_URL =
  "/api/counselling/paypal/create-order";

const PAYPAL_CAPTURE_ORDER_URL =
  "/api/counselling/paypal/capture-order";

const MANUAL_PAYMENT_URL =
  "/api/counselling/manual-payment";

const PAYPAL_SDK_URL =
  "https://www.paypal.com/web-sdk/v6/core";

const counsellingSessions = {
  individual: {
    title: "Individual Session",
    price: 100,
  },
  couple: {
    title: "Couple Session",
    price: 250,
  },
  international_individual: {
    title:
      "International Individual Session",
    price: 100,
  },
  international_couple: {
    title:
      "International Couple Session",
    price: 250,
  },
};

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

function isValidSessionType(value) {
  return (
    typeof value === "string" &&
    Object.prototype.hasOwnProperty.call(
      counsellingSessions,
      value,
    )
  );
}

async function parseJsonResponse(
  response,
) {
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

function getPayPalErrorMessage(
  error,
) {
  const message =
    error instanceof Error
      ? error.message
      : String(error || "");

  if (
    message.includes(
      "INSUFFICIENT_FUNDS",
    )
  ) {
    return "Payment declined because there are insufficient funds.";
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

function CounsellingPaymentContent() {
  const searchParams =
    useSearchParams();

  const paypalContainerRef =
    useRef(null);

  const sessionTypeRef =
    useRef("individual");

  const bookingIdRef =
    useRef("");

  const paypalGenerationRef =
    useRef(0);

  const paypalClientId =
    process.env
      .NEXT_PUBLIC_PAYPAL_CLIENT_ID;

  const requestedSessionType =
    searchParams.get("type");

  const bookingId =
    searchParams.get("booking") || "";

  const initialSessionType =
    isValidSessionType(
      requestedSessionType,
    )
      ? requestedSessionType
      : "individual";

  const [
    sessionType,
    setSessionType,
  ] = useState(
    initialSessionType,
  );

  const [
    paymentMethod,
    setPaymentMethod,
  ] = useState(
    "PayPal / Card",
  );

  const [
    providerReference,
    setProviderReference,
  ] = useState("");

  const [notes, setNotes] =
    useState("");

  const [
    proofUrl,
    setProofUrl,
  ] = useState("");

  const [
    uploading,
    setUploading,
  ] = useState(false);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    paypalError,
    setPayPalError,
  ] = useState("");

  const [
    manualSubmitted,
    setManualSubmitted,
  ] = useState(false);

  const session =
    counsellingSessions[
      sessionType
    ];

  sessionTypeRef.current =
    sessionType;

  bookingIdRef.current =
    bookingId;

  function validateBooking() {
    if (!bookingIdRef.current) {
      alert(
        "Booking ID is missing. Please return to the counselling booking page and create your booking again.",
      );

      return false;
    }

    if (
      !isValidSessionType(
        sessionTypeRef.current,
      )
    ) {
      alert(
        "Invalid counselling session type.",
      );

      return false;
    }

    return true;
  }

  async function createPayPalOrder() {
    if (!validateBooking()) {
      throw new Error(
        "Unable to start PayPal because the counselling booking information is incomplete.",
      );
    }

    setPayPalError("");

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
            bookingId:
              bookingIdRef.current,
            sessionType:
              sessionTypeRef.current,
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
          "Unable to create PayPal counselling order.",
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
    if (!orderId) {
      throw new Error(
        "PayPal did not return an order ID.",
      );
    }

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
          "Your PayPal payment could not be confirmed. Please check your PayPal activity before attempting another payment.",
        ),
      );
    }

    return result;
  }

  useEffect(() => {
    if (
      paymentMethod !==
        "PayPal / Card" ||
      !paypalClientId ||
      !paypalContainerRef.current
    ) {
      return undefined;
    }

    const generation =
      paypalGenerationRef.current +
      1;

    paypalGenerationRef.current =
      generation;

    let cancelled = false;

    function isCurrentGeneration() {
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
        !isCurrentGeneration() ||
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
          "PayPal Checkout did not initialize correctly. Please refresh the page and try again.",
        );

        return;
      }

      try {
        setPayPalError("");

        clearContainer();

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

        if (
          !isCurrentGeneration()
        ) {
          return;
        }

        const eligibility =
          await sdkInstance.findEligibleMethods();

        if (
          !isCurrentGeneration()
        ) {
          return;
        }

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

        const checkoutSession =
          await sdkInstance.createPayPalOneTimePaymentSession(
            {
              async onApprove(
                data,
              ) {
                try {
                  setSaving(true);
                  setPayPalError("");

                  const result =
                    await capturePayPalOrder(
                      data.orderId,
                    );

                  if (
                    result.emailSent ===
                    false
                  ) {
                    console.warn(
                      "COUNSELLING PAYMENT VERIFIED BUT EMAIL FAILED",
                    );
                  }

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

                  alert(
                    "Payment successful. Your counselling booking has been confirmed.",
                  );

                  window.location.href =
                    "/counselling/payment-success";
                } catch (error) {
                  const message =
                    getPayPalErrorMessage(
                      error,
                    );

                  console.error(
                    "COUNSELLING PAYPAL CAPTURE ERROR:",
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
                  "Payment cancelled. Your counselling booking has not been marked as paid.",
                );
              },

              onError(error) {
                setSaving(false);

                const message =
                  getPayPalErrorMessage(
                    error,
                  );

                console.error(
                  "COUNSELLING PAYPAL ERROR:",
                  error,
                );

                setPayPalError(
                  message,
                );
              },
            },
          );

        if (
          !isCurrentGeneration() ||
          !paypalContainerRef.current
        ) {
          return;
        }

        clearContainer();

        const paypalButton =
          document.createElement(
            "paypal-button",
          );

        paypalButton.addEventListener(
          "click",
          async () => {
            try {
              setSaving(true);
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
              const message =
                getPayPalErrorMessage(
                  error,
                );

              console.error(
                "COUNSELLING PAYPAL START ERROR:",
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

        paypalContainerRef.current.appendChild(
          paypalButton,
        );
      } catch (error) {
        if (
          !isCurrentGeneration()
        ) {
          return;
        }

        const message =
          getPayPalErrorMessage(
            error,
          );

        console.error(
          "COUNSELLING PAYPAL SETUP ERROR:",
          error,
        );

        setPayPalError(
          message,
        );
      }
    }

    function handleSdkLoad() {
      void setupPayPal();
    }

    const existingScript =
      document.querySelector(
        "#counselling-paypal-sdk-v6",
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
          handleSdkLoad,
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
          handleSdkLoad,
        );

        clearContainer();
      };
    }

    const script =
      document.createElement(
        "script",
      );

    script.id =
      "counselling-paypal-sdk-v6";

    script.src =
      PAYPAL_SDK_URL;

    script.async = true;

    script.addEventListener(
      "load",
      handleSdkLoad,
      {
        once: true,
      },
    );

    script.addEventListener(
      "error",
      () => {
        if (
          isCurrentGeneration()
        ) {
          setPayPalError(
            "Unable to load PayPal Checkout. Please refresh the page and try again.",
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
        handleSdkLoad,
      );

      clearContainer();
    };
  }, [
    paypalClientId,
    paymentMethod,
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

      const fileExtension =
        file.name
          .split(".")
          .pop()
          ?.replace(
            /[^a-zA-Z0-9]/g,
            "",
          ) || "jpg";

      const uniqueId =
        globalThis.crypto
          ?.randomUUID?.() ||
        `${Date.now()}-${Math.random()
          .toString(36)
          .slice(2)}`;

      const fileName =
        `payment-proofs/counselling/` +
        `${uniqueId}.${fileExtension}`;

      const { error } =
        await supabase.storage
          .from(
            "content-images",
          )
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
          .from(
            "content-images",
          )
          .getPublicUrl(
            fileName,
          );

      if (
        !data.publicUrl
      ) {
        throw new Error(
          "Payment proof URL was not returned.",
        );
      }

      setProofUrl(
        data.publicUrl,
      );
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

  async function handleManualPaymentSubmit() {
    if (
      saving ||
      uploading
    ) {
      return;
    }

    if (!validateBooking()) {
      return;
    }

    if (
      paymentMethod !==
        "Mobile Money" &&
      paymentMethod !==
        "Bank Transfer"
    ) {
      return;
    }

    const trimmedReference =
      providerReference.trim();

    if (
      !trimmedReference
    ) {
      alert(
        "Please enter the transaction ID or payment reference supplied by your bank or Mobile Money provider.",
      );

      return;
    }

    const confirmed =
      window.confirm(
        "Only submit after you have already made the payment. Your booking will remain pending until Delly's Matchups verifies the transaction.",
      );

    if (!confirmed) {
      return;
    }

    try {
      setSaving(true);
      setManualSubmitted(false);

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
              bookingId:
                bookingIdRef.current,
              sessionType:
                sessionTypeRef.current,
              paymentMethod,
              providerReference:
                trimmedReference,
              proofUrl:
                proofUrl || null,
              notes:
                notes.trim(),
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
            "Unable to submit your counselling payment for verification.",
          ),
        );
      }

      setManualSubmitted(true);

      if (
        result.alreadySubmitted
      ) {
        alert(
          "This payment was already submitted. Your existing payment record remains pending verification.",
        );
      } else {
        alert(
          "Your payment has been submitted successfully and is pending verification.",
        );
      }
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Unable to submit your counselling payment for verification.",
      );
    } finally {
      setSaving(false);
    }
  }

  function handlePaymentMethodChange(
    event,
  ) {
    setPaymentMethod(
      event.target.value,
    );

    setProviderReference("");
    setProofUrl("");
    setNotes("");
    setManualSubmitted(false);
    setPayPalError("");
  }

  const whatsappMessage =
    encodeURIComponent(
      [
        "Hello Delly's Matchups,",
        "",
        "I need help with my counselling payment.",
        `Booking ID: ${bookingId || "Not available"}`,
        `Session: ${session.title}`,
        `Amount: $${session.price} USD`,
        `Payment Method: ${paymentMethod}`,
        providerReference.trim()
          ? `Reference: ${providerReference.trim()}`
          : "",
      ]
        .filter(Boolean)
        .join("\n"),
    );

  const whatsappUrl =
    `${mobileMoney.whatsapp}` +
    `?text=${whatsappMessage}`;

  return (
    <>
      <SiteNav />

      <main className="min-h-screen bg-[#b30018] px-6 pb-24 pt-44 text-white">
        <div className="mx-auto max-w-4xl rounded-[3rem] bg-[#c1121f] p-8 shadow-2xl md:p-12">
          <p className="text-sm font-black uppercase tracking-[0.45em] text-red-100">
            Secure Payment
          </p>

          <h1 className="font-display mt-6 text-6xl font-bold leading-none">
            Counselling Payment
          </h1>

          <p className="mt-6 text-lg leading-8 text-white/75">
            Complete your payment to confirm
            your counselling or mentorship
            session.
          </p>

          {!bookingId ? (
            <div className="mt-8 rounded-2xl border border-yellow-300/30 bg-yellow-100 p-5 font-bold text-[#8f0013]">
              Booking ID is missing. Return to
              the counselling booking page and
              create your booking before making
              payment.
            </div>
          ) : null}

          <div className="mt-10">
            <label className="text-sm font-black uppercase tracking-[0.3em] text-red-100">
              Session Type
            </label>

            <select
              value={sessionType}
              onChange={(event) => {
                const value =
                  event.target.value;

                if (
                  isValidSessionType(
                    value,
                  )
                ) {
                  setSessionType(
                    value,
                  );
                }
              }}
              className="mt-4 h-16 w-full rounded-2xl border border-white/15 bg-white/10 px-5 text-white outline-none"
            >
              <option
                value="individual"
                className="text-black"
              >
                Individual Session - $100
              </option>

              <option
                value="couple"
                className="text-black"
              >
                Couple Session - $250
              </option>

              <option
                value="international_individual"
                className="text-black"
              >
                International Individual Session
                - $100
              </option>

              <option
                value="international_couple"
                className="text-black"
              >
                International Couple Session -
                $250
              </option>
            </select>
          </div>

          <div className="mt-10 rounded-[2rem] bg-white/10 p-6">
            <p className="text-white/70">
              Amount Due
            </p>

            <p className="mt-2 text-6xl font-black">
              ${session.price}
            </p>

            <p className="mt-3 text-sm font-bold uppercase tracking-[0.2em] text-white/60">
              USD
            </p>
          </div>

          <div className="mt-10">
            <label className="text-sm font-black uppercase tracking-[0.3em] text-red-100">
              Choose Payment Method
            </label>

            <select
              value={paymentMethod}
              onChange={
                handlePaymentMethodChange
              }
              className="mt-4 h-16 w-full rounded-2xl border border-white/15 bg-white/10 px-5 text-white outline-none"
            >
              <option
                value="PayPal / Card"
                className="text-black"
              >
                PayPal / Card
              </option>

              <option
                value="Mobile Money"
                className="text-black"
              >
                Mobile Money
              </option>

              <option
                value="Bank Transfer"
                className="text-black"
              >
                Bank Transfer
              </option>
            </select>
          </div>

          {paymentMethod ===
            "PayPal / Card" && (
            <div className="mt-10 rounded-[2rem] bg-white p-6 text-[#b30018]">
              <h2 className="font-display text-3xl font-bold">
                PayPal / Card
              </h2>

              <p className="mt-3 leading-7 text-black/70">
                Complete your payment securely
                with PayPal. Your booking is
                marked paid only after the
                server verifies the completed
                PayPal transaction.
              </p>

              {!paypalClientId ? (
                <div className="mt-6 rounded-2xl bg-red-50 p-5 font-bold text-red-700">
                  Missing PayPal Client ID. Add
                  NEXT_PUBLIC_PAYPAL_CLIENT_ID
                  to the production environment.
                </div>
              ) : (
                <div
                  ref={
                    paypalContainerRef
                  }
                  className="mt-6"
                />
              )}

              {saving ? (
                <p className="mt-4 text-center font-bold text-black/60">
                  Processing payment...
                </p>
              ) : null}

              {paypalError ? (
                <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 font-bold text-red-700">
                  {paypalError}
                </p>
              ) : null}
            </div>
          )}

          {paymentMethod ===
            "Mobile Money" && (
            <div className="mt-10 rounded-[2rem] border border-white/15 bg-white/10 p-6">
              <p className="text-sm font-black uppercase tracking-[0.3em] text-red-100">
                MTN Mobile Money
              </p>

              <h2 className="font-display mt-3 text-4xl font-bold">
                Mobile Money
              </h2>

              <p className="mt-4 text-lg leading-8 text-white/80">
                Send the exact amount below,
                then enter the transaction
                reference supplied by Mobile
                Money.
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

                <DetailRow
                  label="Amount"
                  value={`$${session.price} USD`}
                />
              </div>

              <ManualPaymentFields
                providerReference={
                  providerReference
                }
                setProviderReference={
                  setProviderReference
                }
                notes={notes}
                setNotes={setNotes}
                proofUrl={proofUrl}
                uploading={uploading}
                handleProofUpload={
                  handleProofUpload
                }
              />

              <ManualPaymentActions
                whatsappUrl={
                  whatsappUrl
                }
                saving={saving}
                uploading={
                  uploading
                }
                manualSubmitted={
                  manualSubmitted
                }
                handleSubmit={
                  handleManualPaymentSubmit
                }
              />
            </div>
          )}

          {paymentMethod ===
            "Bank Transfer" && (
            <div className="mt-10 rounded-[2rem] border border-white/15 bg-white/10 p-6">
              <p className="text-sm font-black uppercase tracking-[0.3em] text-red-100">
                Bank Transfer
              </p>

              <h2 className="font-display mt-3 text-4xl font-bold">
                Lloyds Bank
              </h2>

              <p className="mt-4 text-lg leading-8 text-white/80">
                Send the exact amount using the
                bank details below, then enter
                the transaction reference
                supplied by your bank.
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

                <DetailRow
                  label="Amount"
                  value={`$${session.price} USD`}
                />
              </div>

              <ManualPaymentFields
                providerReference={
                  providerReference
                }
                setProviderReference={
                  setProviderReference
                }
                notes={notes}
                setNotes={setNotes}
                proofUrl={proofUrl}
                uploading={uploading}
                handleProofUpload={
                  handleProofUpload
                }
              />

              <ManualPaymentActions
                whatsappUrl={
                  whatsappUrl
                }
                saving={saving}
                uploading={
                  uploading
                }
                manualSubmitted={
                  manualSubmitted
                }
                handleSubmit={
                  handleManualPaymentSubmit
                }
              />
            </div>
          )}
        </div>
      </main>

      <SiteFooter />
    </>
  );
}

function ManualPaymentFields({
  providerReference,
  setProviderReference,
  notes,
  setNotes,
  proofUrl,
  uploading,
  handleProofUpload,
}) {
  return (
    <>
      <label className="mt-6 block text-sm font-black uppercase tracking-[0.15em] text-yellow-200">
        Transaction ID / Reference
      </label>

      <input
        type="text"
        value={
          providerReference
        }
        onChange={(event) =>
          setProviderReference(
            event.target.value,
          )
        }
        maxLength={200}
        placeholder="Enter your payment reference"
        className="mt-2 h-16 w-full rounded-2xl bg-white/10 px-5 text-white outline-none placeholder:text-white/60"
        required
      />

      <p className="mt-2 text-sm leading-6 text-white/60">
        Required. Use the transaction ID or
        reference supplied by your payment
        provider.
      </p>

      <label className="mt-6 block text-sm font-black uppercase tracking-[0.15em] text-yellow-200">
        Note (Optional)
      </label>

      <textarea
        value={notes}
        onChange={(event) =>
          setNotes(
            event.target.value,
          )
        }
        maxLength={1000}
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
        onChange={
          handleProofUpload
        }
        className="mt-2 w-full rounded-2xl bg-white/10 px-5 py-4 text-white"
      />

      <p className="mt-2 text-sm leading-6 text-white/60">
        Optional but recommended. Upload an
        image or PDF receipt up to 10 MB.
      </p>

      {uploading ? (
        <p className="mt-3 text-sm text-white/70">
          Uploading proof...
        </p>
      ) : null}

      {proofUrl ? (
        <p className="mt-3 font-bold text-yellow-200">
          ✓ Payment proof uploaded
        </p>
      ) : null}
    </>
  );
}

function ManualPaymentActions({
  whatsappUrl,
  saving,
  uploading,
  manualSubmitted,
  handleSubmit,
}) {
  return (
    <>
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
          onClick={
            handleSubmit
          }
          disabled={
            saving ||
            uploading
          }
          className="rounded-full border border-white/20 bg-[#b30018] px-8 py-4 font-black text-white transition hover:bg-[#8f0013] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving
            ? "Submitting..."
            : "Submit Payment for Verification"}
        </button>
      </div>

      {manualSubmitted ? (
        <div className="mt-6 rounded-2xl bg-green-100 p-5 font-bold text-green-800">
          Payment submitted successfully. Your
          booking remains pending until the
          transaction is manually verified.
        </div>
      ) : null}

      <p className="mt-5 text-center text-sm leading-6 text-white/65">
        Only submit after making the payment.
        Manual payments remain pending until
        Delly&apos;s Matchups verifies the
        transaction. Your booking is not marked
        paid automatically.
      </p>
    </>
  );
}

export default function CounsellingPaymentPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[#b30018] text-white">
          Loading payment page...
        </main>
      }
    >
      <CounsellingPaymentContent />
    </Suspense>
  );
}
