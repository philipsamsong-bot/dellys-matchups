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

const ALLOWED_PAYMENT_METHODS = new Set([
  "Mobile Money",
  "Bank Transfer",
]);

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

function getString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeEmail(value) {
  return getString(value).toLowerCase();
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
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

function createOrderNumber() {
  return `DM-${Date.now()}-${randomUUID()
    .slice(0, 8)
    .toUpperCase()}`;
}

function buildTrustedItems(calculatedCart) {
  return calculatedCart.items.map((item) => ({
    id: item.id,
    type: item.type,
    category: item.category,
    title: item.title,
    image: item.image,
    price: item.unitPrice,
    quantity: item.quantity,
    subtotal: item.subtotal,
    currency: item.currency,
  }));
}

function buildOrderNote({
  postalCode,
  customerNote,
  transactionReference,
}) {
  return [
    `Postal / ZIP Code: ${postalCode}`,
    `Transaction Reference: ${transactionReference}`,
    customerNote
      ? `Customer Note: ${customerNote}`
      : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export async function POST(request) {
  let createdShopOrderId = null;

  try {
    const body = await request.json();

    const cart = body.cart;

    const customerName =
      getString(body.customerName);

    const customerEmail =
      normalizeEmail(body.customerEmail);

    const customerPhone =
      getString(body.customerPhone);

    const address =
      getString(body.address);

    const city =
      getString(body.city);

    const country =
      getString(body.country);

    const postalCode =
      getString(body.postalCode);

    const paymentMethod =
      getString(body.paymentMethod);

    const transactionReference =
      getString(body.transactionReference);

    const proofUrl =
      getString(body.proofUrl);

    const customerNote =
      getString(body.note);

    if (!customerName) {
      return NextResponse.json(
        {
          error: "Customer name is required.",
        },
        {
          status: 400,
        },
      );
    }

    if (!isValidEmail(customerEmail)) {
      return NextResponse.json(
        {
          error: "A valid customer email is required.",
        },
        {
          status: 400,
        },
      );
    }

    if (!customerPhone) {
      return NextResponse.json(
        {
          error: "Customer phone number is required.",
        },
        {
          status: 400,
        },
      );
    }

    if (!address) {
      return NextResponse.json(
        {
          error: "Delivery address is required.",
        },
        {
          status: 400,
        },
      );
    }

    if (!city) {
      return NextResponse.json(
        {
          error: "Delivery city is required.",
        },
        {
          status: 400,
        },
      );
    }

    if (!country) {
      return NextResponse.json(
        {
          error: "Delivery country is required.",
        },
        {
          status: 400,
        },
      );
    }

    if (!postalCode) {
      return NextResponse.json(
        {
          error: "Postal / ZIP code is required.",
        },
        {
          status: 400,
        },
      );
    }

    if (!ALLOWED_PAYMENT_METHODS.has(paymentMethod)) {
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

    if (transactionReference.length > 200) {
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

    if (!isValidProofUrl(proofUrl)) {
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

    if (customerNote.length > 1000) {
      return NextResponse.json(
        {
          error: "Order note is too long.",
        },
        {
          status: 400,
        },
      );
    }

    let calculatedCart;

    try {
      calculatedCart =
        calculateShopCart(cart);
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
      calculatedCart.total <= 0 ||
      calculatedCart.currency !== SHOP_CURRENCY
    ) {
      return NextResponse.json(
        {
          error: "Invalid Shop order total.",
        },
        {
          status: 400,
        },
      );
    }

    const trustedItems =
      buildTrustedItems(calculatedCart);

    const supabaseAdmin =
      createSupabaseAdmin();

    const {
      data: existingPayments,
      error: duplicateLookupError,
    } = await supabaseAdmin
      .from("payments")
      .select(
        "id,customer_email,payment_method,status,provider_reference,notes",
      )
      .eq("purpose", "shop")
      .eq(
        "payment_method",
        paymentMethod,
      )
      .eq(
        "provider_reference",
        transactionReference,
      )
      .limit(2);

    if (duplicateLookupError) {
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

    if (
      Array.isArray(existingPayments) &&
      existingPayments.length > 0
    ) {
      const existing =
        existingPayments[0];

      const existingShopOrderId =
        getString(existing.notes)
          .split("\n")
          .find((line) =>
            line.startsWith("Shop Order ID:"),
          )
          ?.replace(
            "Shop Order ID:",
            "",
          )
          .trim() || "";

      if (
        normalizeEmail(existing.customer_email) ===
          customerEmail &&
        existing.payment_method === paymentMethod &&
        existing.provider_reference ===
          transactionReference &&
        existing.status ===
          "pending_confirmation"
      ) {
        return NextResponse.json({
          success: true,
          alreadySubmitted: true,
          status: "pending_confirmation",
          paymentId: existing.id,
          shopOrderId:
            existingShopOrderId || null,
        });
      }

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

    const orderNumber =
      createOrderNumber();

    const {
      data: shopOrder,
      error: shopOrderError,
    } = await supabaseAdmin
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

    if (shopOrderError) {
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

    if (!shopOrder?.id) {
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

    const paymentNotes = [
      `Shop Order ID: ${shopOrder.id}`,
      `Order Number: ${orderNumber}`,
      `Transaction Reference: ${transactionReference}`,
      `Item Count: ${calculatedCart.itemCount}`,
      `Postal / ZIP Code: ${postalCode}`,
      customerNote
        ? `Customer Note: ${customerNote}`
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
          "shop",
        item_name:
          `${calculatedCart.itemCount} Shop Item${
            calculatedCart.itemCount === 1
              ? ""
              : "s"
          }`,
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
          proofUrl || null,
        notes:
          paymentNotes,
      })
      .select("id")
      .single();

    if (paymentError) {
      console.error(
        "SHOP MANUAL PAYMENT INSERT ERROR:",
        paymentError,
      );

      await supabaseAdmin
        .from("shop_orders")
        .delete()
        .eq(
          "id",
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

    if (!payment?.id) {
      await supabaseAdmin
        .from("shop_orders")
        .delete()
        .eq(
          "id",
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
