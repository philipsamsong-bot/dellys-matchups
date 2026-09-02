// src/app/api/partner/paypal/capture-order/route.js

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

function getString(value) {
  return typeof value === "string"
    ? value.trim()
    : "";
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
        Authorization:
          `Bearer ${accessToken}`,
        "Content-Type":
          "application/json",
      },
      cache: "no-store",
    },
  );

  const data =
    await parsePayPalResponse(response);

  if (!response.ok) {
    console.error(
      "PARTNER PAYPAL GET ORDER ERROR:",
      data,
    );

    throw new Error(
      data.message ||
        "Unable to retrieve PayPal partnership order.",
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
        Authorization:
          `Bearer ${accessToken}`,
        "Content-Type":
          "application/json",
        Prefer:
          "return=representation",
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
    "PARTNER PAYPAL CAPTURE RESPONSE:",
    data,
  );

  const retrievedOrder =
    await getPayPalOrder(
      accessToken,
      orderId,
    );

  if (
    retrievedOrder.status ===
    "COMPLETED"
  ) {
    return retrievedOrder;
  }

  throw new Error(
    data.message ||
      "PayPal could not capture this partnership payment.",
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

    const capture =
      captures.find(
        (item) =>
          item?.status ===
          "COMPLETED",
      );

    if (capture) {
      return capture;
    }
  }

  return null;
}

function verifyPartnerPayment({
  order,
  orderId,
  payment,
  checkoutReference,
  partnershipType,
}) {
  if (
    !order ||
    order.id !== orderId
  ) {
    throw new Error(
      "PayPal partnership order ID verification failed.",
    );
  }

  if (
    order.status !==
    "COMPLETED"
  ) {
    throw new Error(
      "PayPal partnership payment is not completed.",
    );
  }

  const purchaseUnits =
    Array.isArray(
      order.purchase_units,
    )
      ? order.purchase_units
      : [];

  if (
    purchaseUnits.length !== 1
  ) {
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
      "Partner checkout reference verification failed.",
    );
  }

  if (
    purchaseUnit.amount?.currency_code !==
    PARTNER_CURRENCY
  ) {
    throw new Error(
      "Partner currency verification failed.",
    );
  }

  if (
    !amountsMatch(
      purchaseUnit.amount?.value,
      payment.amount,
    )
  ) {
    throw new Error(
      "Partner payment amount verification failed.",
    );
  }

  const metadata =
    parseCustomMetadata(
      purchaseUnit.custom_id,
    );

  if (!metadata) {
    throw new Error(
      "Partner payment metadata is missing or invalid.",
    );
  }

  if (
    metadata.purpose !==
    "partner"
  ) {
    throw new Error(
      "Partner payment purpose verification failed.",
    );
  }

  if (
    metadata.checkoutReference !==
    checkoutReference
  ) {
    throw new Error(
      "Partner metadata checkout reference verification failed.",
    );
  }

  if (
    metadata.partnershipType !==
    partnershipType
  ) {
    throw new Error(
      "Partner type verification failed.",
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
      "Partner email verification failed.",
    );
  }

  const completedCapture =
    findCompletedCapture(order);

  if (!completedCapture) {
    throw new Error(
      "Completed PayPal partnership capture was not found.",
    );
  }

  if (
    completedCapture.amount
      ?.currency_code !==
    PARTNER_CURRENCY
  ) {
    throw new Error(
      "Captured partnership currency verification failed.",
    );
  }

  if (
    !amountsMatch(
      completedCapture.amount?.value,
      payment.amount,
    )
  ) {
    throw new Error(
      "Captured partnership amount verification failed.",
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
        "partner",
      )
      .eq(
        "provider_reference",
        orderId,
      )
      .maybeSingle();

    if (paymentLookupError) {
      console.error(
        "PARTNER PAYMENT LOOKUP ERROR:",
        paymentLookupError,
      );

      return NextResponse.json(
        {
          error:
            "Unable to load the partnership payment.",
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
            "Partnership payment record was not found.",
        },
        {
          status: 404,
        },
      );
    }

    if (
      payment.status !==
        "pending" &&
      payment.status !==
        "paid"
    ) {
      return NextResponse.json(
        {
          error:
            "This partnership payment cannot be captured in its current state.",
        },
        {
          status: 409,
        },
      );
    }

    if (
      payment.currency !==
      PARTNER_CURRENCY
    ) {
      return NextResponse.json(
        {
          error:
            "Stored partnership currency is invalid.",
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
            "Stored partnership payment method is invalid.",
        },
        {
          status: 409,
        },
      );
    }

    const partnershipType =
      getNoteValue(
        payment.notes,
        "Partnership Type",
      );

    const checkoutReference =
      getNoteValue(
        payment.notes,
        "Checkout Reference",
      );

    if (
      !partnershipType ||
      !PARTNERSHIP_TYPES.has(
        partnershipType,
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Stored partnership type is invalid.",
        },
        {
          status: 500,
        },
      );
    }

    if (
      payment.item_name !==
      partnershipType
    ) {
      return NextResponse.json(
        {
          error:
            "Stored partnership payment type does not match its item.",
        },
        {
          status: 409,
        },
      );
    }

    if (!checkoutReference) {
      return NextResponse.json(
        {
          error:
            "Stored partnership checkout reference is missing.",
        },
        {
          status: 500,
        },
      );
    }

    const wasAlreadyPaid =
      payment.status ===
      "paid";

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
    } = verifyPartnerPayment({
      order: paypalOrder,
      orderId,
      payment,
      checkoutReference,
      partnershipType,
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
        error:
          paymentUpdateError,
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

      if (
        paymentUpdateError
      ) {
        console.error(
          "PARTNER PAYMENT UPDATE ERROR:",
          paymentUpdateError,
        );

        return NextResponse.json(
          {
            error:
              "Partnership payment was verified, but the payment record could not be finalized. Please contact support and do not pay again.",
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
      partnershipType,
      amount:
        Number(payment.amount),
      currency:
        PARTNER_CURRENCY,
      customerName:
        payment.customer_name,
    });
  } catch (error) {
    console.error(
      "PARTNER PAYPAL CAPTURE ERROR:",
      error,
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to capture partnership PayPal payment.",
      },
      {
        status: 500,
      },
    );
  }
}
