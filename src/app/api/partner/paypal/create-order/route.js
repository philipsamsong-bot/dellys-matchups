// src/app/api/partner/paypal/create-order/route.js

import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const PAYPAL_API_BASE =
  process.env.PAYPAL_API_BASE ||
  "https://api-m.paypal.com";

const PAYPAL_CLIENT_ID =
  process.env.PAYPAL_CLIENT_ID;

const PAYPAL_CLIENT_SECRET =
  process.env.PAYPAL_CLIENT_SECRET;

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL;

const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY;

const PARTNER_CURRENCY = "USD";

const MIN_SUPPORT_AMOUNT = 1;
const MAX_SUPPORT_AMOUNT = 100000;

const APP_RETURN_URL =
  "dellysmatchups://paypal/partner-return";

const APP_CANCEL_URL =
  "dellysmatchups://paypal/partner-cancel";

const PARTNERSHIP_TYPES = new Set([
  "Monthly Support",
  "Project Partnership",
  "Corporate Partnership",
]);

const FIELD_LIMITS = {
  customerName: 200,
  customerEmail: 320,
  country: 150,
  postalCode: 50,
  customerPhone: 100,
  organization: 200,
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

function normalizeSupportAmount(value) {
  const amount = Number(value);

  if (
    !Number.isFinite(amount) ||
    amount < MIN_SUPPORT_AMOUNT ||
    amount > MAX_SUPPORT_AMOUNT
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

function validatePartnerFields({
  customerName,
  customerEmail,
  country,
  postalCode,
  customerPhone,
  organization,
  partnershipType,
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
    organization.length >
    FIELD_LIMITS.organization
  ) {
    return "Organization name is too long.";
  }

  if (
    notes.length >
    FIELD_LIMITS.notes
  ) {
    return "Partnership note is too long.";
  }

  return null;
}

async function parsePayPalResponse(
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
    return {
      message:
        "PayPal returned an invalid response.",
    };
  }
}

async function getPayPalAccessToken() {
  const clientId =
    getRequiredEnvironmentVariable(
      PAYPAL_CLIENT_ID,
      "PAYPAL_CLIENT_ID",
    );

  const clientSecret =
    getRequiredEnvironmentVariable(
      PAYPAL_CLIENT_SECRET,
      "PAYPAL_CLIENT_SECRET",
    );

  const authorization =
    Buffer.from(
      `${clientId}:${clientSecret}`,
    ).toString("base64");

  const response =
    await fetch(
      `${PAYPAL_API_BASE}/v1/oauth2/token`,
      {
        method: "POST",

        headers: {
          Authorization:
            `Basic ${authorization}`,

          "Content-Type":
            "application/x-www-form-urlencoded",
        },

        body:
          "grant_type=client_credentials",

        cache: "no-store",
      },
    );

  const data =
    await parsePayPalResponse(
      response,
    );

  if (!response.ok) {
    console.error(
      "PARTNER PAYPAL AUTH ERROR:",
      data,
    );

    throw new Error(
      data.error_description ||
        data.message ||
        "Unable to authenticate with PayPal.",
    );
  }

  const accessToken =
    getString(
      data.access_token,
    );

  if (!accessToken) {
    throw new Error(
      "PayPal did not return an access token.",
    );
  }

  return accessToken;
}

function findApprovalUrl(
  paypalData,
) {
  const links =
    Array.isArray(
      paypalData?.links,
    )
      ? paypalData.links
      : [];

  const approvalLink =
    links.find(
      (link) =>
        (
          link?.rel === "approve" ||
          link?.rel === "payer-action"
        ) &&
        typeof link?.href === "string" &&
        link.href.trim(),
    );

  return (
    approvalLink?.href?.trim() ||
    ""
  );
}

function createPayPalPayload({
  checkoutReference,
  partnershipType,
  supportAmount,
  isNativeApp,
}) {
  const payload = {
    intent: "CAPTURE",

    purchase_units: [
      {
        reference_id:
          checkoutReference,

        description:
          `Delly's Matchups - ${partnershipType}`.slice(
            0,
            127,
          ),

        custom_id:
          checkoutReference,

        amount: {
          currency_code:
            PARTNER_CURRENCY,

          value:
            supportAmount.toFixed(
              2,
            ),
        },
      },
    ],
  };

  if (isNativeApp) {
    payload.payment_source = {
      paypal: {
        experience_context: {
          user_action:
            "PAY_NOW",

          return_url:
            APP_RETURN_URL,

          cancel_url:
            APP_CANCEL_URL,
        },
      },
    };
  }

  return payload;
}

function buildPaymentNotes({
  organization,
  country,
  postalCode,
  customerPhone,
  partnershipType,
  checkoutReference,
  notes,
  isNativeApp,
}) {
  return [
    `Organization: ${organization || "N/A"}`,
    `Country: ${country}`,
    `Postal / ZIP Code: ${postalCode}`,
    `Phone: ${customerPhone}`,
    `Partnership Type: ${partnershipType}`,
    `Checkout Reference: ${checkoutReference}`,

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

    const notes =
      getString(
        body.notes,
      );

    const supportAmount =
      normalizeSupportAmount(
        body.amount,
      );

    const validationError =
      validatePartnerFields({
        customerName,
        customerEmail,
        country,
        postalCode,
        customerPhone,
        organization,
        partnershipType,
        notes,
      });

    if (validationError) {
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

    const checkoutReference =
      randomUUID();

    const accessToken =
      await getPayPalAccessToken();

    const paypalPayload =
      createPayPalPayload({
        checkoutReference,
        partnershipType,
        supportAmount,
        isNativeApp,
      });

    const paypalResponse =
      await fetch(
        `${PAYPAL_API_BASE}/v2/checkout/orders`,
        {
          method: "POST",

          headers: {
            Authorization:
              `Bearer ${accessToken}`,

            "Content-Type":
              "application/json",

            Prefer:
              "return=representation",

            "PayPal-Request-Id":
              `partner-${checkoutReference}`,
          },

          body:
            JSON.stringify(
              paypalPayload,
            ),

          cache: "no-store",
        },
      );

    const paypalData =
      await parsePayPalResponse(
        paypalResponse,
      );

    if (
      !paypalResponse.ok
    ) {
      console.error(
        "PARTNER PAYPAL CREATE ERROR:",
        paypalData,
      );

      return NextResponse.json(
        {
          error:
            paypalData.message ||
            paypalData.error_description ||
            "Unable to create PayPal partnership payment.",
        },
        {
          status: 502,
        },
      );
    }

    const paypalOrderId =
      getString(
        paypalData.id,
      );

    if (!paypalOrderId) {
      return NextResponse.json(
        {
          error:
            "PayPal did not return an order ID.",
        },
        {
          status: 502,
        },
      );
    }

    const approvalUrl =
      findApprovalUrl(
        paypalData,
      );

    if (
      isNativeApp &&
      !approvalUrl
    ) {
      console.error(
        "PARTNER PAYPAL APPROVAL URL MISSING:",
        paypalData,
      );

      return NextResponse.json(
        {
          error:
            "PayPal did not return an approval URL for the app.",
        },
        {
          status: 502,
        },
      );
    }

    const supabaseAdmin =
      createSupabaseAdmin();

    const paymentNotes =
      buildPaymentNotes({
        organization,
        country,
        postalCode,
        customerPhone,
        partnershipType,
        checkoutReference,
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
            "partner",

          item_name:
            partnershipType,

          amount:
            supportAmount,

          currency:
            PARTNER_CURRENCY,

          payment_method:
            "PayPal / Card",

          status:
            "pending",

          provider_reference:
            paypalOrderId,

          proof_url:
            null,

          notes:
            paymentNotes,
        })
        .select("id")
        .single();

    if (paymentError) {
      console.error(
        "PARTNER PAYMENT INSERT ERROR:",
        paymentError,
      );

      return NextResponse.json(
        {
          error:
            "PayPal order was created, but the partnership payment record could not be saved. Please do not retry payment and contact support.",
        },
        {
          status: 500,
        },
      );
    }

    if (!payment?.id) {
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

    return NextResponse.json(
      {
        success: true,

        orderId:
          paypalOrderId,

        paypalOrderId,

        paymentId:
          payment.id,

        partnershipType,

        amount:
          supportAmount,

        currency:
          PARTNER_CURRENCY,

        channel:
          isNativeApp
            ? "app"
            : "web",

        approvalUrl:
          approvalUrl ||
          null,

        recurring:
          false,
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    console.error(
      "PARTNER PAYPAL CREATE ERROR:",
      error,
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to create partnership PayPal payment.",
      },
      {
        status: 500,
      },
    );
  }
}
