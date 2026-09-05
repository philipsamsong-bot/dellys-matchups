// src/app/api/academy/paypal/create-order/route.js

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

const APP_PAYPAL_RETURN_URL =
  "dellysmatchups://paypal/academy-return";

const APP_PAYPAL_CANCEL_URL =
  "dellysmatchups://paypal/academy-cancel";

const ACADEMY_COURSES = {
  "full-academy": {
    title: "Full Academy Programme",
    price: 500,
  },
  "module-1": {
    title: "Module 1: Counselling 101",
    price: 100,
  },
  "module-2": {
    title: "Module 2: Counselling 102",
    price: 100,
  },
  "module-3": {
    title: "Module 3: Counselling 103",
    price: 100,
  },
  "module-4": {
    title:
      "Module 4: Leadership & Influence",
    price: 100,
  },
  "module-5": {
    title:
      "Module 5: Healing & Restoration",
    price: 100,
  },
  "module-6": {
    title:
      "Module 6: Master Classes",
    price: 100,
  },
  "module-7": {
    title:
      "Module 7: Virginity 101",
    price: 100,
  },
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

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    value,
  );
}

function isAcademyCourseKey(value) {
  return (
    typeof value === "string" &&
    Object.prototype.hasOwnProperty.call(
      ACADEMY_COURSES,
      value,
    )
  );
}

function isAppChannel(value) {
  return getString(value).toLowerCase() === "app";
}

async function parsePayPalResponse(
  response,
) {
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

function getApprovalUrl(paypalData) {
  if (!Array.isArray(paypalData?.links)) {
    return "";
  }

  const approvalLink =
    paypalData.links.find(
      (link) =>
        link &&
        typeof link.href === "string" &&
        (
          link.rel === "approve" ||
          link.rel === "payer-action"
        ),
    );

  return approvalLink?.href?.trim() || "";
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

  const auth = Buffer.from(
    `${clientId}:${clientSecret}`,
  ).toString("base64");

  const response = await fetch(
    `${PAYPAL_API_BASE}/v1/oauth2/token`,
    {
      method: "POST",
      headers: {
        Authorization:
          `Basic ${auth}`,
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
      "ACADEMY PAYPAL AUTH ERROR:",
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

function buildPayPalOrderPayload({
  checkoutReference,
  courseKey,
  course,
  customerEmail,
  appChannel,
}) {
  const payload = {
    intent: "CAPTURE",
    purchase_units: [
      {
        reference_id:
          checkoutReference,
        description:
          `Delly's Matchups Academy - ${course.title}`,
        custom_id:
          JSON.stringify({
            purpose: "academy",
            checkoutReference,
            courseKey,
            customerEmail,
            channel:
              appChannel
                ? "app"
                : "web",
          }),
        amount: {
          currency_code: "USD",
          value:
            course.price.toFixed(2),
        },
      },
    ],
  };

  if (appChannel) {
    payload.application_context = {
      return_url:
        APP_PAYPAL_RETURN_URL,
      cancel_url:
        APP_PAYPAL_CANCEL_URL,
      user_action: "PAY_NOW",
    };
  }

  return payload;
}

export async function POST(request) {
  try {
    const body =
      await request.json();

    if (
      !isAcademyCourseKey(
        body.courseKey,
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid Academy course.",
        },
        {
          status: 400,
        },
      );
    }

    const courseKey =
      body.courseKey;

    const course =
      ACADEMY_COURSES[
        courseKey
      ];

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

    const phone =
      getString(
        body.phone,
      );

    const appChannel =
      isAppChannel(
        body.channel,
      );

    if (!customerName) {
      return NextResponse.json(
        {
          error:
            "Customer name is required.",
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
            "A valid customer email is required.",
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

    if (!phone) {
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

    const checkoutReference =
      randomUUID();

    const accessToken =
      await getPayPalAccessToken();

    const paypalPayload =
      buildPayPalOrderPayload({
        checkoutReference,
        courseKey,
        course,
        customerEmail,
        appChannel,
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
              `academy-${checkoutReference}`,
          },
          body:
            JSON.stringify(
              paypalPayload,
            ),
          cache:
            "no-store",
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
        "ACADEMY PAYPAL CREATE RESPONSE ERROR:",
        paypalData,
      );

      return NextResponse.json(
        {
          error:
            paypalData.message ||
            paypalData.error_description ||
            "Unable to create PayPal Academy order.",
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
        "ACADEMY PAYPAL CREATE MISSING ID:",
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

    const approvalUrl =
      getApprovalUrl(
        paypalData,
      );

    if (
      appChannel &&
      !approvalUrl
    ) {
      console.error(
        "ACADEMY PAYPAL CREATE MISSING APPROVAL URL:",
        paypalData,
      );

      return NextResponse.json(
        {
          error:
            "PayPal did not return an approval URL.",
        },
        {
          status: 502,
        },
      );
    }

    const supabaseAdmin =
      createSupabaseAdmin();

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
          "academy",
        item_name:
          course.title,
        amount:
          course.price,
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
          `Course Key: ${courseKey}`,
          `Checkout Reference: ${checkoutReference}`,
          `Country: ${country}`,
          `Phone: ${phone}`,
          `Channel: ${
            appChannel
              ? "app"
              : "web"
          }`,
        ].join("\n"),
      })
      .select("id")
      .single();

    if (paymentError) {
      console.error(
        "ACADEMY PAYMENT INSERT ERROR:",
        paymentError,
      );

      return NextResponse.json(
        {
          error:
            "Unable to create the Academy payment record.",
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
            "Academy payment record was not returned.",
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
        courseKey,
        approvalUrl:
          approvalUrl || undefined,
        channel:
          appChannel
            ? "app"
            : "web",
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    console.error(
      "ACADEMY CREATE ORDER ERROR:",
      error,
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to create Academy PayPal order.",
      },
      {
        status: 500,
      },
    );
  }
}
