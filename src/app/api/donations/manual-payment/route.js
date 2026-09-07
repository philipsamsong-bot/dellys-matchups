// src/app/api/donations/manual-payment/route.js

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL;

const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY;

const DONATION_CURRENCY = "USD";

const MIN_DONATION_AMOUNT = 1;

const MAX_DONATION_AMOUNT = 100000;

const ALLOWED_PAYMENT_METHODS = [
  "Mobile Money",
  "Bank Transfer",
];

const DONATION_PURPOSES = new Set([
  "Delly Singah Foundation",
  "Tips",
  "Other Purpose",
]);

const FIELD_LIMITS = {
  customerName: 200,
  customerEmail: 320,
  country: 150,
  postalCode: 50,
  customerPhone: 100,
  transactionReference: 200,
  proofUrl: 2000,
  otherPurpose: 200,
  notes: 1000,
};

function getRequiredEnvironmentVariable(
  value,
  name,
) {
  if (!value) {
    throw new Error(
      `Missing environment variable: ${name}`,
    );
  }

  return value;
}

function createSupabaseAdmin() {
  return createClient(
    getRequiredEnvironmentVariable(
      SUPABASE_URL,
      "NEXT_PUBLIC_SUPABASE_URL",
    ),
    getRequiredEnvironmentVariable(
      SUPABASE_SERVICE_ROLE_KEY,
      "SUPABASE_SERVICE_ROLE_KEY",
    ),
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}

function getString(value) {
  return typeof value === "string"
    ? value.trim()
    : "";
}

function normalizeEmail(value) {
  return getString(value).toLowerCase();
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    value,
  );
}

function normalizeDonationAmount(
  value,
) {
  const amount = Number(value);

  if (
    !Number.isFinite(amount) ||
    amount < MIN_DONATION_AMOUNT ||
    amount > MAX_DONATION_AMOUNT
  ) {
    return null;
  }

  const cents = Math.round(
    amount * 100,
  );

  const normalized =
    cents / 100;

  if (
    Math.abs(
      amount - normalized,
    ) > 0.0000001
  ) {
    return null;
  }

  return normalized;
}

function isValidProofUrl(value) {
  if (!value) {
    return true;
  }

  try {
    const url = new URL(value);

    return url.protocol === "https:";
  } catch {
    return false;
  }
}

function amountsMatch(
  left,
  right,
) {
  const leftNumber =
    Number(left);

  const rightNumber =
    Number(right);

  if (
    !Number.isFinite(leftNumber) ||
    !Number.isFinite(rightNumber)
  ) {
    return false;
  }

  return (
    Math.abs(
      leftNumber - rightNumber,
    ) < 0.001
  );
}

function getNoteValue(
  notes,
  label,
) {
  if (
    !notes ||
    typeof notes !== "string"
  ) {
    return "";
  }

  const prefix =
    `${label}:`;

  const line = notes
    .split("\n")
    .map((item) =>
      item.trim(),
    )
    .find((item) =>
      item.startsWith(prefix),
    );

  return line
    ? line
        .slice(
          prefix.length,
        )
        .trim()
    : "";
}

function resolveDonationPurpose({
  donationPurpose,
  otherPurpose,
}) {
  if (
    !DONATION_PURPOSES.has(
      donationPurpose,
    )
  ) {
    return {
      error:
        "Please select a valid donation purpose.",
    };
  }

  if (
    donationPurpose ===
    "Other Purpose"
  ) {
    if (!otherPurpose) {
      return {
        error:
          "Please enter the purpose of your donation.",
      };
    }

    if (
      otherPurpose.length >
      FIELD_LIMITS.otherPurpose
    ) {
      return {
        error:
          "Donation purpose is too long.",
      };
    }

    return {
      donationPurpose,
      purposeLabel:
        otherPurpose,
    };
  }

  return {
    donationPurpose,
    purposeLabel:
      donationPurpose,
  };
}

