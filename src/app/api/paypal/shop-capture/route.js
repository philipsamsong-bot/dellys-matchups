// src/app/api/paypal/shop-capture/route.js

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { SHOP_CURRENCY } from "@/lib/shop-catalog";

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

const RESEND_API_KEY =
  process.env.RESEND_API_KEY;

const RESEND_FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL;

const ADMIN_EMAIL =
  process.env.ADMIN_EMAIL;

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

function parseCustomMetadata(
  value,
) {
  if (
    !value ||
    typeof value !== "string"
  ) {
    return null;
  }

  try {
    const parsed =
      JSON.parse(value);

    return (
      parsed &&
      typeof parsed ===
        "object"
        ? parsed
        : null
    );
  } catch {
    return null;
  }
}

function escapeHtml(value) {
  return String(
    value ?? "",
  )
    .replaceAll(
      "&",
      "&amp;",
    )
    .replaceAll(
      "<",
      "&lt;",
    )
    .replaceAll(
      ">",
      "&gt;",
    )
    .replaceAll(
      '"',
      "&quot;",
    )
    .replaceAll(
      "'",
      "&#039;",
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
        autoRefreshToken:
          false,
        persistSession:
          false,
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
    ).toString(
      "base64",
    );

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

  if (
    !data.access_token
  ) {
    throw new Error(
      "PayPal did not return an access token.",
    );
  }

  return data.access_token;
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
    await parsePayPalResponse(
      response,
    );

  if (!response.ok) {
    console.error(
      "SHOP PAYPAL GET ORDER ERROR:",
      data,
    );

    throw new Error(
      data.message ||
        "Unable to retrieve PayPal Shop order.",
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
            `shop-capture-${orderId}`,
        },
        body: "{}",
        cache: "no-store",
      },
    );

  const data =
    await parsePayPalResponse(
      response,
    );

  if (response.ok) {
    return data;
  }

  console.error(
    "SHOP PAYPAL CAPTURE RESPONSE:",
    data,
  );

  const retrievedOrder =
    await getPayPalOrder(
      accessToken,
      orderId,
    );

  if (
    retrievedOrder.status ===
    "COMPLETED"
  ) {
    return retrievedOrder;
  }

  throw new Error(
    data.message ||
      "PayPal could not capture this Shop payment.",
  );
}

function findCompletedCapture(
  purchaseUnit,
) {
  const captures =
    Array.isArray(
      purchaseUnit?.payments
        ?.captures,
    )
      ? purchaseUnit.payments
          .captures
      : [];

  const completedCaptures =
    captures.filter(
      (capture) =>
        capture?.status ===
        "COMPLETED",
    );

  if (
    completedCaptures.length ===
    0
  ) {
    return null;
  }

  if (
    completedCaptures.length >
    1
  ) {
    throw new Error(
      "Unexpected multiple completed PayPal captures were found.",
    );
  }

  return completedCaptures[0];
}

function getShopItemCount(
  items,
) {
  if (
    !Array.isArray(items)
  ) {
    return 0;
  }

  return items.reduce(
    (total, item) => {
      const quantity =
        Number(
          item?.quantity,
        );

      if (
        !Number.isInteger(
          quantity,
        ) ||
        quantity <= 0
      ) {
        return total;
      }

      return (
        total +
        quantity
      );
    },
    0,
  );
}

function expectedPaymentItemName(
  shopOrder,
) {
  const itemCount =
    getShopItemCount(
      shopOrder.items,
    );

  if (
    itemCount <= 0
  ) {
    throw new Error(
      "Stored Shop order contains no valid items.",
    );
  }

  return `${itemCount} Shop Item${
    itemCount === 1
      ? ""
      : "s"
  }`;
}

function verifyStoredRecords({
  payment,
  shopOrder,
  orderId,
  orderNumber,
}) {
  if (
    payment.purpose !==
    "shop"
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
      "Stored payment method is not PayPal / Card.",
    );
  }

  if (
    shopOrder.payment_method !==
    "PayPal / Card"
  ) {
    throw new Error(
      "Stored Shop order payment method is not PayPal / Card.",
    );
  }

  if (
    shopOrder.order_number !==
    orderNumber
  ) {
    throw new Error(
      "Stored Shop order number does not match the payment.",
    );
  }

  if (
    shopOrder.paypal_order_id !==
    orderId
  ) {
    throw new Error(
      "Stored PayPal order ID does not match the Shop order.",
    );
  }

  if (
    payment.provider_reference !==
    orderId
  ) {
    throw new Error(
      "Stored payment reference does not match the PayPal order.",
    );
  }

  if (
    normalizeEmail(
      shopOrder.customer_email,
    ) !==
    normalizeEmail(
      payment.customer_email,
    )
  ) {
    throw new Error(
      "Shop customer does not match the payment.",
    );
  }

  if (
    payment.currency !==
    SHOP_CURRENCY
  ) {
    throw new Error(
      "Stored Shop payment currency is invalid.",
    );
  }

  if (
    !amountsMatch(
      payment.amount,
      shopOrder.total_amount,
    )
  ) {
    throw new Error(
      "Stored Shop payment amount does not match the order.",
    );
  }

  const expectedItemName =
    expectedPaymentItemName(
      shopOrder,
    );

  if (
    payment.item_name !==
    expectedItemName
  ) {
    throw new Error(
      "Stored Shop payment item information does not match the order.",
    );
  }

  const totalAmount =
    Number(
      shopOrder.total_amount,
    );

  if (
    !Number.isFinite(
      totalAmount,
    ) ||
    totalAmount <= 0
  ) {
    throw new Error(
      "Stored Shop order total is invalid.",
    );
  }
}

