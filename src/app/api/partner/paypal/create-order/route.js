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

const PARTNERSHIP_TYPES = new Set([
  "Monthly Support",
  "Project Partnership",
  "Corporate Partnership",
]);

function getRequiredEnvironmentVariable(value, name) {
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

  return Number(amount.toFixed(2));
}

async function parsePayPalResponse(response) {
  const text = await response.text();

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

  const authorization = Buffer.from(
    `${clientId}:${clientSecret}`,
  ).toString("base64");

  const response = await fetch(
    `${PAYPAL_API_BASE}/v1/oauth2/token`,
    {
      method: "POST",
      headers: {
        Authorization:
          `Basic ${authorization}`,
        "Content-Type":
          "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
      cache: "no-store",
    },
  );

  const data =
    await parsePayPalResponse(response);

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

  if (!data.access_token) {
    throw new Error(
      "PayPal did not return an access token.",
    );
  }

  return data.access_token;
}

export async function POST(request) {
  try {
    const body =
      await request.json();

    const customerName =
      getString(body.customerName);

    const customerEmail =
      normalizeEmail(
        body.customerEmail,
      );

    const country =
      getString(body.country);

    const postalCode =
      getString(body.postalCode);

    const customerPhone =
      getString(body.customerPhone);

    const organization =
      getString(body.organization);

    const partnershipType =
      getString(body.partnershipType);

    const notes =
      getString(body.notes);

    const supportAmount =
      normalizeSupportAmount(
        body.amount,
      );

    if (!customerName) {
      return NextResponse.json(
        {
          error:
            "Partner name is required.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      !isValidEmail(
        customerEmail,
      )
    ) {
      return NextResponse.json(
        {
          error:
            "A valid partner email is required.",
        },
        {
          status: 400,
        },
      );
    }

    if (!country) {
      return NextResponse.json(
        {
          error:
            "Country is required.",
        },
        {
          status: 400,
        },
      );
    }

    if (!postalCode) {
      return NextResponse.json(
        {
          error:
            "Postal / ZIP code is required.",
        },
        {
          status: 400,
        },
      );
    }

    if (!customerPhone) {
      return NextResponse.json(
        {
          error:
            "Phone number is required.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      !PARTNERSHIP_TYPES.has(
        partnershipType,
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid partnership type.",
        },
        {
          status: 400,
        },
      );
    }

    if (supportAmount === null) {
      return NextResponse.json(
        {
          error:
            `Support amount must be between $${MIN_SUPPORT_AMOUNT} and $${MAX_SUPPORT_AMOUNT}.`,
        },
        {
          status: 400,
        },
      );
    }

    if (
      organization.length > 200
    ) {
      return NextResponse.json(
        {
          error:
            "Organization name is too long.",
        },
        {
          status: 400,
        },
      );
    }

    if (notes.length > 1000) {
      return NextResponse.json(
        {
          error:
            "Partnership note is too long.",
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
          body: JSON.stringify({
            intent: "CAPTURE",
            purchase_units: [
              {
                reference_id:
                  checkoutReference,
                description:
                  `Delly's Matchups - ${partnershipType}`,
                custom_id:
                  JSON.stringify({
                    purpose:
                      "partner",
                    partnershipType,
                    checkoutReference,
                    customerEmail,
                  }),
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
          }),
          cache: "no-store",
        },
      );

    const paypalData =
      await parsePayPalResponse(
        paypalResponse,
      );

    if (!paypalResponse.ok) {
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

    const supabaseAdmin =
      createSupabaseAdmin();

    const paymentNotes = [
      `Organization: ${organization || "N/A"}`,
      `Country: ${country}`,
      `Postal / ZIP Code: ${postalCode}`,
      `Phone: ${customerPhone}`,
      `Partnership Type: ${partnershipType}`,
      `Checkout Reference: ${checkoutReference}`,
      notes
        ? `Partner Note: ${notes}`
        : "",
    ]
      .filter(Boolean)
      .join("\n");

    const {
      data: payment,
      error: paymentError,
    } = await supabaseAdmin
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