function validateInput({
  customerName,
  customerEmail,
  country,
  postalCode,
  customerPhone,
  paymentMethod,
  transactionReference,
  proofUrl,
  notes,
}) {
  if (!customerName) {
    return "Donor name is required.";
  }

  if (
    customerName.length >
    FIELD_LIMITS.customerName
  ) {
    return "Donor name is too long.";
  }

  if (
    !isValidEmail(
      customerEmail,
    )
  ) {
    return "A valid donor email is required.";
  }

  if (
    customerEmail.length >
    FIELD_LIMITS.customerEmail
  ) {
    return "Donor email is too long.";
  }

  if (!country) {
    return "Country is required.";
  }

  if (
    country.length >
    FIELD_LIMITS.country
  ) {
    return "Country is too long.";
  }

  if (!postalCode) {
    return "Postal / ZIP code is required.";
  }

  if (
    postalCode.length >
    FIELD_LIMITS.postalCode
  ) {
    return "Postal / ZIP code is too long.";
  }

  if (!customerPhone) {
    return "Phone number is required.";
  }

  if (
    customerPhone.length >
    FIELD_LIMITS.customerPhone
  ) {
    return "Phone number is too long.";
  }

  if (
    !ALLOWED_PAYMENT_METHODS.includes(
      paymentMethod,
    )
  ) {
    return "Payment method must be Mobile Money or Bank Transfer.";
  }

  if (!transactionReference) {
    return "Transaction / payment reference is required.";
  }

  if (
    transactionReference.length >
    FIELD_LIMITS.transactionReference
  ) {
    return "Transaction reference is too long.";
  }

  if (
    proofUrl.length >
    FIELD_LIMITS.proofUrl
  ) {
    return "Payment proof URL is too long.";
  }

  if (
    !isValidProofUrl(
      proofUrl,
    )
  ) {
    return "Payment proof must use a valid HTTPS URL.";
  }

  if (
    notes.length >
    FIELD_LIMITS.notes
  ) {
    return "Donation note is too long.";
  }

  return null;
}

function buildPaymentNotes({
  country,
  postalCode,
  customerPhone,
  transactionReference,
  donationPurpose,
  otherPurpose,
  purposeLabel,
  notes,
  isNativeApp,
}) {
  return [
    `Country: ${country}`,
    `Postal / ZIP Code: ${postalCode}`,
    `Phone: ${customerPhone}`,
    `Transaction Reference: ${transactionReference}`,
    `Donation Purpose: ${donationPurpose}`,
    `Purpose Label: ${purposeLabel}`,

    otherPurpose
      ? `Other Purpose: ${otherPurpose}`
      : "",

    isNativeApp
      ? "Checkout Channel: Native App"
      : "Checkout Channel: Website",

    notes
      ? `Donor Note: ${notes}`
      : "",
  ]
    .filter(Boolean)
    .join("\n");
}

async function handleExistingPayment({
  existingPayments,
  customerName,
  customerEmail,
  donationAmount,
  paymentMethod,
  transactionReference,
  donationPurpose,
  purposeLabel,
}) {
  if (
    !Array.isArray(
      existingPayments,
    ) ||
    existingPayments.length === 0
  ) {
    return null;
  }

  if (
    existingPayments.length > 1
  ) {
    console.error(
      "DONATION DUPLICATE TRANSACTION REFERENCES:",
      {
        transactionReference,
        paymentIds:
          existingPayments.map(
            (payment) =>
              payment.id,
          ),
      },
    );

    return NextResponse.json(
      {
        error:
          "This transaction reference is associated with multiple donation records. Please contact support.",
      },
      {
        status: 409,
      },
    );
  }

  const existing =
    existingPayments[0];

  if (
    existing.status === "paid"
  ) {
    return NextResponse.json(
      {
        error:
          "That transaction reference has already been confirmed as paid.",
      },
      {
        status: 409,
      },
    );
  }

  const storedDonationPurpose =
    getNoteValue(
      existing.notes,
      "Donation Purpose",
    );

  const storedPurposeLabel =
    getNoteValue(
      existing.notes,
      "Purpose Label",
    );

  const sameSubmission =
    getString(
      existing.customer_name,
    ) ===
      customerName &&
    normalizeEmail(
      existing.customer_email,
    ) ===
      customerEmail &&
    existing.payment_method ===
      paymentMethod &&
    existing.provider_reference ===
      transactionReference &&
    existing.currency ===
      DONATION_CURRENCY &&
    amountsMatch(
      existing.amount,
      donationAmount,
    ) &&
    existing.status ===
      "pending_confirmation" &&
    existing.item_name ===
      purposeLabel &&
    storedDonationPurpose ===
      donationPurpose &&
    storedPurposeLabel ===
      purposeLabel;

  if (!sameSubmission) {
    return NextResponse.json(
      {
        error:
          "That transaction reference has already been used for another donation.",
      },
      {
        status: 409,
      },
    );
  }

  return NextResponse.json({
    success: true,

    alreadySubmitted: true,

    status:
      "pending_confirmation",

    paymentId:
      existing.id,

    amount:
      Number(
        existing.amount,
      ),

    currency:
      DONATION_CURRENCY,

    paymentMethod:
      existing.payment_method,

    donationPurpose:
      storedDonationPurpose,

    purposeLabel:
      storedPurposeLabel,
  });
}

