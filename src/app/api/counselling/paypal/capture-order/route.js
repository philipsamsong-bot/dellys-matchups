// src/app/api/counselling/paypal/capture-order/route.js

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

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  "https://www.dellysmatchups.org";

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

  if (isValidSessionType(rawService)) {
    return rawService;
  }

  return (
    BOOKING_SERVICE_ALIASES[
      normalizeService(rawService)
    ] || null
  );
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

function getNoteValue(
  notes,
  label,
) {
  if (
    typeof notes !== "string" ||
    !notes
  ) {
    return "";
  }

  const prefix = `${label}:`;

  const line = notes
    .split(/\r?\n/)
    .map((item) => item.trim())
    .find((item) =>
      item.startsWith(prefix),
    );

  return line
    ? line
        .slice(prefix.length)
        .trim()
    : "";
}

function parseCustomMetadata(value) {
  if (
    typeof value !== "string" ||
    !value
  ) {
    return null;
  }

  try {
    const parsed =
      JSON.parse(value);

    if (
      !parsed ||
      typeof parsed !== "object" ||
      Array.isArray(parsed)
    ) {
      return null;
    }

    return parsed;
  } catch {
    return null;
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

function findCompletedCapture(order) {
  const purchaseUnits =
    Array.isArray(
      order?.purchase_units,
    )
      ? order.purchase_units
      : [];

  for (
    const purchaseUnit
    of purchaseUnits
  ) {
    const captures =
      Array.isArray(
        purchaseUnit?.payments
          ?.captures,
      )
        ? purchaseUnit.payments
            .captures
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
    await parseJsonResponse(
      response,
    );

  if (!response.ok) {
    console.error(
      "COUNSELLING PAYPAL GET ORDER ERROR:",
      data,
    );

    throw new Error(
      data.message ||
        data.error_description ||
        "Unable to retrieve PayPal order.",
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
            `counselling-capture-${orderId}`,
        },
        body:
          JSON.stringify({}),
        cache: "no-store",
      },
    );

  const data =
    await parseJsonResponse(
      response,
    );

  if (response.ok) {
    return data;
  }

  console.error(
    "COUNSELLING PAYPAL CAPTURE RESPONSE:",
    data,
  );

  const retrievedOrder =
    await getPayPalOrder(
      accessToken,
      orderId,
    );

  if (
    retrievedOrder?.status ===
    "COMPLETED"
  ) {
    return retrievedOrder;
  }

  throw new Error(
    data.message ||
      data.error_description ||
      "PayPal could not capture this counselling payment.",
  );
}

function verifyStoredPayment({
  payment,
  sessionType,
  session,
}) {
  const expectedItemName =
    `Counselling - ${session.title}`;

  if (
    payment.purpose !==
    "counselling"
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
      "Stored counselling payment method is invalid.",
    );
  }

  if (
    payment.item_name !==
    expectedItemName
  ) {
    throw new Error(
      "Stored counselling payment item does not match the session.",
    );
  }

  if (
    payment.currency !== "USD"
  ) {
    throw new Error(
      "Stored counselling payment currency is invalid.",
    );
  }

  if (
    !amountsMatch(
      payment.amount,
      session.price,
    )
  ) {
    throw new Error(
      "Stored counselling payment amount is invalid.",
    );
  }

  if (
    !isValidSessionType(
      sessionType,
    )
  ) {
    throw new Error(
      "Stored counselling session type is invalid.",
    );
  }
}

function verifyBooking({
  booking,
  payment,
  bookingId,
  sessionType,
}) {
  if (
    booking.id !== bookingId
  ) {
    throw new Error(
      "Counselling booking ID verification failed.",
    );
  }

  const bookingSessionType =
    resolveBookingSessionType(
      booking.service,
    );

  if (!bookingSessionType) {
    throw new Error(
      "The counselling booking service could not be matched to a valid payment option.",
    );
  }

  if (
    bookingSessionType !==
    sessionType
  ) {
    throw new Error(
      "The counselling booking service does not match the stored payment session.",
    );
  }

  if (
    normalizeEmail(
      booking.email,
    ) !==
    normalizeEmail(
      payment.customer_email,
    )
  ) {
    throw new Error(
      "Counselling booking email does not match the payment.",
    );
  }
}

function verifyPayPalOrder({
  order,
  orderId,
  bookingId,
  sessionType,
  checkoutReference,
  customerEmail,
}) {
  if (
    !order ||
    order.id !== orderId
  ) {
    throw new Error(
      "PayPal order ID verification failed.",
    );
  }

  if (
    order.status !==
    "COMPLETED"
  ) {
    throw new Error(
      "PayPal payment is not completed.",
    );
  }

  if (
    !isValidSessionType(
      sessionType,
    )
  ) {
    throw new Error(
      "Stored counselling session type is invalid.",
    );
  }

  const session =
    COUNSELLING_SESSIONS[
      sessionType
    ];

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
      "PayPal checkout reference verification failed.",
    );
  }

  const amount =
    purchaseUnit.amount;

  if (
    amount?.currency_code !==
    "USD"
  ) {
    throw new Error(
      "PayPal currency verification failed.",
    );
  }

  if (
    !amountsMatch(
      amount?.value,
      session.price,
    )
  ) {
    throw new Error(
      "PayPal amount verification failed.",
    );
  }

  const metadata =
    parseCustomMetadata(
      purchaseUnit.custom_id,
    );

  if (!metadata) {
    throw new Error(
      "PayPal order metadata is missing or invalid.",
    );
  }

  if (
    metadata.purpose !==
    "counselling"
  ) {
    throw new Error(
      "PayPal payment purpose verification failed.",
    );
  }

  if (
    metadata.bookingId !==
    bookingId
  ) {
    throw new Error(
      "PayPal booking verification failed.",
    );
  }

  if (
    metadata.sessionType !==
    sessionType
  ) {
    throw new Error(
      "PayPal session type verification failed.",
    );
  }

  if (
    metadata.checkoutReference !==
    checkoutReference
  ) {
    throw new Error(
      "PayPal metadata checkout reference verification failed.",
    );
  }

  if (
    normalizeEmail(
      metadata.customerEmail,
    ) !==
    normalizeEmail(
      customerEmail,
    )
  ) {
    throw new Error(
      "PayPal customer email verification failed.",
    );
  }

  const completedCapture =
    findCompletedCapture(
      order,
    );

  if (
    !completedCapture?.id
  ) {
    throw new Error(
      "PayPal completed capture was not found.",
    );
  }

  if (
    completedCapture.amount
      ?.currency_code !==
    "USD"
  ) {
    throw new Error(
      "PayPal captured currency verification failed.",
    );
  }

  if (
    !amountsMatch(
      completedCapture.amount
        ?.value,
      session.price,
    )
  ) {
    throw new Error(
      "PayPal captured amount verification failed.",
    );
  }

  return {
    session,
    captureId:
      completedCapture.id,
  };
}