function verifyPayPalOrder({
  order,
  orderId,
  shopOrder,
  checkoutReference,
}) {
  if (
    !order ||
    order.id !== orderId
  ) {
    throw new Error(
      "PayPal Shop order ID verification failed.",
    );
  }

  if (
    order.status !==
    "COMPLETED"
  ) {
    throw new Error(
      "PayPal Shop payment is not completed.",
    );
  }

  const purchaseUnits =
    Array.isArray(
      order.purchase_units,
    )
      ? order.purchase_units
      : [];

  if (
    purchaseUnits.length !==
    1
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
      "PayPal Shop checkout reference verification failed.",
    );
  }

  if (
    purchaseUnit.amount
      ?.currency_code !==
    SHOP_CURRENCY
  ) {
    throw new Error(
      "PayPal Shop currency verification failed.",
    );
  }

  if (
    !amountsMatch(
      purchaseUnit.amount
        ?.value,
      shopOrder.total_amount,
    )
  ) {
    throw new Error(
      "PayPal Shop amount verification failed.",
    );
  }

  const metadata =
    parseCustomMetadata(
      purchaseUnit.custom_id,
    );

  if (!metadata) {
    throw new Error(
      "PayPal Shop metadata is missing or invalid.",
    );
  }

  if (
    metadata.purpose !==
    "shop"
  ) {
    throw new Error(
      "PayPal Shop purpose verification failed.",
    );
  }

  if (
    String(
      metadata.shopOrderId,
    ) !==
    String(
      shopOrder.id,
    )
  ) {
    throw new Error(
      "PayPal Shop order reference verification failed.",
    );
  }

  if (
    metadata.orderNumber !==
    shopOrder.order_number
  ) {
    throw new Error(
      "PayPal Shop order number verification failed.",
    );
  }

  if (
    metadata.checkoutReference !==
    checkoutReference
  ) {
    throw new Error(
      "PayPal Shop metadata checkout reference verification failed.",
    );
  }

  if (
    normalizeEmail(
      metadata.customerEmail,
    ) !==
    normalizeEmail(
      shopOrder.customer_email,
    )
  ) {
    throw new Error(
      "PayPal Shop customer verification failed.",
    );
  }

  const completedCapture =
    findCompletedCapture(
      purchaseUnit,
    );

  if (
    !completedCapture
  ) {
    throw new Error(
      "Completed PayPal Shop capture was not found.",
    );
  }

  if (
    !getString(
      completedCapture.id,
    )
  ) {
    throw new Error(
      "PayPal Shop capture ID is missing.",
    );
  }

  if (
    completedCapture.amount
      ?.currency_code !==
    SHOP_CURRENCY
  ) {
    throw new Error(
      "PayPal Shop captured currency verification failed.",
    );
  }

  if (
    !amountsMatch(
      completedCapture.amount
        ?.value,
      shopOrder.total_amount,
    )
  ) {
    throw new Error(
      "PayPal Shop captured amount verification failed.",
    );
  }

  return {
    captureId:
      completedCapture.id,
  };
}

function appendPaymentNote(
  notes,
  line,
) {
  const existing =
    getString(notes);

  if (!line) {
    return existing;
  }

  if (
    existing
      .split("\n")
      .map((item) =>
        item.trim(),
      )
      .includes(line)
  ) {
    return existing;
  }

  return [
    existing,
    line,
  ]
    .filter(Boolean)
    .join("\n");
}

function createItemList(items) {
  if (
    !Array.isArray(items)
  ) {
    return "";
  }

  return items
    .map((item) => {
      const title =
        escapeHtml(
          item?.title ||
            "Shop Item",
        );

      const quantity =
        Number(
          item?.quantity,
        ) || 1;

      const unitPrice =
        Number(
          item?.price ??
            item?.unitPrice ??
            0,
        );

      return `
        <li>
          ${title}
          × ${quantity}
          — $${unitPrice.toFixed(2)} each
        </li>
      `;
    })
    .join("");
}

