// src/app/api/partner/manual-payment/route.js

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL;

const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY;

const PARTNER_CURRENCY = "USD";

const MIN_SUPPORT_AMOUNT = 1;
const MAX_SUPPORT_AMOUNT = 100000;

const PARTNERSHIP_TYPES = new Set([
  "Monthly Support",
  "Project Partnership",
  "Corporate Partnership",
]);

const ALLOWED_PAYMENT_METHODS = [
  "Mobile Money",
  "Bank Transfer",
];

const FIELD_LIMITS = {
  customerName: 200,
  customerEmail: 320,
  country: 150,
  postalCode: 50,
  customerPhone: 100,
  organization: 200,
  transactionReference: 200,
  proofUrl: 2000,
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

function normalizeSupportAmount(
  value,
) {
  const amount =
    Number(value);

  if (
    !Number.isFinite(amount) ||
    amount < MIN_SUPPORT_AMOUNT ||
    amount > MAX_SUPPORT_AMOUNT
  ) {
    return null;
  }

  const cents =
    Math.round(
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

function isValidProofUrl(
  value,
) {
  if (!value) {
    return true;
  }

  try {
    const url =
      new URL(value);

    return (
      url.protocol ===
      "https:"
    );
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
      leftNumber -
        rightNumber,
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

  const line =
    notes
      .split("\n")
      .map((item) =>
        item.trim(),
      )
      .find((item) =>
        item.startsWith(
          prefix,
        ),
      );

  return line
    ? line
        .slice(
          prefix.length,
        )
        .trim()
    : "";
}

function validatePartnerInput({
  customerName,
  customerEmail,
  country,
  postalCode,
  customerPhone,
  organization,
  partnershipType,
  paymentMethod,
  transactionReference,
  proofUrl,
  notes,
}) {
  if (!customerName) {
    return "Partner name is required.";
  }

  if (
    customerName.length >
    FIELD_LIMITS.customerName
  ) {
    return "Partner name is too long.";
  }

  if (
    !isValidEmail(
      customerEmail,
    )
  ) {
    return "A valid partner email is required.";
  }

  if (
    customerEmail.length >
    FIELD_LIMITS.customerEmail
  ) {
    return "Partner email is too long.";
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
    !PARTNERSHIP_TYPES.has(
      partnershipType,
    )
  ) {
    return "Invalid partnership type.";
  }

  if (
    !ALLOWED_PAYMENT_METHODS.includes(
      paymentMethod,
    )
  ) {
    return "Payment method must be Mobile Money or Bank Transfer.";
  }

  if (
    organization.length >
    FIELD_LIMITS.organization
  ) {
    return "Organization name is too long.";
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
    return "Partnership note is too long.";
  }

  return null;
}

function buildPaymentNotes({
  organization,
  country,
  postalCode,
  customerPhone,
  partnershipType,
  transactionReference,
  notes,
  isNativeApp,
}) {
  return [
    `Organization: ${organization || "N/A"}`,
    `Country: ${country}`,
    `Postal / ZIP Code: ${postalCode}`,
    `Phone: ${customerPhone}`,
    `Partnership Type: ${partnershipType}`,
    `Transaction Reference: ${transactionReference}`,

    isNativeApp
      ? "Checkout Channel: Native App"
      : "Checkout Channel: Website",

    partnershipType ===
      "Monthly Support"
      ? "Payment Frequency: One-time"
      : "",

    notes
      ? `Partner Note: ${notes}`
      : "",
  ]
    .filter(Boolean)
    .join("\n");
}

function handleExistingPayment({
  existingPayments,
  customerName,
  customerEmail,
  organization,
  partnershipType,
  paymentMethod,
  transactionReference,
  supportAmount,
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
      "PARTNER DUPLICATE TRANSACTION REFERENCES:",
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
          "This transaction reference is associated with multiple partnership payment records. Please contact support.",
      },
      {
        status: 409,
      },
    );
  }

  const existing =
    existingPayments[0];

  if (
    existing.status ===
    "paid"
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

  const storedPartnershipType =
    getNoteValue(
      existing.notes,
      "Partnership Type",
    );

  const storedOrganization =
    getNoteValue(
      existing.notes,
      "Organization",
    );

  const expectedOrganization =
    organization || "N/A";

  const sameSubmission =
    getString(
      existing.customer_name,
    ) ===
      customerName &&
    normalizeEmail(
      existing.customer_email,
    ) ===
      customerEmail &&
    existing.item_name ===
      partnershipType &&
    storedPartnershipType ===
      partnershipType &&
    storedOrganization ===
      expectedOrganization &&
    existing.payment_method ===
      paymentMethod &&
    existing.provider_reference ===
      transactionReference &&
    existing.currency ===
      PARTNER_CURRENCY &&
    amountsMatch(
      existing.amount,
      supportAmount,
    ) &&
    existing.status ===
      "pending_confirmation";

  if (
    !sameSubmission
  ) {
    return NextResponse.json(
      {
        error:
          "That transaction reference has already been used for another partnership payment.",
      },
      {
        status: 409,
      },
    );
  }

  return NextResponse.json({
    success: true,

    alreadySubmitted:
      true,

    status:
      "pending_confirmation",

    paymentId:
      existing.id,

    partnershipType:
      existing.item_name,

    amount:
      Number(
        existing.amount,
      ),

    currency:
      PARTNER_CURRENCY,

    paymentMethod:
      existing.payment_method,

    recurring:
      false,
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

    const organization =
      getString(
        body.organization,
      );

    const partnershipType =
      getString(
        body.partnershipType,
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

    const supportAmount =
      normalizeSupportAmount(
        body.amount,
      );

    const validationError =
      validatePartnerInput({
        customerName,
        customerEmail,
        country,
        postalCode,
        customerPhone,
        organization,
        partnershipType,
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
      supportAmount === null
    ) {
      return NextResponse.json(
        {
          error:
            `Support amount must be between $${MIN_SUPPORT_AMOUNT} and $${MAX_SUPPORT_AMOUNT} and contain no more than two decimal places.`,
        },
        {
          status: 400,
        },
      );
    }

    const supabaseAdmin =
      createSupabaseAdmin();

    const {
      data:
        existingPayments,
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
          "partner",
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
        "PARTNER MANUAL DUPLICATE LOOKUP ERROR:",
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
      handleExistingPayment({
        existingPayments,
        customerName,
        customerEmail,
        organization,
        partnershipType,
        paymentMethod,
        transactionReference,
        supportAmount,
      });

    if (
      existingResponse
    ) {
      return existingResponse;
    }

    const paymentNotes =
      buildPaymentNotes({
        organization,
        country,
        postalCode,
        customerPhone,
        partnershipType,
        transactionReference,
        notes,
        isNativeApp,
      });

    const {
      data: payment,
      error:
        paymentError,
    } =
      await supabaseAdmin
        .from("payments")
        .insert({
          customer_name:
            customerName,

          customer_email:
            customerEmail,

          purpose:
            "partner",

          item_name:
            partnershipType,

          amount:
            supportAmount,

          currency:
            PARTNER_CURRENCY,

          payment_method:
            paymentMethod,

          status:
            "pending_confirmation",

          provider_reference:
            transactionReference,

          proof_url:
            proofUrl || null,

          notes:
            paymentNotes,
        })
        .select(
          "id,status,item_name,amount,currency,payment_method",
        )
        .single();

    if (
      paymentError
    ) {
      console.error(
        "PARTNER MANUAL PAYMENT INSERT ERROR:",
        paymentError,
      );

      return NextResponse.json(
        {
          error:
            "Unable to save the partnership payment submission.",
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
            "Partnership payment record was not returned.",
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
            "Partnership payment was saved with an unexpected status.",
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

        partnershipType:
          payment.item_name,

        amount:
          Number(
            payment.amount,
          ),

        currency:
          payment.currency,

        paymentMethod:
          payment.payment_method,

        channel:
          isNativeApp
            ? "app"
            : "web",

        recurring:
          false,
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    console.error(
      "PARTNER MANUAL PAYMENT ERROR:",
      error,
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to submit the partnership payment.",
      },
      {
        status: 500,
      },
    );
  }
}
