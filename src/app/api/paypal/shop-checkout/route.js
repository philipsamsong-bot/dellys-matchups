// src/app/api/paypal/shop-checkout/route.js

import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  calculateShopCart,
  SHOP_CURRENCY,
} from "@/lib/shop-catalog";

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

const APP_RETURN_URL =
  "dellysmatchups://paypal/shop-return";

const APP_CANCEL_URL =
  "dellysmatchups://paypal/shop-cancel";

const FIELD_LIMITS = {
  customerName: 200,
  customerEmail: 320,
  customerPhone: 100,
  address: 500,
  city: 150,
  country: 150,
  postalCode: 50,
  note: 1000,
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

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    value,
  );
}

function exceedsLimit(
  value,
  limit,
) {
  return value.length > limit;
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
      "SHOP PAYPAL AUTH ERROR:",
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

function createOrderNumber() {
  return `DM-${Date.now()}-${randomUUID()
    .slice(0, 8)
    .toUpperCase()}`;
}

function buildOrderItems(
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
          link?.rel === "approve" ||
          link?.rel === "payer-action"
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

function createPayPalOrderPayload({
  calculatedCart,
  trustedItems,
  checkoutReference,
  orderNumber,
  shopOrderId,
  customerEmail,
  isNativeApp,
}) {
  const payload = {
    intent: "CAPTURE",
    purchase_units: [
      {
        reference_id:
          checkoutReference,

        description:
          `Delly's Matchups Shop - ${orderNumber}`,

        custom_id:
          JSON.stringify({
            purpose: "shop",
            shopOrderId,
            orderNumber,
            checkoutReference,
            customerEmail,
          }),

        amount: {
          currency_code:
            SHOP_CURRENCY,

          value:
            calculatedCart.total.toFixed(
              2,
            ),

          breakdown: {
            item_total: {
              currency_code:
                SHOP_CURRENCY,

              value:
                calculatedCart.subtotal.toFixed(
                  2,
                ),
            },

            shipping: {
              currency_code:
                SHOP_CURRENCY,

              value:
                calculatedCart.shipping.toFixed(
                  2,
                ),
            },
          },
        },

        items:
          trustedItems.map(
            (item) => ({
              name:
                item.title.slice(
                  0,
                  127,
                ),

              quantity:
                String(
                  item.quantity,
                ),

              unit_amount: {
                currency_code:
                  SHOP_CURRENCY,

                value:
                  Number(
                    item.price,
                  ).toFixed(
                    2,
                  ),
              },

              category:
                "PHYSICAL_GOODS",
            }),
          ),
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
      "SHOP ORDER CLEANUP ERROR:",
      error,
    );
  }
}

function validateCustomerFields({
  customerName,
  customerEmail,
  customerPhone,
  address,
  city,
  country,
  postalCode,
  customerNote,
}) {
  if (!customerName) {
    return "Customer name is required.";
  }

  if (
    exceedsLimit(
      customerName,
      FIELD_LIMITS.customerName,
    )
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
    exceedsLimit(
      customerEmail,
      FIELD_LIMITS.customerEmail,
    )
  ) {
    return "Customer email is too long.";
  }

  if (!customerPhone) {
    return "Customer phone number is required.";
  }

  if (
    exceedsLimit(
      customerPhone,
      FIELD_LIMITS.customerPhone,
    )
  ) {
    return "Customer phone number is too long.";
  }

  if (!country) {
    return "Shipping country is required.";
  }

  if (
    exceedsLimit(
      country,
      FIELD_LIMITS.country,
    )
  ) {
    return "Shipping country is too long.";
  }

  if (!address) {
    return "Shipping address is required.";
  }

  if (
    exceedsLimit(
      address,
      FIELD_LIMITS.address,
    )
  ) {
    return "Shipping address is too long.";
  }

  if (!city) {
    return "Shipping city is required.";
  }

  if (
    exceedsLimit(
      city,
      FIELD_LIMITS.city,
    )
  ) {
    return "Shipping city is too long.";
  }

  if (!postalCode) {
    return "Postal / ZIP code is required.";
  }

  if (
    exceedsLimit(
      postalCode,
      FIELD_LIMITS.postalCode,
    )
  ) {
    return "Postal / ZIP code is too long.";
  }

  if (
    exceedsLimit(
      customerNote,
      FIELD_LIMITS.note,
    )
  ) {
    return "Order note is too long.";
  }

  return null;
}

export async function POST(
  request,
) {
  let supabaseAdmin = null;
  let createdShopOrderId = null;
  let paypalOrderCreated = false;

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

    const customerNote =
      getString(
        body.note,
      );

    const customerValidationError =
      validateCustomerFields({
        customerName,
        customerEmail,
        customerPhone,
        address,
        city,
        country,
        postalCode,
        customerNote,
      });

    if (
      customerValidationError
    ) {
      return NextResponse.json(
        {
          error:
            customerValidationError,
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

    const orderNumber =
      createOrderNumber();

    const trustedItems =
      buildOrderItems(
        calculatedCart,
      );

    supabaseAdmin =
      createSupabaseAdmin();

    const orderNote = [
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
            "pending",

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
            orderNote ||
            null,

          items:
            trustedItems,

          total_amount:
            calculatedCart.total,

          payment_method:
            "PayPal / Card",

          payment_status:
            "pending",

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
        "SHOP ORDER INSERT ERROR:",
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

    const checkoutReference =
      randomUUID();

    const accessToken =
      await getPayPalAccessToken();

    const paypalPayload =
      createPayPalOrderPayload({
        calculatedCart,
        trustedItems,
        checkoutReference,
        orderNumber,
        shopOrderId:
          shopOrder.id,
        customerEmail,
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
              `shop-${checkoutReference}`,
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
        "SHOP PAYPAL CREATE ERROR:",
        paypalData,
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
            paypalData.message ||
            paypalData.error_description ||
            "Unable to create PayPal Shop order.",
        },
        {
          status: 502,
        },
      );
    }

    if (
      typeof paypalData.id !==
        "string" ||
      !paypalData.id.trim()
    ) {
      console.error(
        "SHOP PAYPAL ORDER MISSING ID:",
        paypalData,
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
            "PayPal did not return an order ID.",
        },
        {
          status: 502,
        },
      );
    }

    const paypalOrderId =
      paypalData.id.trim();

    paypalOrderCreated =
      true;

    const approvalUrl =
      findPayPalApprovalUrl(
        paypalData,
      );

    if (
      isNativeApp &&
      !approvalUrl
    ) {
      console.error(
        "SHOP PAYPAL APPROVAL URL MISSING:",
        paypalData,
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
            "PayPal did not return an approval URL for the app.",
        },
        {
          status: 502,
        },
      );
    }

    const {
      error:
        shopOrderUpdateError,
    } =
      await supabaseAdmin
        .from("shop_orders")
        .update({
          paypal_order_id:
            paypalOrderId,
        })
        .eq(
          "id",
          shopOrder.id,
        );

    if (
      shopOrderUpdateError
    ) {
      console.error(
        "SHOP ORDER PAYPAL UPDATE ERROR:",
        shopOrderUpdateError,
      );

      return NextResponse.json(
        {
          error:
            "PayPal order was created, but the Shop order could not be linked. Please do not retry payment and contact support.",
        },
        {
          status: 500,
        },
      );
    }

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
            `${calculatedCart.itemCount} Shop Item${
              calculatedCart.itemCount ===
              1
                ? ""
                : "s"
            }`,

          amount:
            calculatedCart.total,

          currency:
            SHOP_CURRENCY,

          payment_method:
            "PayPal / Card",

          status:
            "pending",

          provider_reference:
            paypalOrderId,

          proof_url:
            null,

          notes: [
            `Shop Order ID: ${shopOrder.id}`,
            `Order Number: ${orderNumber}`,
            `Checkout Reference: ${checkoutReference}`,
            `Item Count: ${calculatedCart.itemCount}`,

            isNativeApp
              ? "Checkout Channel: Native App"
              : "Checkout Channel: Website",
          ]
            .filter(Boolean)
            .join("\n"),
        })
        .select("id")
        .single();

    if (
      paymentError
    ) {
      console.error(
        "SHOP PAYMENT INSERT ERROR:",
        paymentError,
      );

      return NextResponse.json(
        {
          error:
            "PayPal order was created, but the payment record could not be created. Please do not retry payment and contact support.",
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

        orderId:
          paypalOrderId,

        paypalOrderId,

        shopOrderId:
          shopOrder.id,

        orderNumber,

        paymentId:
          payment.id,

        amount:
          calculatedCart.total,

        currency:
          SHOP_CURRENCY,

        approvalUrl:
          approvalUrl || null,
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    console.error(
      "SHOP PAYPAL CHECKOUT ERROR:",
      error,
    );

    if (
      supabaseAdmin &&
      createdShopOrderId &&
      !paypalOrderCreated
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
            : "Unable to create Shop PayPal order.",

        shopOrderId:
          createdShopOrderId,
      },
      {
        status: 500,
      },
    );
  }
}
