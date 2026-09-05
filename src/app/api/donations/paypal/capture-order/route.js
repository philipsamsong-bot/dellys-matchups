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

const DONATION_CURRENCY =
  "USD";

const DONATION_PURPOSES =
  new Set([
    "Delly Singah Foundation",
    "Delly's Matchups",
    "Other Purpose",
  ]);

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

function amountsMatch(
  left,
  right,
) {
  const leftNumber =
    Number(left);

  const rightNumber =
    Number(right);

  if (
    !Number.isFinite(
      leftNumber,
    ) ||
    !Number.isFinite(
      rightNumber,
    )
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

function appendPaymentNote(
  notes,
  line,
) {
  const existing =
    getString(notes);

  if (!line) {
    return existing;
  }

  const lines =
    existing
      .split("\n")
      .map((item) =>
        item.trim(),
      )
      .filter(Boolean);

  if (
    lines.includes(line)
  ) {
    return existing;
  }

  return [
    existing,
    line,
  ]
    .filter(Boolean)
    .join("\n");
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
        autoRefreshToken:
          false,
        persistSession:
          false,
      },
    },
  );
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
    ).toString(
      "base64",
    );

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
      "DONATION PAYPAL AUTH ERROR:",
      data,
    );

    throw new Error(
      data.error_description ||
        data.message ||
        "Unable to authenticate with PayPal.",
    );
  }

  if (
    !getString(
      data.access_token,
    )
  ) {
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
  const response =
    await fetch(
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
    await parsePayPalResponse(
      response,
    );

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
  const response =
    await fetch(
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

          "PayPal-Request-Id":
            `donation-capture-${orderId}`,
        },

        body: "{}",

        cache: "no-store",
      },
    );

  const data =
    await parsePayPalResponse(
      response,
    );

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

  if (
    retrievedOrder.status ===
    "COMPLETED"
  ) {
    return retrievedOrder;
  }

  throw new Error(
    data.message ||
      "PayPal could not capture this donation.",
  );
}

function findCompletedCapture(
  purchaseUnit,
) {
  const captures =
    Array.isArray(
      purchaseUnit?.payments
        ?.captures,
    )
      ? purchaseUnit.payments
          .captures
      : [];

  const completedCaptures =
    captures.filter(
      (capture) =>
        capture?.status ===
        "COMPLETED",
    );

  if (
    completedCaptures.length ===
    0
  ) {
    return null;
  }

  if (
    completedCaptures.length >
    1
  ) {
    throw new Error(
      "Unexpected multiple completed PayPal donation captures were found.",
    );
  }

  return completedCaptures[0];
}

function verifyStoredDonation(
  payment,
) {
  if (
    payment.purpose !==
    "donation"
  ) {
    throw new Error(
      "Stored payment purpose is invalid.",
    );
  }

  if (
    payment.payment_method !==
    "PayPal / Card"
  ) {
    throw new Error(
      "Stored donation payment method is invalid.",
    );
  }

  if (
    payment.currency !==
    DONATION_CURRENCY
  ) {
    throw new Error(
      "Stored donation currency is invalid.",
    );
  }

  const amount =
    Number(
      payment.amount,
    );

  if (
    !Number.isFinite(
      amount,
    ) ||
    amount <= 0
  ) {
    throw new Error(
      "Stored donation amount is invalid.",
    );
  }

  const donationPurpose =
    getNoteValue(
      payment.notes,
      "Donation Purpose",
    );

  const purposeLabel =
    getNoteValue(
      payment.notes,
      "Purpose Label",
    );

  const checkoutReference =
    getNoteValue(
      payment.notes,
      "Checkout Reference",
    );

  if (
    !checkoutReference
  ) {
    throw new Error(
      "Stored donation checkout reference is missing.",
    );
  }

  if (
    !DONATION_PURPOSES.has(
      donationPurpose,
    )
  ) {
    throw new Error(
      "Stored donation purpose is invalid.",
    );
  }

  if (
    !purposeLabel
  ) {
    throw new Error(
      "Stored donation purpose label is missing.",
    );
  }

  if (
    payment.item_name !==
    purposeLabel
  ) {
    throw new Error(
      "Stored donation purpose does not match the payment record.",
    );
  }

  if (
    donationPurpose !==
      "Other Purpose" &&
    purposeLabel !==
      donationPurpose
  ) {
    throw new Error(
      "Stored donation purpose label is inconsistent.",
    );
  }

  if (
    donationPurpose ===
    "Other Purpose"
  ) {
    const otherPurpose =
      getNoteValue(
        payment.notes,
        "Other Purpose",
      );

    if (
      !otherPurpose ||
      otherPurpose !==
        purposeLabel
    ) {
      throw new Error(
        "Stored custom donation purpose is inconsistent.",
      );
    }
  }

  return {
    donationPurpose,
    purposeLabel,
    checkoutReference,
  };
}