async function updateBookingAsPaid({
  supabaseAdmin,
  booking,
  bookingId,
  orderId,
  amount,
}) {
  const paidAt =
    booking.paid_at ||
    new Date().toISOString();

  const {
    error:
      bookingUpdateError,
  } = await supabaseAdmin
    .from(
      "counselling_bookings",
    )
    .update({
      payment_status:
        "paid",
      payment_method:
        "PayPal / Card",
      paypal_order_id:
        orderId,
      paid_amount:
        amount,
      paid_at:
        paidAt,
    })
    .eq(
      "id",
      bookingId,
    );

  if (
    bookingUpdateError
  ) {
    console.error(
      "COUNSELLING BOOKING PAID UPDATE ERROR:",
      bookingUpdateError,
    );

    throw new Error(
      "PayPal payment was verified, but the counselling booking could not be updated. Please contact support and do not pay again.",
    );
  }
}

async function finalizePaymentRecord({
  supabaseAdmin,
  payment,
  bookingId,
  sessionType,
  checkoutReference,
  orderId,
  captureId,
}) {
  const notes = [
    `Booking ID: ${bookingId}`,
    `Session Type: ${sessionType}`,
    `Checkout Reference: ${checkoutReference}`,
    `PayPal Order ID: ${orderId}`,
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
      provider_reference:
        orderId,
      notes,
    })
    .eq(
      "id",
      payment.id,
    );

  if (
    paymentUpdateError
  ) {
    console.error(
      "COUNSELLING PAYMENT PAID UPDATE ERROR:",
      paymentUpdateError,
    );

    throw new Error(
      "PayPal payment was verified and the booking was updated, but the payment record could not be finalized. Please contact support and do not pay again.",
    );
  }
}

async function sendBookingEmail({
  booking,
  amount,
}) {
  try {
    const response =
      await fetch(
        `${SITE_URL}/api/send-booking-email`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body:
            JSON.stringify({
              fullName:
                booking.full_name,
              email:
                booking.email,
              service:
                booking.service,
              preferredDate:
                booking.preferred_date,
              amount:
                amount.toFixed(2),
            }),
          cache: "no-store",
        },
      );

    const result =
      await parseJsonResponse(
        response,
      );

    if (!response.ok) {
      console.error(
        "COUNSELLING BOOKING EMAIL ERROR:",
        result,
      );

      return false;
    }

    return true;
  } catch (error) {
    console.error(
      "COUNSELLING BOOKING EMAIL ERROR:",
      error,
    );

    return false;
  }
}

