// src/app/api/donations/paypal/create-order/route.js

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

const DONATION_CURRENCY =
  "USD";

const MIN_DONATION_AMOUNT =
  1;

const MAX_DONATION_AMOUNT =
  100000;

const APP_RETURN_URL =
  "dellysmatchups://paypal/donations-return";

const APP_CANCEL_URL =
  "dellysmatchups://paypal/donations-cancel";

const DONATION_PURPOSES =
  new Set([
    "Delly Singah Foundation",
    "Delly's Matchups",
    "Other Purpose",
  ]);

const FIELD_LIMITS = {
  customerName: 200,
  customerEmail: 320,
  country: 150,
  postalCode: 50,
  customerPhone: 100,
  otherPurpose: 200,
  notes: 1000,
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

function normalizeDonationAmount(
  value,
) {
  const amount =
    Number(value);

  if (
    !Number.isFinite(amount) ||
    amount <
      MIN_DONATION_AMOUNT ||
    amount >
      MAX_DONATION_AMOUNT
  ) {
    return null;
  }

  const cents =
    Math.round(
      amount * 100,
    );

  const normalized =
    cents / 100;

  if (
    Math.abs(
      amount - normalized,
    ) > 0.0000001
  ) {
    return null;
  }

  return normalized;
}

function resolveDonationPurpose({
  donationPurpose,
  otherPurpose,
}) {
  if (
    !DONATION_PURPOSES.has(
      donationPurpose,
    )
  ) {
    return {
      error:
        "Please select a valid donation purpose.",
    };
  }

  if (
    donationPurpose ===
    "Other Purpose"
  ) {
    if (!otherPurpose) {
      return {
        error:
          "Please enter the purpose of your donation.",
      };
    }

    if (
      otherPurpose.length >
      FIELD_LIMITS.otherPurpose
    ) {
      return {
        error:
          "Donation purpose is too long.",
      };
    }

    return {
      category:
        donationPurpose,
      label:
        otherPurpose,
    };
  }

  return {
    category:
      donationPurpose,
    label:
      donationPurpose,
  };
}

function validateDonorFields({
  customerName,
  customerEmail,
  country,
  postalCode,
  customerPhone,
  notes,
}) {
  if (!customerName) {
    return "Donor name is required.";
  }

  if (
    customerName.length >
    FIELD_LIMITS.customerName
  ) {
    return "Donor name is too long.";
  }

  if (
    !isValidEmail(
      customerEmail,
    )
  ) {
    return "A valid donor email is required.";
  }

  if (
    customerEmail.length >
    FIELD_LIMITS.customerEmail
  ) {
    return "Donor email is too long.";
  }

  if (!country) {
    return "Country is required.";
  }

  if (
    country.length >
    FIELD_LIMITS.country
  ) {
    return "Country is too long.";
  }

  if (!postalCode) {
    return "Postal / ZIP code is required.";
  }

  if (
    postalCode.length >
    FIELD_LIMITS.postalCode
  ) {
    return "Postal / ZIP code is too long.";
  }

  if (!customerPhone) {
    return "Phone number is required.";
  }

  if (
    customerPhone.length >
    FIELD_LIMITS.customerPhone
  ) {
    return "Phone number is too long.";
  }

  if (
    notes.length >
    FIELD_LIMITS.notes
  ) {
    return "Donation note is too long.";
  }

  return null;
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

function findPayPalApprovalUrl(
  paypalData,
) {
  const links =
    Array.isArray(
      paypalData?.links,
    )
      ? paypalData.links
      : [];

  const approvalLink =
    links.find(
      (link) =>
        (
          link?.rel ===
            "approve" ||
          link?.rel ===
            "payer-action"
        ) &&
        typeof link?.href ===
          "string" &&
        link.href.trim(),
    );

  return (
    approvalLink?.href?.trim() ||
    ""
  );
}

function createPayPalPayload({
  checkoutReference,
  donationAmount,
  purposeLabel,
  isNativeApp,
}) {
  const payload = {
    intent: "CAPTURE",

    purchase_units: [
      {
        reference_id:
          checkoutReference,

        description:
          `Delly's Matchups Donation - ${purposeLabel}`.slice(
            0,
            127,
          ),

        custom_id:
          checkoutReference,

        amount: {
          currency_code:
            DONATION_CURRENCY,

          value:
            donationAmount.toFixed(
              2,
            ),
        },
      },
    ],
  };

  if (isNativeApp) {
    payload.payment_source = {
      paypal: {
        experience_context: {
          user_action:
            "PAY_NOW",

          return_url:
            APP_RETURN_URL,

          cancel_url:
            APP_CANCEL_URL,
        },
      },
    };
  }

  return payload;
}

function buildPaymentNotes({
  country,
  postalCode,
  customerPhone,
  checkoutReference,
  donationPurpose,
  otherPurpose,
  purposeLabel,
  notes,
  isNativeApp,
}) {
  return [
    `Country: ${country}`,
    `Postal / ZIP Code: ${postalCode}`,
    `Phone: ${customerPhone}`,
    `Checkout Reference: ${checkoutReference}`,
    `Donation Purpose: ${donationPurpose}`,
    `Purpose Label: ${purposeLabel}`,

    otherPurpose
      ? `Other Purpose: ${otherPurpose}`
      : "",

    isNativeApp
      ? "Checkout Channel: Native App"
      : "Checkout Channel: Website",

    notes
      ? `Donor Note: ${notes}`
      : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export async function POST(
  request,
) {
  try {
    const body =
      await request.json();

    const channel =
      getString(
        body.channel,
      );

    const isNativeApp =
      channel === "app";

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

    const postalCode =
      getString(
        body.postalCode,
      );

    const customerPhone =
      getString(
        body.customerPhone,
      );

    const notes =
      getString(
        body.notes,
      );

    const donationPurpose =
      getString(
        body.donationPurpose,
      );

    const otherPurpose =
      getString(
        body.otherPurpose,
      );

    const donationAmount =
      normalizeDonationAmount(
        body.amount,
      );

    const donorValidationError =
      validateDonorFields({
        customerName,
        customerEmail,
        country,
        postalCode,
        customerPhone,
        notes,
      });

    if (
      donorValidationError
    ) {
      return NextResponse.json(
        {
          error:
            donorValidationError,
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
            `Donation amount must be between $${MIN_DONATION_AMOUNT} and $${MAX_DONATION_AMOUNT} and contain no more than two decimal places.`,
        },
        {
          status: 400,
        },
      );
    }

    const purposeResult =
      resolveDonationPurpose({
        donationPurpose,
        otherPurpose,
      });

    if (
      purposeResult.error
    ) {
      return NextResponse.json(
        {
          error:
            purposeResult.error,
        },
        {
          status: 400,
        },
      );
    }

    const purposeLabel =
      purposeResult.label;

    const checkoutReference =
      randomUUID();

    const accessToken =
      await getPayPalAccessToken();

    const paypalPayload =
      createPayPalPayload({
        checkoutReference,
        donationAmount,
        purposeLabel,
        isNativeApp,
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
              `donation-${checkoutReference}`,
          },

          body:
            JSON.stringify(
              paypalPayload,
            ),

          cache: "no-store",
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
        "DONATION PAYPAL CREATE ERROR:",
        paypalData,
      );

      return NextResponse.json(
        {
          error:
            paypalData.message ||
            paypalData.error_description ||
            "Unable to create PayPal donation order.",
        },
        {
          status: 502,
        },
      );
    }

    const paypalOrderId =
      getString(
        paypalData.id,
      );

    if (
      !paypalOrderId
    ) {
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

    const approvalUrl =
      findPayPalApprovalUrl(
        paypalData,
      );

    if (
      isNativeApp &&
      !approvalUrl
    ) {
      console.error(
        "DONATION PAYPAL APPROVAL URL MISSING:",
        paypalData,
      );

      return NextResponse.json(
        {
          error:
            "PayPal did not return an approval URL for the app.",
        },
        {
          status: 502,
        },
      );
    }

    const supabaseAdmin =
      createSupabaseAdmin();

    const paymentNotes =
      buildPaymentNotes({
        country,
        postalCode,
        customerPhone,
        checkoutReference,
        donationPurpose,
        otherPurpose,
        purposeLabel,
        notes,
        isNativeApp,
      });

    const {
      data: payment,
      error: paymentError,
    } =
      await supabaseAdmin
        .from("payments")
        .insert({
          customer_name:
            customerName,

          customer_email:
            customerEmail,

          purpose:
            "donation",

          item_name:
            purposeLabel,

          amount:
            donationAmount,

          currency:
            DONATION_CURRENCY,

          payment_method:
            "PayPal / Card",

          status:
            "pending",

          provider_reference:
            paypalOrderId,

          proof_url:
            null,

          notes:
            paymentNotes,
        })
        .select("id")
        .single();

    if (
      paymentError
    ) {
      console.error(
        "DONATION PAYMENT INSERT ERROR:",
        paymentError,
      );

      return NextResponse.json(
        {
          error:
            "PayPal order was created, but the donation payment record could not be saved. Please do not retry payment and contact support.",
        },
        {
          status: 500,
        },
      );
    }

    if (
      !payment?.id
    ) {
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

        orderId:
          paypalOrderId,

        paypalOrderId,

        paymentId:
          payment.id,

        amount:
          donationAmount,

        currency:
          DONATION_CURRENCY,

        donationPurpose,

        purposeLabel,

        channel:
          isNativeApp
            ? "app"
            : "web",

        approvalUrl:
          approvalUrl ||
          null,
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    console.error(
      "DONATION PAYPAL CREATE ERROR:",
      error,
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to create donation PayPal order.",
      },
      {
        status: 500,
      },
    );
  }
}
