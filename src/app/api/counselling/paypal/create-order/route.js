// src/app/api/counselling/paypal/create-order/route.js
// ============================================================

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

const COUNSELLING_SESSIONS = {
  individual: {
    title: "Individual Session",
    price: 100,
  },
  couple: {
    title: "Couple Session",
    price: 250,
  },
  international_individual: {
    title: "International Individual Session",
    price: 100,
  },
  international_couple: {
    title: "International Couple Session",
    price: 250,
  },
};

const BOOKING_SERVICE_ALIASES = {
  individual: "individual",
  "individual session": "individual",

  couple: "couple",
  "couple session": "couple",

  international_individual:
    "international_individual",
  "international individual":
    "international_individual",
  "international individual session":
    "international_individual",

  international_couple:
    "international_couple",
  "international couple":
    "international_couple",
  "international couple session":
    "international_couple",
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

function getString(value) {
  return typeof value === "string"
    ? value.trim()
    : "";
}

function normalizeEmail(value) {
  return getString(value).toLowerCase();
}

function normalizeService(value) {
  return getString(value)
    .toLowerCase()
    .replace(/[-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    value,
  );
}

function isValidSessionType(value) {
  return (
    typeof value === "string" &&
    Object.prototype.hasOwnProperty.call(
      COUNSELLING_SESSIONS,
      value,
    )
  );
}

function resolveBookingSessionType(service) {
  const rawService =
    getString(service);

  if (!rawService) {
    return null;
  }

  if (
    isValidSessionType(
      rawService,
    )
  ) {
    return rawService;
  }

  return (
    BOOKING_SERVICE_ALIASES[
      normalizeService(rawService)
    ] || null
  );
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
    return {
      message:
        "PayPal returned an invalid response.",
    };
  }
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
    await parseJsonResponse(
      response,
    );

  if (!response.ok) {
    console.error(
      "COUNSELLING PAYPAL AUTH ERROR:",
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

    const bookingId =
      getString(
        body.bookingId,
      );

    const requestedSessionType =
      getString(
        body.sessionType,
      );

    if (!bookingId) {
      return NextResponse.json(
        {
          error:
            "Booking ID is required.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      !isValidSessionType(
        requestedSessionType,
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid counselling session type.",
        },
        {
          status: 400,
        },
      );
    }

    const supabaseAdmin =
      createSupabaseAdmin();

    const {
      data: booking,
      error: bookingError,
    } = await supabaseAdmin
      .from(
        "counselling_bookings",
      )
      .select(
        "id,full_name,email,service,preferred_date,payment_status",
      )
      .eq(
        "id",
        bookingId,
      )
      .maybeSingle();

    if (bookingError) {
      console.error(
        "COUNSELLING BOOKING LOOKUP ERROR:",
        bookingError,
      );

      return NextResponse.json(
        {
          error:
            "Unable to load counselling booking.",
        },
        {
          status: 500,
        },
      );
    }

    if (!booking) {
      return NextResponse.json(
        {
          error:
            "Counselling booking was not found.",
        },
        {
          status: 404,
        },
      );
    }

    if (
      booking.payment_status ===
      "paid"
    ) {
      return NextResponse.json(
        {
          error:
            "This counselling booking has already been paid.",
        },
        {
          status: 409,
        },
      );
    }

    const bookingSessionType =
      resolveBookingSessionType(
        booking.service,
      );

    if (!bookingSessionType) {
      console.error(
        "COUNSELLING UNKNOWN BOOKING SERVICE:",
        {
          bookingId:
            booking.id,
          service:
            booking.service,
        },
      );

      return NextResponse.json(
        {
          error:
            "The counselling booking service could not be matched to a valid payment option. Please contact support before paying.",
        },
        {
          status: 409,
        },
      );
    }

    if (
      requestedSessionType !==
      bookingSessionType
    ) {
      console.error(
        "COUNSELLING SESSION TYPE MISMATCH:",
        {
          bookingId,
          requestedSessionType,
          bookingSessionType,
          bookingService:
            booking.service,
        },
      );

      return NextResponse.json(
        {
          error:
            "The selected counselling session does not match this booking. Please return to your booking and use the correct payment link.",
        },
        {
          status: 409,
        },
      );
    }

    const sessionType =
      bookingSessionType;

    const session =
      COUNSELLING_SESSIONS[
        sessionType
      ];

    const customerName =
      getString(
        booking.full_name,
      );

    const customerEmail =
      normalizeEmail(
        booking.email,
      );

    if (!customerName) {
      return NextResponse.json(
        {
          error:
            "The counselling booking does not contain a customer name.",
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
            "The counselling booking does not contain a valid customer email.",
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

    const customMetadata =
      JSON.stringify({
        purpose:
          "counselling",
        bookingId,
        sessionType,
        checkoutReference,
        customerEmail,
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
              `counselling-${checkoutReference}`,
          },
          body: JSON.stringify({
            intent:
              "CAPTURE",
            purchase_units: [
              {
                reference_id:
                  checkoutReference,
                description:
                  `DMs Counselling - ${session.title}`,
                custom_id:
                  customMetadata,
                amount: {
                  currency_code:
                    "USD",
                  value:
                    session.price.toFixed(
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
      await parseJsonResponse(
        paypalResponse,
      );

    if (
      !paypalResponse.ok
    ) {
      console.error(
        "COUNSELLING PAYPAL CREATE ERROR:",
        paypalData,
      );

      return NextResponse.json(
        {
          error:
            paypalData.message ||
            paypalData.error_description ||
            "Unable to create PayPal counselling order.",
        },
        {
          status: 502,
        },
      );
    }

    if (
      typeof paypalData.id !==
        "string" ||
      !paypalData.id.trim()
    ) {
      console.error(
        "COUNSELLING PAYPAL ORDER MISSING ID:",
        paypalData,
      );

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

    const orderId =
      paypalData.id.trim();

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
          "counselling",
        item_name:
          `Counselling - ${session.title}`,
        amount:
          session.price,
        currency:
          "USD",
        payment_method:
          "PayPal / Card",
        status:
          "pending",
        provider_reference:
          orderId,
        proof_url:
          null,
        notes: [
          `Booking ID: ${bookingId}`,
          `Session Type: ${sessionType}`,
          `Checkout Reference: ${checkoutReference}`,
        ].join("\n"),
      })
      .select("id")
      .single();

    if (paymentError) {
      console.error(
        "COUNSELLING PAYMENT INSERT ERROR:",
        paymentError,
      );

      return NextResponse.json(
        {
          error:
            "Unable to create the counselling payment record.",
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
            "Counselling payment record was not returned.",
        },
        {
          status: 500,
        },
      );
    }

    return NextResponse.json(
      {
        success: true,
        orderId,
        paymentId:
          payment.id,
        bookingId,
        sessionType,
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    console.error(
      "COUNSELLING CREATE ORDER ERROR:",
      error,
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to create counselling PayPal order.",
      },
      {
        status: 500,
      },
    );
  }
}
