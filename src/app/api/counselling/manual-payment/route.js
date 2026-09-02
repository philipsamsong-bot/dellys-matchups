// src/app/api/counselling/manual-payment/route.js
// ============================================================

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

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
    title:
      "International Individual Session",
    price: 100,
  },
  international_couple: {
    title:
      "International Couple Session",
    price: 250,
  },
};

const BOOKING_SERVICE_ALIASES = {
  individual:
    "individual",
  "individual session":
    "individual",

  couple:
    "couple",
  "couple session":
    "couple",

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

const MANUAL_PAYMENT_METHODS =
  new Set([
    "Mobile Money",
    "Bank Transfer",
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

function normalizeEmail(value) {
  return getString(
    value,
  ).toLowerCase();
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

function resolveBookingSessionType(
  service,
) {
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
      normalizeService(
        rawService,
      )
    ] || null
  );
}

function isValidManualPaymentMethod(
  value,
) {
  return (
    typeof value === "string" &&
    MANUAL_PAYMENT_METHODS.has(
      value,
    )
  );
}

function isValidProofUrl(value) {
  if (!value) {
    return true;
  }

  try {
    const url =
      new URL(value);

    return (
      url.protocol ===
      "https:"
    );
  } catch {
    return false;
  }
}

function getNoteValue(
  notes,
  label,
) {
  if (
    typeof notes !==
      "string" ||
    !notes
  ) {
    return "";
  }

  const prefix =
    `${label}:`;

  const line = notes
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

    const paymentMethod =
      getString(
        body.paymentMethod,
      );

    const providerReference =
      getString(
        body.providerReference,
      );

    const proofUrl =
      getString(
        body.proofUrl,
      );

    const clientNotes =
      getString(
        body.notes,
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

    if (
      !isValidManualPaymentMethod(
        paymentMethod,
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

    if (
      !providerReference
    ) {
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

    if (
      providerReference.length >
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
            "Payment proof URL must use HTTPS.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      clientNotes.length >
      1000
    ) {
      return NextResponse.json(
        {
          error:
            "Payment note is too long.",
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
        "id,full_name,email,service,preferred_date,payment_status,payment_method,paid_amount",
      )
      .eq(
        "id",
        bookingId,
      )
      .maybeSingle();

    if (
      bookingError
    ) {
      console.error(
        "COUNSELLING MANUAL BOOKING LOOKUP ERROR:",
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

    if (
      !bookingSessionType
    ) {
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
        "COUNSELLING MANUAL SESSION TYPE MISMATCH:",
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

    const {
      data: existingPayment,
      error:
        existingPaymentError,
    } = await supabaseAdmin
      .from("payments")
      .select(
        "id,customer_email,purpose,item_name,amount,currency,payment_method,status,provider_reference,proof_url,notes",
      )
      .eq(
        "purpose",
        "counselling",
      )
      .eq(
        "payment_method",
        paymentMethod,
      )
      .eq(
        "provider_reference",
        providerReference,
      )
      .maybeSingle();

    if (
      existingPaymentError
    ) {
      console.error(
        "COUNSELLING MANUAL DUPLICATE LOOKUP ERROR:",
        existingPaymentError,
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

    if (existingPayment) {
      const existingBookingId =
        getNoteValue(
          existingPayment.notes,
          "Booking ID",
        );

      const existingSessionType =
        getNoteValue(
          existingPayment.notes,
          "Session Type",
        );

      const sameSubmission =
        existingBookingId ===
          bookingId &&
        existingSessionType ===
          sessionType &&
        normalizeEmail(
          existingPayment.customer_email,
        ) ===
          customerEmail;

      if (
        !sameSubmission
      ) {
        return NextResponse.json(
          {
            error:
              "This transaction reference has already been used for another counselling payment.",
          },
          {
            status: 409,
          },
        );
      }

      if (
        existingPayment.status ===
        "paid"
      ) {
        return NextResponse.json(
          {
            error:
              "This counselling payment has already been verified as paid.",
          },
          {
            status: 409,
          },
        );
      }

      if (
        existingPayment.status !==
        "pending_confirmation"
      ) {
        return NextResponse.json(
          {
            error:
              "This transaction reference already exists in a different payment state.",
          },
          {
            status: 409,
          },
        );
      }

      const {
        error:
          retryUpdateError,
      } = await supabaseAdmin
        .from(
          "counselling_bookings",
        )
        .update({
          payment_status:
            "pending_confirmation",
          payment_method:
            paymentMethod,
          paid_amount:
            session.price,
        })
        .eq(
          "id",
          bookingId,
        );

      if (
        retryUpdateError
      ) {
        console.error(
          "COUNSELLING MANUAL RETRY BOOKING UPDATE ERROR:",
          retryUpdateError,
        );

        return NextResponse.json(
          {
            error:
              "The payment was already submitted, but the booking could not be updated.",
          },
          {
            status: 500,
          },
        );
      }

      return NextResponse.json({
        success: true,
        alreadySubmitted:
          true,
        status:
          "pending_confirmation",
        paymentId:
          existingPayment.id,
        bookingId,
        sessionType,
        amount:
          session.price,
        currency:
          "USD",
      });
    }

    const paymentNotes = [
      `Booking ID: ${bookingId}`,
      `Session Type: ${sessionType}`,
      `Service: ${getString(
        booking.service,
      )}`,
      clientNotes
        ? `Client Note: ${clientNotes}`
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
          "counselling",
        item_name:
          `Counselling - ${session.title}`,
        amount:
          session.price,
        currency:
          "USD",
        payment_method:
          paymentMethod,
        status:
          "pending_confirmation",
        provider_reference:
          providerReference,
        proof_url:
          proofUrl || null,
        notes:
          paymentNotes,
      })
      .select("id")
      .single();

    if (
      paymentError
    ) {
      console.error(
        "COUNSELLING MANUAL PAYMENT INSERT ERROR:",
        paymentError,
      );

      return NextResponse.json(
        {
          error:
            "Unable to submit the counselling payment for verification.",
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

    const {
      error:
        bookingUpdateError,
    } = await supabaseAdmin
      .from(
        "counselling_bookings",
      )
      .update({
        payment_status:
          "pending_confirmation",
        payment_method:
          paymentMethod,
        paid_amount:
          session.price,
      })
      .eq(
        "id",
        bookingId,
      );

    if (
      bookingUpdateError
    ) {
      console.error(
        "COUNSELLING MANUAL BOOKING UPDATE ERROR:",
        bookingUpdateError,
      );

      return NextResponse.json(
        {
          error:
            "The payment was submitted for verification, but the booking could not be updated. Please contact support and do not submit the payment again.",
          paymentId:
            payment.id,
        },
        {
          status: 500,
        },
      );
    }

    return NextResponse.json(
      {
        success:
          true,
        alreadySubmitted:
          false,
        status:
          "pending_confirmation",
        paymentId:
          payment.id,
        bookingId,
        sessionType,
        amount:
          session.price,
        currency:
          "USD",
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    console.error(
      "COUNSELLING MANUAL PAYMENT ERROR:",
      error,
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to submit counselling payment for verification.",
      },
      {
        status: 500,
      },
    );
  }
}
