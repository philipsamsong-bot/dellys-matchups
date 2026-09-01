// src/app/api/matchups/manual-payment/route.js

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY;

const PLANS = {
  premium: {
    title: "Premium Membership",
    price: 30,
  },
  vip: {
    title: "VIP Elite Membership",
    price: 100,
  },
};

const VALID_PAYMENT_METHODS = new Set([
  "Mobile Money",
  "Bank Transfer",
]);

function getRequiredEnv(value, name) {
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }

  return value;
}

function getSupabaseAdmin() {
  return createClient(
    getRequiredEnv(
      SUPABASE_URL,
      "NEXT_PUBLIC_SUPABASE_URL",
    ),
    getRequiredEnv(
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

function getBearerToken(request) {
  const authorization =
    request.headers.get("authorization") || "";

  if (!authorization.startsWith("Bearer ")) {
    return null;
  }

  return authorization.slice(7).trim() || null;
}

async function getAuthenticatedUser(request, supabaseAdmin) {
  const accessToken = getBearerToken(request);

  if (!accessToken) {
    return {
      user: null,
      error: "Authentication required.",
    };
  }

  const {
    data: { user },
    error,
  } = await supabaseAdmin.auth.getUser(accessToken);

  if (error || !user) {
    return {
      user: null,
      error: "Invalid or expired session.",
    };
  }

  return {
    user,
    error: null,
  };
}

function getString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeEmail(value) {
  return getString(value).toLowerCase();
}

function normalizePlan(value) {
  return getString(value).toLowerCase();
}

function normalizePaymentMethod(value) {
  return getString(value);
}

function validateHttpsUrl(value) {
  const url = getString(value);

  if (!url) {
    return null;
  }

  try {
    const parsed = new URL(url);

    if (parsed.protocol !== "https:") {
      return null;
    }

    return parsed.toString();
  } catch {
    return null;
  }
}

function buildNotes({
  plan,
  country,
  phone,
  providerReference,
  notes,
}) {
  return [
    `Plan: ${plan}`,
    `Country: ${country}`,
    `Phone: ${phone}`,
    `Transaction Reference: ${providerReference}`,
    notes ? `Notes: ${notes}` : null,
  ]
    .filter(Boolean)
    .join("\n");
}

async function findExistingPayment({
  supabaseAdmin,
  userId,
  paymentMethod,
  providerReference,
}) {
  const { data, error } = await supabaseAdmin
    .from("payments")
    .select(
      "id,status,purpose,item_name,amount,currency,payment_method,provider_reference",
    )
    .eq("user_id", userId)
    .eq("purpose", "membership")
    .eq("payment_method", paymentMethod)
    .eq("provider_reference", providerReference)
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function POST(request) {
  try {
    const supabaseAdmin = getSupabaseAdmin();

    const { user, error: authError } =
      await getAuthenticatedUser(
        request,
        supabaseAdmin,
      );

    if (!user) {
      return NextResponse.json(
        {
          error: authError,
        },
        {
          status: 401,
        },
      );
    }

    let body;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          error: "Invalid request body.",
        },
        {
          status: 400,
        },
      );
    }

    const planKey = normalizePlan(body?.plan);
    const selectedPlan = PLANS[planKey];

    if (!selectedPlan) {
      return NextResponse.json(
        {
          error: "Invalid membership plan.",
        },
        {
          status: 400,
        },
      );
    }

    const paymentMethod =
      normalizePaymentMethod(body?.paymentMethod);

    if (!VALID_PAYMENT_METHODS.has(paymentMethod)) {
      return NextResponse.json(
        {
          error: "Invalid manual payment method.",
        },
        {
          status: 400,
        },
      );
    }

    const customerName = getString(body?.customerName);
    const customerEmail = normalizeEmail(
      body?.customerEmail || user.email,
    );
    const country = getString(body?.country);
    const phone = getString(body?.phone);
    const providerReference = getString(
      body?.providerReference,
    );
    const notes = getString(body?.notes);
    const rawProofUrl = getString(body?.proofUrl);

    if (!customerName) {
      return NextResponse.json(
        {
          error: "Full name is required.",
        },
        {
          status: 400,
        },
      );
    }

    if (!customerEmail) {
      return NextResponse.json(
        {
          error: "Email is required.",
        },
        {
          status: 400,
        },
      );
    }

    if (!country) {
      return NextResponse.json(
        {
          error: "Country is required.",
        },
        {
          status: 400,
        },
      );
    }

    if (!phone) {
      return NextResponse.json(
        {
          error: "Phone number is required.",
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
            "Transaction or payment reference is required.",
        },
        {
          status: 400,
        },
      );
    }

    let proofUrl = null;

    if (rawProofUrl) {
      proofUrl = validateHttpsUrl(rawProofUrl);

      if (!proofUrl) {
        return NextResponse.json(
          {
            error:
              "Payment proof URL must be a valid HTTPS URL.",
          },
          {
            status: 400,
          },
        );
      }
    }

    const existingPayment =
      await findExistingPayment({
        supabaseAdmin,
        userId: user.id,
        paymentMethod,
        providerReference,
      });

    if (existingPayment) {
      return NextResponse.json({
        ok: true,
        duplicate: true,
        payment: existingPayment,
        message:
          "This payment reference has already been submitted.",
      });
    }

    const paymentNotes = buildNotes({
      plan: planKey,
      country,
      phone,
      providerReference,
      notes,
    });

    const { data: payment, error: insertError } =
      await supabaseAdmin
        .from("payments")
        .insert({
          user_id: user.id,
          customer_name: customerName,
          customer_email: customerEmail,
          purpose: "membership",
          item_name: selectedPlan.title,
          amount: selectedPlan.price,
          currency: "USD",
          payment_method: paymentMethod,
          status: "pending_confirmation",
          provider_reference: providerReference,
          proof_url: proofUrl,
          notes: paymentNotes,
        })
        .select(
          "id,status,purpose,item_name,amount,currency,payment_method,provider_reference",
        )
        .single();

    if (insertError) {
      throw new Error(insertError.message);
    }

    return NextResponse.json({
      ok: true,
      duplicate: false,
      payment,
      message:
        "Payment submitted and pending admin confirmation.",
    });
  } catch (error) {
    console.error(
      "MATCHUPS MANUAL PAYMENT ERROR:",
      error,
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to submit manual payment.",
      },
      {
        status: 500,
      },
    );
  }
}