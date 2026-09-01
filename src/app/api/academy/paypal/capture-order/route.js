// src/app/api/academy/paypal/capture-order/route.js

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const PAYPAL_API_BASE =
  process.env.PAYPAL_API_BASE || "https://api-m.paypal.com";

const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY;

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
    title: "Module 4: Leadership & Influence",
    price: 100,
  },
  "module-5": {
    title: "Module 5: Healing & Restoration",
    price: 100,
  },
  "module-6": {
    title: "Module 6: Master Classes",
    price: 100,
  },
  "module-7": {
    title: "Module 7: Virginity 101",
    price: 100,
  },
};

function getRequiredEnvironmentVariable(value, name) {
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
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

function isAcademyCourseKey(value) {
  return (
    typeof value === "string" &&
    Object.prototype.hasOwnProperty.call(
      ACADEMY_COURSES,
      value,
    )
  );
}

function parseCustomId(customId) {
  if (typeof customId !== "string") {
    return {};
  }

  try {
    const parsed = JSON.parse(customId);

    if (
      !parsed ||
      typeof parsed !== "object" ||
      Array.isArray(parsed)
    ) {
      return {};
    }

    return parsed;
  } catch {
    return {};
  }
}

function extractNoteValue(notes, label) {
  if (typeof notes !== "string") {
    return null;
  }

  const lines = notes.split(/\r?\n/);
  const prefix = `${label}:`;

  const line = lines.find((value) =>
    value.startsWith(prefix),
  );

  if (!line) {
    return null;
  }

  const result = line
    .slice(prefix.length)
    .trim();

  return result || null;
}

function extractCourseKeyFromNotes(notes) {
  const courseKey = extractNoteValue(
    notes,
    "Course Key",
  );

  return isAcademyCourseKey(courseKey)
    ? courseKey
    : null;
}

function extractCheckoutReferenceFromNotes(notes) {
  return extractNoteValue(
    notes,
    "Checkout Reference",
  );
}

function moneyMatches(actual, expected) {
  const amount = Number(actual);

  return (
    Number.isFinite(amount) &&
    Math.abs(amount - expected) < 0.001
  );
}

async function getPayPalAccessToken() {
  const clientId = getRequiredEnvironmentVariable(
    PAYPAL_CLIENT_ID,
    "PAYPAL_CLIENT_ID",
  );

  const clientSecret = getRequiredEnvironmentVariable(
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
        Authorization: `Basic ${auth}`,
        "Content-Type":
          "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
      cache: "no-store",
    },
  );

  const data = await response.json();

  if (!response.ok) {
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

async function getPayPalOrder(orderId, accessToken) {
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

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message ||
        data.error_description ||
        "Unable to retrieve PayPal order.",
    );
  }

  return data;
}

function getCompletedCapture(order) {
  const purchaseUnits = Array.isArray(
    order?.purchase_units,
  )
    ? order.purchase_units
    : [];

  for (const purchaseUnit of purchaseUnits) {
    const captures = Array.isArray(
      purchaseUnit?.payments?.captures,
    )
      ? purchaseUnit.payments.captures
      : [];

    const completedCapture = captures.find(
      (capture) =>
        capture?.status === "COMPLETED",
    );

    if (completedCapture) {
      return completedCapture;
    }
  }

  return null;
}

async function activateAcademyEnrollment(
  supabaseAdmin,
  payment,
  courseKey,
  course,
) {
  const customerEmail =
    typeof payment.customer_email === "string"
      ? payment.customer_email
          .trim()
          .toLowerCase()
      : "";

  const customerName =
    typeof payment.customer_name === "string"
      ? payment.customer_name.trim()
      : "";

  if (!customerEmail || !customerName) {
    throw new Error(
      "Academy payment is missing customer information.",
    );
  }

  const { error } = await supabaseAdmin
    .from("academy_enrollments")
    .upsert(
      {
        user_email: customerEmail,
        customer_name: customerName,
        course_key: courseKey,
        course_title: course.title,
        access_type:
          courseKey === "full-academy"
            ? "full"
            : "single",
        payment_id: payment.id,
        status: "active",
      },
      {
        onConflict: "user_email,course_key",
      },
    );

  if (error) {
    throw new Error(error.message);
  }
}

