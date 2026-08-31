// src/app/api/academy/manual-payment/route.js

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL;

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

const MANUAL_PAYMENT_METHODS = [
  "Mobile Money",
  "Bank Transfer",
];

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

function isAcademyCourseKey(value) {
  return (
    typeof value === "string" &&
    Object.prototype.hasOwnProperty.call(
      ACADEMY_COURSES,
      value,
    )
  );
}

function isManualPaymentMethod(value) {
  return (
    typeof value === "string" &&
    MANUAL_PAYMENT_METHODS.includes(value)
  );
}

function getOptionalHttpsUrl(value) {
  const rawValue = getString(value);

  if (!rawValue) {
    return null;
  }

  try {
    const parsedUrl = new URL(rawValue);

    if (parsedUrl.protocol !== "https:") {
      return null;
    }

    return parsedUrl.toString();
  } catch {
    return null;
  }
}

export async function POST(request) {
  try {
    const body = await request.json();

    if (!isAcademyCourseKey(body.courseKey)) {
      return NextResponse.json(
        {
          error: "Invalid Academy course.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      !isManualPaymentMethod(
        body.paymentMethod,
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid manual payment method.",
        },
        {
          status: 400,
        },
      );
    }

    const courseKey = body.courseKey;
    const course =
      ACADEMY_COURSES[courseKey];

    const customerName =
      getString(body.customerName);

    const customerEmail =
      normalizeEmail(body.customerEmail);

    const country =
      getString(body.country);

    const phone =
      getString(body.phone);

    const providerReference =
      getString(body.providerReference);

    const rawProofUrl =
      getString(body.proofUrl);

    const proofUrl =
      getOptionalHttpsUrl(body.proofUrl);

    const notes =
      getString(body.notes);

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
      !isValidEmail(customerEmail)
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

    if (!providerReference) {
      return NextResponse.json(
        {
          error:
            "Transaction ID or payment reference is required.",
        },
        {
          status: 400,
        },
      );
    }

    if (rawProofUrl && !proofUrl) {
      return NextResponse.json(
        {
          error:
            "The payment proof URL is invalid.",
        },
        {
          status: 400,
        },
      );
    }

    const supabaseAdmin =
      createSupabaseAdmin();

    const {
      data: existingPayment,
      error: existingPaymentError,
    } = await supabaseAdmin
      .from("payments")
      .select("id,status,item_name")
      .eq("purpose", "academy")
      .eq(
        "customer_email",
        customerEmail,
      )
      .eq(
        "payment_method",
        body.paymentMethod,
      )
      .eq(
        "provider_reference",
        providerReference,
      )
      .limit(1)
      .maybeSingle();

    if (existingPaymentError) {
      throw new Error(
        existingPaymentError.message,
      );
    }

    if (existingPayment) {
      if (
        existingPayment.item_name !==
        course.title
      ) {
        return NextResponse.json(
          {
            error:
              "This transaction reference has already been used for a different Academy purchase.",
          },
          {
            status: 409,
          },
        );
      }

      return NextResponse.json({
        success: true,
        alreadySubmitted: true,
        paymentId:
          existingPayment.id,
        status:
          existingPayment.status,
        courseKey,
      });
    }

    const paymentNotes = [
      `Course Key: ${courseKey}`,
      `Country: ${country}`,
      `Phone: ${phone}`,
      `Transaction Reference: ${providerReference}`,
      notes,
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
          "academy",
        item_name:
          course.title,
        amount:
          course.price,
        currency:
          "USD",
        payment_method:
          body.paymentMethod,
        status:
          "pending_confirmation",
        provider_reference:
          providerReference,
        proof_url:
          proofUrl,
        notes:
          paymentNotes,
      })
      .select("id,status")
      .single();

    if (paymentError) {
      throw new Error(
        paymentError.message,
      );
    }

    return NextResponse.json({
      success: true,
      alreadySubmitted: false,
      paymentId:
        payment.id,
      status:
        payment.status,
      courseKey,
    });
  } catch (error) {
    console.error(
      "ACADEMY MANUAL PAYMENT ERROR:",
      error,
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to submit manual Academy payment.",
      },
      {
        status: 500,
      },
    );
  }
}