function verifyPayPalDonation({
  order,
  orderId,
  payment,
  checkoutReference,
}) {
  if (
    !order ||
    order.id !== orderId
  ) {
    throw new Error(
      "PayPal donation order ID verification failed.",
    );
  }

  if (
    order.status !==
    "COMPLETED"
  ) {
    throw new Error(
      "PayPal donation is not completed.",
    );
  }

  const purchaseUnits =
    Array.isArray(
      order.purchase_units,
    )
      ? order.purchase_units
      : [];

  if (
    purchaseUnits.length !==
    1
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
      "Donation checkout reference verification failed.",
    );
  }

  if (
    getString(
      purchaseUnit.custom_id,
    ) !==
    checkoutReference
  ) {
    throw new Error(
      "Donation PayPal metadata verification failed.",
    );
  }

  if (
    purchaseUnit.amount
      ?.currency_code !==
    DONATION_CURRENCY
  ) {
    throw new Error(
      "Donation currency verification failed.",
    );
  }

  if (
    !amountsMatch(
      purchaseUnit.amount
        ?.value,
      payment.amount,
    )
  ) {
    throw new Error(
      "Donation amount verification failed.",
    );
  }

  const completedCapture =
    findCompletedCapture(
      purchaseUnit,
    );

  if (
    !completedCapture
  ) {
    throw new Error(
      "Completed PayPal donation capture was not found.",
    );
  }

  const captureId =
    getString(
      completedCapture.id,
    );

  if (!captureId) {
    throw new Error(
      "Completed PayPal donation capture ID is missing.",
    );
  }

  if (
    completedCapture.amount
      ?.currency_code !==
    DONATION_CURRENCY
  ) {
    throw new Error(
      "Captured donation currency verification failed.",
    );
  }

  if (
    !amountsMatch(
      completedCapture.amount
        ?.value,
      payment.amount,
    )
  ) {
    throw new Error(
      "Captured donation amount verification failed.",
    );
  }

  return {
    captureId,
  };
}

export async function POST(
  request,
) {
  try {
    const body =
      await request.json();

    const orderId =
      getString(
        body.orderId,
      );

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

    if (
      orderId.length >
      200
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid PayPal order ID.",
        },
        {
          status: 400,
        },
      );
    }

    const supabaseAdmin =
      createSupabaseAdmin();

    const {
      data: payments,
      error:
        paymentLookupError,
    } =
      await supabaseAdmin
        .from("payments")
        .select(
          "id,customer_name,customer_email,purpose,item_name,amount,currency,payment_method,status,provider_reference,notes",
        )
        .eq(
          "purpose",
          "donation",
        )
        .eq(
          "payment_method",
          "PayPal / Card",
        )
        .eq(
          "provider_reference",
          orderId,
        )
        .limit(2);

    if (
      paymentLookupError
    ) {
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

    if (
      !Array.isArray(
        payments,
      ) ||
      payments.length === 0
    ) {
      return NextResponse.json(
        {
          error:
            "Donation PayPal payment record was not found.",
        },
        {
          status: 404,
        },
      );
    }

    if (
      payments.length > 1
    ) {
      console.error(
        "DUPLICATE DONATION PAYPAL ORDER:",
        {
          orderId,
          paymentIds:
            payments.map(
              (payment) =>
                payment.id,
            ),
        },
      );

      return NextResponse.json(
        {
          error:
            "Multiple donation payment records were found for this PayPal order. Please contact support.",
        },
        {
          status: 409,
        },
      );
    }

    const payment =
      payments[0];

    if (
      payment.status !==
        "pending" &&
      payment.status !==
        "paid"
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

    let storedDonation;

    try {
      storedDonation =
        verifyStoredDonation(
          payment,
        );
    } catch (error) {
      return NextResponse.json(
        {
          error:
            error instanceof Error
              ? error.message
              : "Stored donation verification failed.",
        },
        {
          status: 409,
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
    } =
      verifyPayPalDonation({
        order:
          paypalOrder,
        orderId,
        payment,
        checkoutReference:
          storedDonation.checkoutReference,
      });

    if (
      !wasAlreadyPaid
    ) {
      const updatedNotes =
        appendPaymentNote(
          payment.notes,
          `PayPal Capture ID: ${captureId}`,
        );

      const {
        data:
          updatedPayment,
        error:
          paymentUpdateError,
      } =
        await supabaseAdmin
          .from("payments")
          .update({
            status:
              "paid",

            notes:
              updatedNotes,
          })
          .eq(
            "id",
            payment.id,
          )
          .eq(
            "status",
            "pending",
          )
          .select(
            "id,status",
          )
          .maybeSingle();

      if (
        paymentUpdateError
      ) {
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

      if (
        !updatedPayment ||
        updatedPayment.status !==
          "paid"
      ) {
        const {
          data:
            currentPayment,
          error:
            currentPaymentError,
        } =
          await supabaseAdmin
            .from("payments")
            .select(
              "id,status",
            )
            .eq(
              "id",
              payment.id,
            )
            .maybeSingle();

        if (
          currentPaymentError
        ) {
          console.error(
            "DONATION PAYMENT FINAL STATUS LOOKUP ERROR:",
            currentPaymentError,
          );

          return NextResponse.json(
            {
              error:
                "Donation was captured but its final payment status could not be verified. Please contact support and do not donate again.",
            },
            {
              status: 500,
            },
          );
        }

        if (
          currentPayment?.status !==
          "paid"
        ) {
          return NextResponse.json(
            {
              error:
                "Donation was captured but could not be finalized. Please contact support and do not donate again.",
            },
            {
              status: 409,
            },
          );
        }
      }
    }

    return NextResponse.json({
      success: true,

      status:
        "paid",

      alreadyPaid:
        wasAlreadyPaid,

      orderId,

      paypalOrderId:
        orderId,

      captureId,

      paymentId:
        payment.id,

      amount:
        Number(
          payment.amount,
        ),

      currency:
        DONATION_CURRENCY,

      donationPurpose:
        storedDonation.donationPurpose,

      purposeLabel:
        storedDonation.purposeLabel,

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