export async function POST(
  request,
) {
  try {
    const body =
      await request.json();

    const channel =
      getString(
        body.channel,
      );

    const isNativeApp =
      channel === "app";

    const customerName =
      getString(
        body.customerName,
      );

    const customerEmail =
      normalizeEmail(
        body.customerEmail,
      );

    const country =
      getString(
        body.country,
      );

    const postalCode =
      getString(
        body.postalCode,
      );

    const customerPhone =
      getString(
        body.customerPhone,
      );

    const paymentMethod =
      getString(
        body.paymentMethod,
      );

    const transactionReference =
      getString(
        body.transactionReference,
      );

    const proofUrl =
      getString(
        body.proofUrl,
      );

    const notes =
      getString(
        body.notes,
      );

    const donationPurpose =
      getString(
        body.donationPurpose,
      );

    const otherPurpose =
      getString(
        body.otherPurpose,
      );

    const donationAmount =
      normalizeDonationAmount(
        body.amount,
      );

    const validationError =
      validateInput({
        customerName,
        customerEmail,
        country,
        postalCode,
        customerPhone,
        paymentMethod,
        transactionReference,
        proofUrl,
        notes,
      });

    if (
      validationError
    ) {
      return NextResponse.json(
        {
          error:
            validationError,
        },
        {
          status: 400,
        },
      );
    }

    if (
      donationAmount ===
      null
    ) {
      return NextResponse.json(
        {
          error:
            `Donation amount must be between $${MIN_DONATION_AMOUNT} and $${MAX_DONATION_AMOUNT} and contain no more than two decimal places.`,
        },
        {
          status: 400,
        },
      );
    }

    const purposeResult =
      resolveDonationPurpose({
        donationPurpose,
        otherPurpose,
      });

    if (
      purposeResult.error
    ) {
      return NextResponse.json(
        {
          error:
            purposeResult.error,
        },
        {
          status: 400,
        },
      );
    }

    const purposeLabel =
      purposeResult.purposeLabel;

    const supabaseAdmin =
      createSupabaseAdmin();

    const {
      data: existingPayments,
      error:
        duplicateLookupError,
    } =
      await supabaseAdmin
        .from("payments")
        .select(
          "id,customer_name,customer_email,purpose,item_name,amount,currency,payment_method,status,provider_reference,proof_url,notes",
        )
        .eq(
          "purpose",
          "donation",
        )
        .eq(
          "provider_reference",
          transactionReference,
        )
        .in(
          "payment_method",
          ALLOWED_PAYMENT_METHODS,
        )
        .limit(2);

    if (
      duplicateLookupError
    ) {
      console.error(
        "DONATION MANUAL DUPLICATE LOOKUP ERROR:",
        duplicateLookupError,
      );

      return NextResponse.json(
        {
          error:
            "Unable to verify the transaction reference.",
        },
        {
          status: 500,
        },
      );
    }

    const existingResponse =
      await handleExistingPayment({
        existingPayments,
        customerName,
        customerEmail,
        donationAmount,
        paymentMethod,
        transactionReference,
        donationPurpose,
        purposeLabel,
      });

    if (
      existingResponse
    ) {
      return existingResponse;
    }

    const paymentNotes =
      buildPaymentNotes({
        country,
        postalCode,
        customerPhone,
        transactionReference,
        donationPurpose,
        otherPurpose,
        purposeLabel,
        notes,
        isNativeApp,
      });

    const {
      data: payment,
      error: paymentError,
    } =
      await supabaseAdmin
        .from("payments")
        .insert({
          customer_name:
            customerName,

          customer_email:
            customerEmail,

          purpose:
            "donation",

          item_name:
            purposeLabel,

          amount:
            donationAmount,

          currency:
            DONATION_CURRENCY,

          payment_method:
            paymentMethod,

          status:
            "pending_confirmation",

          provider_reference:
            transactionReference,

          proof_url:
            proofUrl ||
            null,

          notes:
            paymentNotes,
        })
        .select(
          "id,status,amount,currency,payment_method,item_name",
        )
        .single();

    if (
      paymentError
    ) {
      console.error(
        "DONATION MANUAL PAYMENT INSERT ERROR:",
        paymentError,
      );

      return NextResponse.json(
        {
          error:
            "Unable to save the donation payment submission.",
        },
        {
          status: 500,
        },
      );
    }

    if (
      !payment?.id
    ) {
      return NextResponse.json(
        {
          error:
            "Donation payment record was not returned.",
        },
        {
          status: 500,
        },
      );
    }

    if (
      payment.status !==
      "pending_confirmation"
    ) {
      return NextResponse.json(
        {
          error:
            "Donation payment was saved with an unexpected status.",
        },
        {
          status: 500,
        },
      );
    }

    return NextResponse.json(
      {
        success: true,

        alreadySubmitted:
          false,

        status:
          "pending_confirmation",

        paymentId:
          payment.id,

        amount:
          Number(
            payment.amount,
          ),

        currency:
          payment.currency,

        paymentMethod:
          payment.payment_method,

        donationPurpose,

        purposeLabel:
          payment.item_name,

        channel:
          isNativeApp
            ? "app"
            : "web",
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    console.error(
      "DONATION MANUAL PAYMENT ERROR:",
      error,
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to submit the donation.",
      },
      {
        status: 500,
      },
    );
  }
}