async function sendOrderEmails(
  order,
) {
  if (
    !RESEND_API_KEY ||
    !RESEND_FROM_EMAIL ||
    !ADMIN_EMAIL
  ) {
    console.error(
      "SHOP ORDER EMAIL ENVIRONMENT VARIABLES ARE MISSING",
    );

    return false;
  }

  try {
    const resend =
      new Resend(
        RESEND_API_KEY,
      );

    const customerName =
      escapeHtml(
        order.customer_name ||
          "Customer",
      );

    const customerEmail =
      normalizeEmail(
        order.customer_email,
      );

    const orderNumber =
      escapeHtml(
        order.order_number ||
          order.id,
      );

    const itemList =
      createItemList(
        order.items,
      );

    const total =
      Number(
        order.total_amount,
      ).toFixed(2);

    const address = [
      order.address,
      order.city,
      order.country,
    ]
      .filter(Boolean)
      .map(escapeHtml)
      .join(", ");

    const customerResult =
      await resend.emails.send({
        from:
          `DMs Orders <${RESEND_FROM_EMAIL}>`,

        to:
          customerEmail,

        subject:
          "Your Delly's Matchups Order Confirmation",

        html: `
          <div style="font-family: Arial, sans-serif; padding: 40px;">
            <h2>Thank you for your order, ${customerName}.</h2>

            <p>Your payment has been received successfully.</p>

            <p>
              <strong>Order Number:</strong>
              ${orderNumber}
            </p>

            <ul>
              ${itemList}
            </ul>

            <p>
              <strong>Total Paid:</strong>
              $${total} ${SHOP_CURRENCY}
            </p>

            <p>
              <strong>Payment Method:</strong>
              PayPal / Card
            </p>

            <p>
              We will contact you with the next steps for your order.
            </p>
          </div>
        `,
      });

    if (
      customerResult.error
    ) {
      console.error(
        "SHOP CUSTOMER EMAIL ERROR:",
        customerResult.error,
      );

      return false;
    }

    const adminResult =
      await resend.emails.send({
        from:
          `DMs Orders <${RESEND_FROM_EMAIL}>`,

        to:
          ADMIN_EMAIL,

        subject:
          "New Paid Shop Order",

        html: `
          <div style="font-family: Arial, sans-serif; padding: 40px;">
            <h2>New Paid Shop Order</h2>

            <p>
              <strong>Order Number:</strong>
              ${orderNumber}
            </p>

            <p>
              <strong>Name:</strong>
              ${customerName}
            </p>

            <p>
              <strong>Email:</strong>
              ${escapeHtml(customerEmail)}
            </p>

            <p>
              <strong>Phone:</strong>
              ${escapeHtml(
                order.customer_phone ||
                  "",
              )}
            </p>

            <p>
              <strong>Address:</strong>
              ${address}
            </p>

            <ul>
              ${itemList}
            </ul>

            <p>
              <strong>Total Paid:</strong>
              $${total} ${SHOP_CURRENCY}
            </p>

            <p>
              <strong>Payment Method:</strong>
              PayPal / Card
            </p>
          </div>
        `,
      });

    if (
      adminResult.error
    ) {
      console.error(
        "SHOP ADMIN EMAIL ERROR:",
        adminResult.error,
      );

      return false;
    }

    return true;
  } catch (error) {
    console.error(
      "SHOP ORDER EMAIL ERROR:",
      error,
    );

    return false;
  }
}

