// src/app/api/donations/paypal/capture-order/route.js

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

const DONATION_CURRENCY = "USD";

function getRequiredEnvironmentVariable(value, name) {
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }

  return value;
}

function getString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeEmail(value) {
  return getString(value).toLowerCase();
}

function amountsMatch(left, right) {
  const leftNumber = Number(left);
  const rightNumber = Number(right);

  if (
    !Number.isFinite(leftNumber) ||
    !Number.isFinite(rightNumber)
  ) {
    return false;
  }

  return Math.abs(leftNumber - rightNumber) < 0.001;
}

function getNoteValue(notes, label) {
  if (!notes || typeof notes !== "string") {
    return "";
  }

  const prefix = `${label}:`;

  const line = notes
    .split("\n")
    .map((item) => item.trim())
    .find((item) => item.startsWith(prefix));

  return line
    ? line.slice(prefix.length).trim()
    : "";
}

function parseCustomMetadata(value) {
  if (!value || typeof value !== "string") {
    return null;
  }

  try {
    const parsed = JSON.parse(value);

    return parsed && typeof parsed === "object"
      ? parsed
      : null;
  } catch {
    return null;
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

async function parsePayPalResponse(response) {
  const text = await response.text();

  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text);
  } catch {
    return {
      message: "PayPal returned an invalid response.",
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
        Authorization: `Basic ${authorization}`,
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
      "DONATION PAYPAL AUTH ERROR:",
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

async function getPayPalOrder(
  accessToken,
  orderId,
) {
  const response = await fetch(
    `${PAYPAL_API_BASE}/v2/checkout/orders/${encodeURIComponent(
      orderId,
    )}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    },
  );

  const data =
    await parsePayPalResponse(response);

  if (!response.ok) {
    console.error(
      "DONATION PAYPAL GET ORDER ERROR:",
      data,
    );

    throw new Error(
      data.message ||
        "Unable to retrieve PayPal donation order.",
    );
  }

  return data;
}

async function capturePayPalOrder(
  accessToken,
  orderId,
) {
  const response = await fetch(
    `${PAYPAL_API_BASE}/v2/checkout/orders/${encodeURIComponent(
      orderId,
    )}/capture`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: "{}",
      cache: "no-store",
    },
  );

  const data =
    await parsePayPalResponse(response);

  if (response.ok) {
    return data;
  }

  console.error(
    "DONATION PAYPAL CAPTURE RESPONSE:",
    data,
  );

  const retrievedOrder =
    await getPayPalOrder(
      accessToken,
      orderId,
    );

  if (retrievedOrder.status === "COMPLETED") {
    return retrievedOrder;
  }

  throw new Error(
    data.message ||
      "PayPal could not capture this donation.",
  );
}

function findCompletedCapture(order) {
  const purchaseUnits =
    Array.isArray(order?.purchase_units)
      ? order.purchase_units
      : [];

  for (const purchaseUnit of purchaseUnits) {
    const captures =
      Array.isArray(
        purchaseUnit?.payments?.captures,
      )
        ? purchaseUnit.payments.captures
        : [];

    const capture = captures.find(
      (item) =>
        item?.status === "COMPLETED",
    );

    if (capture) {
      return capture;
    }
  }

  return null;
}

function verifyPayPalDonation({
  order,
  orderId,
  payment,
  checkoutReference,
}) {
  if (!order || order.id !== orderId) {
    throw new Error(
      "PayPal donation order ID verification failed.",
    );
  }

  if (order.status !== "COMPLETED") {
    throw new Error(
      "PayPal donation is not completed.",
    );
  }

  const purchaseUnits =
    Array.isArray(order.purchase_units)
      ? order.purchase_units
      : [];

  if (purchaseUnits.length !== 1) {
    throw new Error(
      "Unexpected PayPal purchase unit count.",
    );
  }

  const purchaseUnit =
    purchaseUnits[0];

  if (
    purchaseUnit.reference_id !==
    checkoutReference
  ) {
    throw new Error(
      "Donation checkout reference verification failed.",
    );
  }

  if (
    purchaseUnit.amount?.currency_code !==
    DONATION_CURRENCY
  ) {
    throw new Error(
      "Donation currency verification failed.",
    );
  }

  if (
    !amountsMatch(
      purchaseUnit.amount?.value,
      payment.amount,
    )
  ) {
    throw new Error(
      "Donation amount verification failed.",
    );
  }

  const metadata =
    parseCustomMetadata(
      purchaseUnit.custom_id,
    );

  if (!metadata) {
    throw new Error(
      "Donation metadata is missing or invalid.",
    );
  }

  if (
    metadata.purpose !==
    "donation"
  ) {
    throw new Error(
      "Donation purpose verification failed.",
    );
  }

  if (
    metadata.checkoutReference !==
    checkoutReference
  ) {
    throw new Error(
      "Donation metadata checkout reference verification failed.",
    );
  }

  if (
    normalizeEmail(
      metadata.customerEmail,
    ) !==
    normalizeEmail(
      payment.customer_email,
    )
  ) {
    throw new Error(
      "Donation donor verification failed.",
    );
  }

  const completedCapture =
    findCompletedCapture(order);

  if (!completedCapture) {
    throw new Error(
      "Completed PayPal donation capture was not found.",
    );
  }

  if (
    completedCapture.amount?.currency_code !==
    DONATION_CURRENCY
  ) {
    throw new Error(
      "Captured donation currency verification failed.",
    );
  }

  if (
    !amountsMatch(
      completedCapture.amount?.value,
      payment.amount,
    )
  ) {
    throw new Error(
      "Captured donation amount verification failed.",
    );
  }

  return {
    captureId:
      completedCapture.id || "",
  };
}

export async function POST(request) {
  try {
    const body =
      await request.json();

    const orderId =
      getString(body.orderId);

    if (!orderId) {
      return NextResponse.json(
        {
          error:
            "PayPal order ID is required.",
        },
        {
          status: 400,
        },
      );
    }

    const supabaseAdmin =
      createSupabaseAdmin();

    const {
      data: payment,
      error: paymentLookupError,
    } = await supabaseAdmin
      .from("payments")
      .select(
        "id,customer_name,customer_email,purpose,item_name,amount,currency,payment_method,status,provider_reference,notes",
      )
      .eq(
        "purpose",
        "donation",
      )
      .eq(
        "provider_reference",
        orderId,
      )
      .maybeSingle();

    if (paymentLookupError) {
      console.error(
        "DONATION PAYMENT LOOKUP ERROR:",
        paymentLookupError,
      );

      return NextResponse.json(
        {
          error:
            "Unable to load the donation payment.",
        },
        {
          status: 500,
        },
      );
    }

    if (!payment) {
      return NextResponse.json(
        {
          error:
            "Donation payment record was not found.",
        },
        {
          status: 404,
        },
      );
    }

    if (
      payment.status !== "pending" &&
      payment.status !== "paid"
    ) {
      return NextResponse.json(
        {
          error:
            "This donation cannot be captured in its current state.",
        },
        {
          status: 409,
        },
      );
    }

    if (
      payment.currency !==
      DONATION_CURRENCY
    ) {
      return NextResponse.json(
        {
          error:
            "Stored donation currency is invalid.",
        },
        {
          status: 409,
        },
      );
    }

    if (
      payment.payment_method !==
      "PayPal / Card"
    ) {
      return NextResponse.json(
        {
          error:
            "Stored donation payment method is invalid.",
        },
        {
          status: 409,
        },
      );
    }

    const checkoutReference =
      getNoteValue(
        payment.notes,
        "Checkout Reference",
      );

    if (!checkoutReference) {
      return NextResponse.json(
        {
          error:
            "Stored donation checkout reference is missing.",
        },
        {
          status: 500,
        },
      );
    }

    const wasAlreadyPaid =
      payment.status === "paid";

    const accessToken =
      await getPayPalAccessToken();

    const paypalOrder =
      wasAlreadyPaid
        ? await getPayPalOrder(
            accessToken,
            orderId,
          )
        : await capturePayPalOrder(
            accessToken,
            orderId,
          );

    const {
      captureId,
    } = verifyPayPalDonation({
      order: paypalOrder,
      orderId,
      payment,
      checkoutReference,
    });

    if (!wasAlreadyPaid) {
      const updatedNotes = [
        payment.notes,
        captureId
          ? `PayPal Capture ID: ${captureId}`
          : "",
      ]
        .filter(Boolean)
        .join("\n");

      const {
        error: paymentUpdateError,
      } = await supabaseAdmin
        .from("payments")
        .update({
          status: "paid",
          notes: updatedNotes,
        })
        .eq(
          "id",
          payment.id,
        )
        .eq(
          "status",
          "pending",
        );

      if (paymentUpdateError) {
        console.error(
          "DONATION PAYMENT UPDATE ERROR:",
          paymentUpdateError,
        );

        return NextResponse.json(
          {
            error:
              "Donation was verified, but the payment record could not be finalized. Please contact support and do not donate again.",
          },
          {
            status: 500,
          },
        );
      }
    }

    return NextResponse.json({
      success: true,
      status: "paid",
      alreadyPaid:
        wasAlreadyPaid,
      orderId,
      paypalOrderId:
        orderId,
      captureId:
        captureId || null,
      paymentId:
        payment.id,
      amount:
        Number(payment.amount),
      currency:
        DONATION_CURRENCY,
      customerName:
        payment.customer_name,
    });
  } catch (error) {
    console.error(
      "DONATION PAYPAL CAPTURE ERROR:",
      error,
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to capture donation PayPal payment.",
      },
      {
        status: 500,
      },
    );
  }
}