export async function POST(request) {
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

    const supabaseAdmin =
      createSupabaseAdmin();

    const {
      data: payment,
      error: paymentError,
    } = await supabaseAdmin
      .from("payments")
      .select(
        [
          "id",
          "customer_name",
          "customer_email",
          "purpose",
          "item_name",
          "amount",
          "currency",
          "payment_method",
          "status",
          "provider_reference",
          "notes",
        ].join(","),
      )
      .eq(
        "purpose",
        "counselling",
      )
      .eq(
        "payment_method",
        "PayPal / Card",
      )
      .eq(
        "provider_reference",
        orderId,
      )
      .limit(1)
      .maybeSingle();

    if (paymentError) {
      console.error(
        "COUNSELLING PAYMENT LOOKUP ERROR:",
        paymentError,
      );

      return NextResponse.json(
        {
          error:
            "Unable to load counselling payment.",
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
            "Counselling payment record was not found.",
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
            "This counselling payment cannot be captured in its current state.",
        },
        {
          status: 409,
        },
      );
    }

    const bookingId =
      getNoteValue(
        payment.notes,
        "Booking ID",
      );

    const sessionType =
      getNoteValue(
        payment.notes,
        "Session Type",
      );

    const checkoutReference =
      getNoteValue(
        payment.notes,
        "Checkout Reference",
      );

    if (
      !bookingId ||
      !sessionType ||
      !checkoutReference
    ) {
      return NextResponse.json(
        {
          error:
            "Stored counselling payment metadata is incomplete.",
        },
        {
          status: 500,
        },
      );
    }

    if (
      !isValidSessionType(
        sessionType,
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Stored counselling session type is invalid.",
        },
        {
          status: 500,
        },
      );
    }

    const session =
      COUNSELLING_SESSIONS[
        sessionType
      ];

    try {
      verifyStoredPayment({
        payment,
        sessionType,
        session,
      });
    } catch (error) {
      return NextResponse.json(
        {
          error:
            error instanceof Error
              ? error.message
              : "Stored counselling payment verification failed.",
        },
        {
          status: 409,
        },
      );
    }

    const {
      data: booking,
      error: bookingError,
    } = await supabaseAdmin
      .from(
        "counselling_bookings",
      )
      .select(
        [
          "id",
          "full_name",
          "email",
          "service",
          "preferred_date",
          "payment_status",
          "payment_method",
          "paypal_order_id",
          "paid_amount",
          "paid_at",
        ].join(","),
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

    try {
      verifyBooking({
        booking,
        payment,
        bookingId,
        sessionType,
      });
    } catch (error) {
      return NextResponse.json(
        {
          error:
            error instanceof Error
              ? error.message
              : "Counselling booking verification failed.",
        },
        {
          status: 409,
        },
      );
    }

    const bookingAlreadyPaid =
      booking.payment_status ===
      "paid";

    const bookingPaidBySameOrder =
      bookingAlreadyPaid &&
      getString(
        booking.paypal_order_id,
      ) === orderId;

    if (
      bookingAlreadyPaid &&
      !bookingPaidBySameOrder
    ) {
      return NextResponse.json(
        {
          error:
            "This counselling booking has already been paid through another transaction. The PayPal order was not captured.",
        },
        {
          status: 409,
        },
      );
    }

    const accessToken =
      await getPayPalAccessToken();

    let paypalOrder;

    if (
      payment.status === "paid" ||
      bookingPaidBySameOrder
    ) {
      paypalOrder =
        await getPayPalOrder(
          accessToken,
          orderId,
        );
    } else {
      paypalOrder =
        await capturePayPalOrder(
          accessToken,
          orderId,
        );
    }

    const {
      session:
        verifiedSession,
      captureId,
    } = verifyPayPalOrder({
      order:
        paypalOrder,
      orderId,
      bookingId,
      sessionType,
      checkoutReference,
      customerEmail:
        payment.customer_email,
    });

    const wasAlreadyPaid =
      payment.status === "paid";

    if (
      !bookingPaidBySameOrder
    ) {
      await updateBookingAsPaid({
        supabaseAdmin,
        booking,
        bookingId,
        orderId,
        amount:
          verifiedSession.price,
      });
    }

    if (
      payment.status !== "paid"
    ) {
      await finalizePaymentRecord({
        supabaseAdmin,
        payment,
        bookingId,
        sessionType,
        checkoutReference,
        orderId,
        captureId,
      });
    }

    let emailSent = true;

    if (
      !wasAlreadyPaid &&
      !bookingPaidBySameOrder
    ) {
      emailSent =
        await sendBookingEmail({
          booking,
          amount:
            verifiedSession.price,
        });
    }

    return NextResponse.json({
      success: true,
      status: "paid",
      bookingId,
      sessionType,
      amount:
        verifiedSession.price,
      currency: "USD",
      orderId,
      captureId,
      emailSent,
      alreadyPaid:
        wasAlreadyPaid ||
        bookingPaidBySameOrder,
    });
  } catch (error) {
    console.error(
      "COUNSELLING CAPTURE ORDER ERROR:",
      error,
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to capture counselling PayPal payment.",
      },
      {
        status: 500,
      },
    );
  }
}