export async function POST(
  request,
) {
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

    if (
      orderId.length > 200
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid PayPal order ID.",
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
      error:
        paymentLookupError,
    } =
      await supabaseAdmin
        .from("payments")
        .select(
          "id,customer_name,customer_email,purpose,item_name,amount,currency,payment_method,status,provider_reference,notes",
        )
        .eq(
          "purpose",
          "shop",
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

    if (
      paymentLookupError
    ) {
      console.error(
        "SHOP PAYMENT LOOKUP ERROR:",
        paymentLookupError,
      );

      return NextResponse.json(
        {
          error:
            "Unable to load the Shop payment.",
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
            "Shop PayPal payment record was not found.",
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
            "This Shop payment cannot be captured in its current state.",
        },
        {
          status: 409,
        },
      );
    }

    const shopOrderId =
      getNoteValue(
        payment.notes,
        "Shop Order ID",
      );

    const orderNumber =
      getNoteValue(
        payment.notes,
        "Order Number",
      );

    const checkoutReference =
      getNoteValue(
        payment.notes,
        "Checkout Reference",
      );

    if (
      !shopOrderId ||
      !orderNumber ||
      !checkoutReference
    ) {
      return NextResponse.json(
        {
          error:
            "Stored Shop payment metadata is incomplete.",
        },
        {
          status: 500,
        },
      );
    }

    const {
      data: shopOrder,
      error:
        shopOrderError,
    } =
      await supabaseAdmin
        .from("shop_orders")
        .select(
          "id,order_number,shipping_amount,status,customer_name,customer_email,customer_phone,address,city,country,note,items,total_amount,payment_method,payment_status,paypal_order_id",
        )
        .eq(
          "id",
          shopOrderId,
        )
        .maybeSingle();

    if (
      shopOrderError
    ) {
      console.error(
        "SHOP ORDER LOOKUP ERROR:",
        shopOrderError,
      );

      return NextResponse.json(
        {
          error:
            "Unable to load the Shop order.",
        },
        {
          status: 500,
        },
      );
    }

    if (!shopOrder) {
      return NextResponse.json(
        {
          error:
            "Shop order was not found.",
        },
        {
          status: 404,
        },
      );
    }

    try {
      verifyStoredRecords({
        payment,
        shopOrder,
        orderId,
        orderNumber,
      });
    } catch (error) {
      return NextResponse.json(
        {
          error:
            error instanceof Error
              ? error.message
              : "Stored Shop payment verification failed.",
        },
        {
          status: 409,
        },
      );
    }

    const paymentAlreadyPaid =
      payment.status ===
      "paid";

    const orderAlreadyPaid =
      shopOrder.payment_status ===
      "paid";

    const wasAlreadyPaid =
      paymentAlreadyPaid &&
      orderAlreadyPaid;

    const accessToken =
      await getPayPalAccessToken();

    const paypalOrder =
      wasAlreadyPaid
        ? await getPayPalOrder(
            accessToken,
            orderId,
          )
        : await capturePayPalOrder(
            accessToken,
            orderId,
          );

    const {
      captureId,
    } =
      verifyPayPalOrder({
        order:
          paypalOrder,
        orderId,
        shopOrder,
        checkoutReference,
      });

    if (
      !orderAlreadyPaid
    ) {
      const {
        error:
          orderUpdateError,
      } =
        await supabaseAdmin
          .from(
            "shop_orders",
          )
          .update({
            status:
              "paid",

            payment_status:
              "paid",

            payment_method:
              "PayPal / Card",

            paypal_order_id:
              orderId,
          })
          .eq(
            "id",
            shopOrder.id,
          );

      if (
        orderUpdateError
      ) {
        console.error(
          "SHOP ORDER PAID UPDATE ERROR:",
          orderUpdateError,
        );

        return NextResponse.json(
          {
            error:
              "Payment was verified, but the Shop order could not be updated. Please contact support and do not pay again.",
          },
          {
            status: 500,
          },
        );
      }
    }

    if (
      !paymentAlreadyPaid
    ) {
      const captureNote =
        captureId
          ? `PayPal Capture ID: ${captureId}`
          : "";

      const updatedNotes =
        appendPaymentNote(
          payment.notes,
          captureNote,
        );

      const {
        error:
          paymentUpdateError,
      } =
        await supabaseAdmin
          .from("payments")
          .update({
            status:
              "paid",

            notes:
              updatedNotes ||
              null,
          })
          .eq(
            "id",
            payment.id,
          );

      if (
        paymentUpdateError
      ) {
        console.error(
          "SHOP PAYMENT PAID UPDATE ERROR:",
          paymentUpdateError,
        );

        return NextResponse.json(
          {
            error:
              "Payment was verified and the Shop order was updated, but the payment record could not be finalized. Please contact support and do not pay again.",
          },
          {
            status: 500,
          },
        );
      }
    }

    const newlyPaid =
      !wasAlreadyPaid;

    const emailSent =
      newlyPaid
        ? await sendOrderEmails(
            shopOrder,
          )
        : true;

    return NextResponse.json({
      success: true,

      status:
        "paid",

      alreadyPaid:
        wasAlreadyPaid,

      shopOrderId:
        shopOrder.id,

      orderNumber:
        shopOrder.order_number,

      orderId,

      paypalOrderId:
        orderId,

      captureId:
        captureId ||
        null,

      amount:
        Number(
          shopOrder.total_amount,
        ),

      currency:
        SHOP_CURRENCY,

      emailSent,

      customerName:
        shopOrder.customer_name,
    });
  } catch (error) {
    console.error(
      "SHOP PAYPAL CAPTURE ERROR:",
      error,
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to capture Shop PayPal payment.",
      },
      {
        status: 500,
      },
    );
  }
}
