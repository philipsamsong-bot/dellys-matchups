// src/app/api/shop/manual-payment/route.js

import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  calculateShopCart,
  SHOP_CURRENCY,
} from "@/lib/shop-catalog";

export const runtime = "nodejs";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL;

const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY;

const ALLOWED_PAYMENT_METHODS = [
  "Mobile Money",
  "Bank Transfer",
];

const FIELD_LIMITS = {
  customerName: 200,
  customerEmail: 320,
  customerPhone: 100,
  address: 500,
  city: 150,
  country: 150,
  postalCode: 50,
  transactionReference: 200,
  note: 1000,
  proofUrl: 2000,
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

function isValidProofUrl(value) {
  if (!value) {
    return true;
  }

  try {
    const url = new URL(value);

    return (
      url.protocol === "https:"
    );
  } catch {
    return false;
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

function createOrderNumber() {
  return `DM-${Date.now()}-${randomUUID()
    .slice(0, 8)
    .toUpperCase()}`;
}

function buildTrustedItems(
  calculatedCart,
) {
  return calculatedCart.items.map(
    (item) => ({
      id: item.id,
      type: item.type,
      category: item.category,
      title: item.title,
      image: item.image,
      price: item.unitPrice,
      quantity: item.quantity,
      subtotal: item.subtotal,
      currency: item.currency,
    }),
  );
}

function expectedItemName(
  calculatedCart,
) {
  return `${calculatedCart.itemCount} Shop Item${
    calculatedCart.itemCount === 1
      ? ""
      : "s"
  }`;
}

function buildOrderNote({
  postalCode,
  customerNote,
  transactionReference,
  isNativeApp,
}) {
  return [
    `Postal / ZIP Code: ${postalCode}`,
    `Transaction Reference: ${transactionReference}`,

    customerNote
      ? `Customer Note: ${customerNote}`
      : "",

    isNativeApp
      ? "Checkout Channel: Native App"
      : "Checkout Channel: Website",
  ]
    .filter(Boolean)
    .join("\n");
}

function buildPaymentNotes({
  shopOrderId,
  orderNumber,
  transactionReference,
  itemCount,
  postalCode,
  customerNote,
  isNativeApp,
}) {
  return [
    `Shop Order ID: ${shopOrderId}`,
    `Order Number: ${orderNumber}`,
    `Transaction Reference: ${transactionReference}`,
    `Item Count: ${itemCount}`,
    `Postal / ZIP Code: ${postalCode}`,

    customerNote
      ? `Customer Note: ${customerNote}`
      : "",

    isNativeApp
      ? "Checkout Channel: Native App"
      : "Checkout Channel: Website",
  ]
    .filter(Boolean)
    .join("\n");
}

function validateInput({
  customerName,
  customerEmail,
  customerPhone,
  address,
  city,
  country,
  postalCode,
  paymentMethod,
  transactionReference,
  proofUrl,
  customerNote,
}) {
  if (!customerName) {
    return "Customer name is required.";
  }

  if (
    customerName.length >
    FIELD_LIMITS.customerName
  ) {
    return "Customer name is too long.";
  }

  if (
    !isValidEmail(
      customerEmail,
    )
  ) {
    return "A valid customer email is required.";
  }

  if (
    customerEmail.length >
    FIELD_LIMITS.customerEmail
  ) {
    return "Customer email is too long.";
  }

  if (!customerPhone) {
    return "Customer phone number is required.";
  }

  if (
    customerPhone.length >
    FIELD_LIMITS.customerPhone
  ) {
    return "Customer phone number is too long.";
  }

  if (!address) {
    return "Delivery address is required.";
  }

  if (
    address.length >
    FIELD_LIMITS.address
  ) {
    return "Delivery address is too long.";
  }

  if (!city) {
    return "Delivery city is required.";
  }

  if (
    city.length >
    FIELD_LIMITS.city
  ) {
    return "Delivery city is too long.";
  }

  if (!country) {
    return "Delivery country is required.";
  }

  if (
    country.length >
    FIELD_LIMITS.country
  ) {
    return "Delivery country is too long.";
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

  if (
    !ALLOWED_PAYMENT_METHODS.includes(
      paymentMethod,
    )
  ) {
    return "Payment method must be Mobile Money or Bank Transfer.";
  }

  if (
    !transactionReference
  ) {
    return "Transaction / payment reference is required.";
  }

  if (
    transactionReference.length >
    FIELD_LIMITS.transactionReference
  ) {
    return "Transaction reference is too long.";
  }

  if (
    proofUrl.length >
    FIELD_LIMITS.proofUrl
  ) {
    return "Payment proof URL is too long.";
  }

  if (
    !isValidProofUrl(
      proofUrl,
    )
  ) {
    return "Payment proof must use a valid HTTPS URL.";
  }

  if (
    customerNote.length >
    FIELD_LIMITS.note
  ) {
    return "Order note is too long.";
  }

  return null;
}

async function deleteShopOrder(
  supabaseAdmin,
  shopOrderId,
) {
  if (
    !supabaseAdmin ||
    !shopOrderId
  ) {
    return;
  }

  const { error } =
    await supabaseAdmin
      .from("shop_orders")
      .delete()
      .eq(
        "id",
        shopOrderId,
      );

  if (error) {
    console.error(
      "SHOP MANUAL ORDER CLEANUP ERROR:",
      error,
    );
  }
}

async function handleExistingPayment({
  supabaseAdmin,
  existingPayments,
  calculatedCart,
  customerName,
  customerEmail,
  paymentMethod,
  transactionReference,
}) {
  if (
    !Array.isArray(
      existingPayments,
    ) ||
    existingPayments.length === 0
  ) {
    return null;
  }

  if (
    existingPayments.length > 1
  ) {
    console.error(
      "SHOP MANUAL DUPLICATE REFERENCES:",
      {
        transactionReference,
        paymentIds:
          existingPayments.map(
            (payment) =>
              payment.id,
          ),
      },
    );

    return NextResponse.json(
      {
        error:
          "This transaction reference is associated with multiple Shop payment records. Please contact support.",
      },
      {
        status: 409,
      },
    );
  }

  const existing =
    existingPayments[0];

  const shopOrderId =
    getNoteValue(
      existing.notes,
      "Shop Order ID",
    );

  const orderNumber =
    getNoteValue(
      existing.notes,
      "Order Number",
    );

  if (
    existing.status === "paid"
  ) {
    return NextResponse.json(
      {
        error:
          "That transaction reference has already been confirmed as paid.",
      },
      {
        status: 409,
      },
    );
  }

  const expectedName =
    expectedItemName(
      calculatedCart,
    );

  const sameSubmission =
    normalizeEmail(
      existing.customer_email,
    ) ===
      customerEmail &&
    getString(
      existing.customer_name,
    ) ===
      customerName &&
    existing.payment_method ===
      paymentMethod &&
    existing.provider_reference ===
      transactionReference &&
    existing.status ===
      "pending_confirmation" &&
    existing.currency ===
      SHOP_CURRENCY &&
    amountsMatch(
      existing.amount,
      calculatedCart.total,
    ) &&
    existing.item_name ===
      expectedName;

  if (!sameSubmission) {
    return NextResponse.json(
      {
        error:
          "That transaction reference has already been used for another Shop payment.",
      },
      {
        status: 409,
      },
    );
  }

  if (!shopOrderId) {
    return NextResponse.json(
      {
        error:
          "The existing Shop payment is missing its order reference. Please contact support.",
      },
      {
        status: 409,
      },
    );
  }

  const {
    data: existingShopOrder,
    error: shopOrderLookupError,
  } =
    await supabaseAdmin
      .from("shop_orders")
      .select(
        "id,order_number,customer_name,customer_email,total_amount,payment_method,payment_status",
      )
      .eq(
        "id",
        shopOrderId,
      )
      .maybeSingle();

  if (
    shopOrderLookupError
  ) {
    console.error(
      "SHOP MANUAL RETRY ORDER LOOKUP ERROR:",
      shopOrderLookupError,
    );

    return NextResponse.json(
      {
        error:
          "Unable to verify the existing Shop order.",
      },
      {
        status: 500,
      },
    );
  }

  if (!existingShopOrder) {
    return NextResponse.json(
      {
        error:
          "The existing Shop order could not be found. Please contact support.",
      },
      {
        status: 409,
      },
    );
  }

  const existingOrderMatches =
    normalizeEmail(
      existingShopOrder.customer_email,
    ) ===
      customerEmail &&
    getString(
      existingShopOrder.customer_name,
    ) ===
      customerName &&
    existingShopOrder.payment_method ===
      paymentMethod &&
    existingShopOrder.payment_status ===
      "pending_confirmation" &&
    amountsMatch(
      existingShopOrder.total_amount,
      calculatedCart.total,
    ) &&
    (
      !orderNumber ||
      existingShopOrder.order_number ===
        orderNumber
    );

  if (
    !existingOrderMatches
  ) {
    return NextResponse.json(
      {
        error:
          "The existing Shop order does not match this payment submission.",
      },
      {
        status: 409,
      },
    );
  }

  return NextResponse.json({
    success: true,
    alreadySubmitted: true,
    status:
      "pending_confirmation",
    paymentId:
      existing.id,
    shopOrderId:
      existingShopOrder.id,
    orderNumber:
      existingShopOrder.order_number,
    amount:
      Number(
        existingShopOrder.total_amount,
      ),
    currency:
      SHOP_CURRENCY,
    paymentMethod:
      existing.payment_method,
  });
}

export async function POST(
  request,
) {
  let supabaseAdmin = null;
  let createdShopOrderId =
    null;

  try {
    const body =
      await request.json();

    const cart =
      body.cart;

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

    const customerPhone =
      getString(
        body.customerPhone,
      );

    const address =
      getString(
        body.address,
      );

    const city =
      getString(
        body.city,
      );

    const country =
      getString(
        body.country,
      );

    const postalCode =
      getString(
        body.postalCode,
      );

    const paymentMethod =
      getString(
        body.paymentMethod,
      );

    const transactionReference =
      getString(
        body.transactionReference,
      );

    const proofUrl =
      getString(
        body.proofUrl,
      );

    const customerNote =
      getString(
        body.note,
      );

    const validationError =
      validateInput({
        customerName,
        customerEmail,
        customerPhone,
        address,
        city,
        country,
        postalCode,
        paymentMethod,
        transactionReference,
        proofUrl,
        customerNote,
      });

    if (
      validationError
    ) {
      return NextResponse.json(
        {
          error:
            validationError,
        },
        {
          status: 400,
        },
      );
    }

    let calculatedCart;

    try {
      calculatedCart =
        calculateShopCart(
          cart,
        );
    } catch (error) {
      return NextResponse.json(
        {
          error:
            error instanceof Error
              ? error.message
              : "Invalid Shop cart.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      calculatedCart.total <=
        0 ||
      calculatedCart.currency !==
        SHOP_CURRENCY
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid Shop order total.",
        },
        {
          status: 400,
        },
      );
    }

    const trustedItems =
      buildTrustedItems(
        calculatedCart,
      );

    supabaseAdmin =
      createSupabaseAdmin();

    const {
      data: existingPayments,
      error:
        duplicateLookupError,
    } =
      await supabaseAdmin
        .from("payments")
        .select(
          "id,customer_name,customer_email,purpose,item_name,amount,currency,payment_method,status,provider_reference,proof_url,notes",
        )
        .eq(
          "purpose",
          "shop",
        )
        .eq(
          "provider_reference",
          transactionReference,
        )
        .in(
          "payment_method",
          ALLOWED_PAYMENT_METHODS,
        )
        .limit(2);

    if (
      duplicateLookupError
    ) {
      console.error(
        "SHOP MANUAL DUPLICATE LOOKUP ERROR:",
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

    const existingResponse =
      await handleExistingPayment({
        supabaseAdmin,
        existingPayments,
        calculatedCart,
        customerName,
        customerEmail,
        paymentMethod,
        transactionReference,
      });

    if (
      existingResponse
    ) {
      return existingResponse;
    }

    const orderNumber =
      createOrderNumber();

    const {
      data: shopOrder,
      error: shopOrderError,
    } =
      await supabaseAdmin
        .from("shop_orders")
        .insert({
          order_number:
            orderNumber,

          shipping_amount:
            calculatedCart.shipping,

          status:
            "pending_confirmation",

          customer_name:
            customerName,

          customer_email:
            customerEmail,

          customer_phone:
            customerPhone,

          address,

          city,

          country,

          note:
            buildOrderNote({
              postalCode,
              customerNote,
              transactionReference,
              isNativeApp,
            }),

          items:
            trustedItems,

          total_amount:
            calculatedCart.total,

          payment_method:
            paymentMethod,

          payment_status:
            "pending_confirmation",

          paypal_order_id:
            null,
        })
        .select(
          "id,order_number",
        )
        .single();

    if (
      shopOrderError
    ) {
      console.error(
        "SHOP MANUAL ORDER INSERT ERROR:",
        shopOrderError,
      );

      return NextResponse.json(
        {
          error:
            "Unable to create the Shop order.",
        },
        {
          status: 500,
        },
      );
    }

    if (
      !shopOrder?.id
    ) {
      return NextResponse.json(
        {
          error:
            "Shop order record was not returned.",
        },
        {
          status: 500,
        },
      );
    }

    createdShopOrderId =
      shopOrder.id;

    const paymentNotes =
      buildPaymentNotes({
        shopOrderId:
          shopOrder.id,
        orderNumber,
        transactionReference,
        itemCount:
          calculatedCart.itemCount,
        postalCode,
        customerNote,
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
            "shop",

          item_name:
            expectedItemName(
              calculatedCart,
            ),

          amount:
            calculatedCart.total,

          currency:
            SHOP_CURRENCY,

          payment_method:
            paymentMethod,

          status:
            "pending_confirmation",

          provider_reference:
            transactionReference,

          proof_url:
            proofUrl ||
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
        "SHOP MANUAL PAYMENT INSERT ERROR:",
        paymentError,
      );

      await deleteShopOrder(
        supabaseAdmin,
        shopOrder.id,
      );

      createdShopOrderId =
        null;

      return NextResponse.json(
        {
          error:
            "Unable to save the Shop payment submission.",
        },
        {
          status: 500,
        },
      );
    }

    if (
      !payment?.id
    ) {
      await deleteShopOrder(
        supabaseAdmin,
        shopOrder.id,
      );

      createdShopOrderId =
        null;

      return NextResponse.json(
        {
          error:
            "Shop payment record was not returned.",
        },
        {
          status: 500,
        },
      );
    }

    return NextResponse.json(
      {
        success: true,

        alreadySubmitted:
          false,

        status:
          "pending_confirmation",

        shopOrderId:
          shopOrder.id,

        orderNumber,

        paymentId:
          payment.id,

        amount:
          calculatedCart.total,

        currency:
          SHOP_CURRENCY,

        paymentMethod,
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    console.error(
      "SHOP MANUAL PAYMENT ERROR:",
      error,
    );

    if (
      supabaseAdmin &&
      createdShopOrderId
    ) {
      await deleteShopOrder(
        supabaseAdmin,
        createdShopOrderId,
      );

      createdShopOrderId =
        null;
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to submit the Shop manual payment.",

        shopOrderId:
          createdShopOrderId,
      },
      {
        status: 500,
      },
    );
  }
}
