// src/app/api/donations/manual-payment/route.js

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL;

const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY;

const DONATION_CURRENCY = "USD";

const MIN_DONATION_AMOUNT = 1;
const MAX_DONATION_AMOUNT = 100000;

const ALLOWED_PAYMENT_METHODS = new Set([
  "Mobile Money",
  "Bank Transfer",
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

function normalizeDonationAmount(value) {
  const amount = Number(value);

  if (
    !Number.isFinite(amount) ||
    amount < MIN_DONATION_AMOUNT ||
    amount > MAX_DONATION_AMOUNT
  ) {
    return null;
  }

  return Number(amount.toFixed(2));
}

function isValidProofUrl(value) {
  if (!value) {
    return true;
  }

  try {
    const url = new URL(value);

    return url.protocol === "https:";
  } catch {
    return false;
  }
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

export async function POST(request) {
  try {
    const body = await request.json();

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

    const paymentMethod =
      getString(body.paymentMethod);

    const transactionReference =
      getString(
        body.transactionReference,
      );

    const proofUrl =
      getString(body.proofUrl);

    const notes =
      getString(body.notes);

    const donationAmount =
      normalizeDonationAmount(
        body.amount,
      );

    if (!customerName) {
      return NextResponse.json(
        {
          error:
            "Donor name is required.",
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
            "A valid donor email is required.",
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
      donationAmount === null
    ) {
      return NextResponse.json(
        {
          error:
            `Donation amount must be between $${MIN_DONATION_AMOUNT} and $${MAX_DONATION_AMOUNT}.`,
        },
        {
          status: 400,
        },
      );
    }

    if (
      !ALLOWED_PAYMENT_METHODS.has(
        paymentMethod,
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Payment method must be Mobile Money or Bank Transfer.",
        },
        {
          status: 400,
        },
      );
    }

    if (!transactionReference) {
      return NextResponse.json(
        {
          error:
            "Transaction / payment reference is required.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      transactionReference.length >
      200
    ) {
      return NextResponse.json(
        {
          error:
            "Transaction reference is too long.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      !isValidProofUrl(
        proofUrl,
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Payment proof must use a valid HTTPS URL.",
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
            "Donation note is too long.",
        },
        {
          status: 400,
        },
      );
    }

    const supabaseAdmin =
      createSupabaseAdmin();

    const {
      data: existingPayments,
      error:
        duplicateLookupError,
    } = await supabaseAdmin
      .from("payments")
      .select(
        "id,customer_name,customer_email,amount,currency,payment_method,status,provider_reference,proof_url,notes",
      )
      .eq(
        "purpose",
        "donation",
      )
      .eq(
        "payment_method",
        paymentMethod,
      )
      .eq(
        "provider_reference",
        transactionReference,
      )
      .limit(2);

    if (
      duplicateLookupError
    ) {
      console.error(
        "DONATION MANUAL DUPLICATE LOOKUP ERROR:",
        duplicateLookupError,
      );

      return NextResponse.json(
        {
          error:
            "Unable to verify the transaction reference.",
        },
        {
          status: 500,
        },
      );
    }

    if (
      Array.isArray(
        existingPayments,
      ) &&
      existingPayments.length > 0
    ) {
      const existing =
        existingPayments[0];

      const isSameSubmission =
        normalizeEmail(
          existing.customer_email,
        ) === customerEmail &&
        existing.payment_method ===
          paymentMethod &&
        existing.provider_reference ===
          transactionReference &&
        existing.currency ===
          DONATION_CURRENCY &&
        amountsMatch(
          existing.amount,
          donationAmount,
        ) &&
        existing.status ===
          "pending_confirmation";

      if (isSameSubmission) {
        return NextResponse.json({
          success: true,
          alreadySubmitted: true,
          status:
            "pending_confirmation",
          paymentId:
            existing.id,
          amount:
            Number(
              existing.amount,
            ),
          currency:
            DONATION_CURRENCY,
          paymentMethod:
            existing.payment_method,
        });
      }

      return NextResponse.json(
        {
          error:
            "That transaction reference has already been used for another donation.",
        },
        {
          status: 409,
        },
      );
    }

    const paymentNotes = [
      `Country: ${country}`,
      `Postal / ZIP Code: ${postalCode}`,
      `Phone: ${customerPhone}`,
      `Transaction Reference: ${transactionReference}`,
      notes
        ? `Donor Note: ${notes}`
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
          "donation",
        item_name:
          "One-time Donation",
        amount:
          donationAmount,
        currency:
          DONATION_CURRENCY,
        payment_method:
          paymentMethod,
        status:
          "pending_confirmation",
        provider_reference:
          transactionReference,
        proof_url:
          proofUrl || null,
        notes:
          paymentNotes,
      })
      .select(
        "id,status,amount,currency,payment_method",
      )
      .single();

    if (paymentError) {
      console.error(
        "DONATION MANUAL PAYMENT INSERT ERROR:",
        paymentError,
      );

      return NextResponse.json(
        {
          error:
            "Unable to save the donation payment submission.",
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
            "Donation payment record was not returned.",
        },
        {
          status: 500,
        },
      );
    }

    return NextResponse.json(
      {
        success: true,
        alreadySubmitted: false,
        status:
          "pending_confirmation",
        paymentId:
          payment.id,
        amount:
          Number(
            payment.amount,
          ),
        currency:
          payment.currency,
        paymentMethod:
          payment.payment_method,
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    console.error(
      "DONATION MANUAL PAYMENT ERROR:",
      error,
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to submit the donation.",
      },
      {
        status: 500,
      },
    );
  }
}