function verifyCompletedPayPalOrder(
  order,
  orderId,
  payment,
  courseKey,
  course,
  checkoutReference,
) {
  if (order?.id !== orderId) {
    throw new Error(
      "PayPal order ID does not match the requested Academy payment.",
    );
  }

  if (order?.status !== "COMPLETED") {
    throw new Error(
      `PayPal order is ${order?.status || "not completed"}.`,
    );
  }

  const purchaseUnit =
    order?.purchase_units?.[0];

  if (!purchaseUnit) {
    throw new Error(
      "PayPal order is missing purchase information.",
    );
  }

  if (
    purchaseUnit.amount?.currency_code !== "USD" ||
    !moneyMatches(
      purchaseUnit.amount?.value,
      course.price,
    )
  ) {
    throw new Error(
      "PayPal order amount does not match Academy pricing.",
    );
  }

  if (
    payment.currency !== "USD" ||
    !moneyMatches(
      payment.amount,
      course.price,
    )
  ) {
    throw new Error(
      "Stored Academy payment amount does not match trusted pricing.",
    );
  }

  if (
    purchaseUnit.reference_id !==
    checkoutReference
  ) {
    throw new Error(
      "PayPal checkout reference does not match the Academy payment.",
    );
  }

  const customData = parseCustomId(
    purchaseUnit.custom_id,
  );

  if (
    customData.purpose !== "academy" ||
    customData.courseKey !== courseKey
  ) {
    throw new Error(
      "PayPal Academy payment metadata is invalid.",
    );
  }

  if (
    customData.checkoutReference !==
    checkoutReference
  ) {
    throw new Error(
      "PayPal Academy checkout metadata does not match the stored payment.",
    );
  }

  const storedEmail =
    typeof payment.customer_email === "string"
      ? payment.customer_email
          .trim()
          .toLowerCase()
      : "";

  const paypalMetadataEmail =
    typeof customData.customerEmail === "string"
      ? customData.customerEmail
          .trim()
          .toLowerCase()
      : "";

  if (
    !storedEmail ||
    !paypalMetadataEmail ||
    storedEmail !== paypalMetadataEmail
  ) {
    throw new Error(
      "PayPal customer metadata does not match the Academy payment.",
    );
  }

  const completedCapture =
    getCompletedCapture(order);

  if (!completedCapture?.id) {
    throw new Error(
      "Completed PayPal capture was not found.",
    );
  }

  if (
    completedCapture.amount?.currency_code !==
      "USD" ||
    !moneyMatches(
      completedCapture.amount?.value,
      course.price,
    )
  ) {
    throw new Error(
      "PayPal captured amount does not match Academy pricing.",
    );
  }

  return {
    captureId: completedCapture.id,
  };
}

export async function POST(request) {
  try {
    const body = await request.json();

    const orderId =
      typeof body.orderId === "string"
        ? body.orderId.trim()
        : "";

    if (!orderId) {
      return NextResponse.json(
        {
          error: "Missing PayPal order ID.",
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
      .eq("purpose", "academy")
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
      throw new Error(
        paymentError.message,
      );
    }

    if (!payment) {
      return NextResponse.json(
        {
          error:
            "Academy payment record was not found.",
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
            `Academy payment cannot be processed from status "${payment.status}".`,
        },
        {
          status: 409,
        },
      );
    }

    const courseKey =
      extractCourseKeyFromNotes(
        payment.notes,
      );

    if (!courseKey) {
      return NextResponse.json(
        {
          error:
            "Academy payment contains an invalid course.",
        },
        {
          status: 409,
        },
      );
    }

    const course =
      ACADEMY_COURSES[courseKey];

    const checkoutReference =
      extractCheckoutReferenceFromNotes(
        payment.notes,
      );

    if (!checkoutReference) {
      return NextResponse.json(
        {
          error:
            "Academy payment is missing its checkout reference.",
        },
        {
          status: 409,
        },
      );
    }

    if (
      payment.item_name !== course.title ||
      payment.currency !== "USD" ||
      !moneyMatches(
        payment.amount,
        course.price,
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Stored Academy payment does not match trusted pricing.",
        },
        {
          status: 409,
        },
      );
    }

    if (payment.status === "paid") {
      await activateAcademyEnrollment(
        supabaseAdmin,
        payment,
        courseKey,
        course,
      );

      return NextResponse.json({
        success: true,
        alreadyProcessed: true,
        paymentId: payment.id,
        orderId,
        courseKey,
        status: "paid",
      });
    }

    const accessToken =
      await getPayPalAccessToken();

    const captureResponse = await fetch(
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
            `academy-capture-${orderId}`,
        },
        body: JSON.stringify({}),
        cache: "no-store",
      },
    );

    const captureData =
      await captureResponse.json();

    let paypalOrder = captureData;

    if (!captureResponse.ok) {
      paypalOrder =
        await getPayPalOrder(
          orderId,
          accessToken,
        );

      if (
        paypalOrder?.status !== "COMPLETED"
      ) {
        return NextResponse.json(
          {
            error:
              captureData.message ||
              captureData.error_description ||
              "Unable to capture PayPal Academy order.",
            details: captureData,
          },
          {
            status: 502,
          },
        );
      }
    }

    const { captureId } =
      verifyCompletedPayPalOrder(
        paypalOrder,
        orderId,
        payment,
        courseKey,
        course,
        checkoutReference,
      );

    const updatedNotes = [
      payment.notes || "",
      `PayPal Order ID: ${orderId}`,
      `PayPal Capture ID: ${captureId}`,
    ]
      .filter(Boolean)
      .join("\n");

    const { error: updateError } =
      await supabaseAdmin
        .from("payments")
        .update({
          status: "paid",
          provider_reference: orderId,
          notes: updatedNotes,
        })
        .eq("id", payment.id);

    if (updateError) {
      throw new Error(
        updateError.message,
      );
    }

    await activateAcademyEnrollment(
      supabaseAdmin,
      {
        ...payment,
        status: "paid",
        notes: updatedNotes,
      },
      courseKey,
      course,
    );

    return NextResponse.json({
      success: true,
      alreadyProcessed: false,
      paymentId: payment.id,
      orderId,
      captureId,
      courseKey,
      status: "paid",
    });
  } catch (error) {
    console.error(
      "ACADEMY CAPTURE ORDER ERROR:",
      error,
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to capture Academy PayPal payment.",
      },
      {
        status: 500,
      },
    );
  }
}
