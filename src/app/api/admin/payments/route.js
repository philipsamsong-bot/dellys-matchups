// src/app/api/admin/payments/route.js

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

export const runtime = "nodejs";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL;

const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY;

const RESEND_API_KEY =
  process.env.RESEND_API_KEY;

const RESEND_FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL;

const MANUAL_PAYMENT_METHODS = new Set([
  "Mobile Money",
  "Bank Transfer",
]);

const ALLOWED_TARGET_STATUSES = new Set([
  "paid",
  "rejected",
]);

const ALLOWED_PURPOSES = new Set([
  "membership",
  "academy",
  "counselling",
  "shop",
  "donation",
  "partner",
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

function getCourseKey(
  payment,
) {
  return (
    getNoteValue(
      payment.notes,
      "Course Key",
    ) ||
    "full-academy"
  );
}

function getMembershipPlan(
  payment,
) {
  const planFromNotes =
    getNoteValue(
      payment.notes,
      "Plan",
    ).toLowerCase();

  if (
    planFromNotes === "vip" ||
    planFromNotes === "premium"
  ) {
    return planFromNotes;
  }

  return getString(
    payment.item_name,
  )
    .toLowerCase()
    .includes("vip")
    ? "vip"
    : "premium";
}

function addOneMonth(
  dateValue,
) {
  const date =
    new Date(dateValue);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    throw new Error(
      "Stored membership payment date is invalid.",
    );
  }

  const nextDate =
    new Date(date);

  nextDate.setMonth(
    nextDate.getMonth() +
      1,
  );

  return nextDate.toISOString();
}

async function requireAdmin(
  request,
  supabaseAdmin,
) {
  const authorization =
    request.headers.get(
      "authorization",
    );

  const token =
    authorization?.startsWith(
      "Bearer ",
    )
      ? authorization
          .slice(7)
          .trim()
      : "";

  if (!token) {
    return {
      error:
        "Not authenticated.",
      status: 401,
      user: null,
    };
  }

  const {
    data: { user },
    error: authError,
  } =
    await supabaseAdmin.auth.getUser(
      token,
    );

  if (
    authError ||
    !user
  ) {
    return {
      error:
        "Invalid session.",
      status: 401,
      user: null,
    };
  }

  const {
    data: profile,
    error: profileError,
  } =
    await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq(
        "id",
        user.id,
      )
      .maybeSingle();

  if (profileError) {
    console.error(
      "ADMIN PAYMENTS PROFILE ERROR:",
      profileError,
    );

    return {
      error:
        "Unable to verify admin access.",
      status: 500,
      user: null,
    };
  }

  if (
    profile?.role !==
    "admin"
  ) {
    return {
      error:
        "Admin access required.",
      status: 403,
      user: null,
    };
  }

  return {
    error: null,
    status: 200,
    user,
  };
}

async function findProfileForPayment(
  supabaseAdmin,
  payment,
) {
  if (
    payment.user_id
  ) {
    const {
      data,
      error,
    } =
      await supabaseAdmin
        .from("profiles")
        .select("id,email")
        .eq(
          "id",
          payment.user_id,
        )
        .maybeSingle();

    if (error) {
      throw new Error(
        error.message,
      );
    }

    if (data) {
      return data;
    }
  }

  const email =
    normalizeEmail(
      payment.customer_email,
    );

  if (!email) {
    throw new Error(
      "This membership payment has no user ID or email.",
    );
  }

  const {
    data: profiles,
    error,
  } =
    await supabaseAdmin
      .from("profiles")
      .select("id,email")
      .ilike(
        "email",
        email,
      )
      .limit(2);

  if (error) {
    throw new Error(
      error.message,
    );
  }

  if (
    !Array.isArray(
      profiles,
    ) ||
    profiles.length === 0
  ) {
    throw new Error(
      `No matching profile found for ${email}.`,
    );
  }

  if (
    profiles.length > 1
  ) {
    throw new Error(
      `Multiple profiles match ${email}. Resolve the duplicate profiles before approving this payment.`,
    );
  }

  return profiles[0];
}

async function activateMembership(
  supabaseAdmin,
  payment,
) {
  const plan =
    getMembershipPlan(
      payment,
    );

  const profile =
    await findProfileForPayment(
      supabaseAdmin,
      payment,
    );

  const startedAt =
    payment.created_at ||
    new Date().toISOString();

  const expiresAt =
    addOneMonth(
      startedAt,
    );

  const {
    error,
  } =
    await supabaseAdmin
      .from("profiles")
      .update({
        membership_status:
          plan,

        membership_plan:
          plan,

        membership_started_at:
          startedAt,

        membership_expires_at:
          expiresAt,

        plan,

        subscription:
          plan,
      })
      .eq(
        "id",
        profile.id,
      );

  if (error) {
    throw new Error(
      `Unable to activate membership: ${error.message}`,
    );
  }
}

async function activateAcademy(
  supabaseAdmin,
  payment,
) {
  const courseKey =
    getCourseKey(
      payment,
    );

  const email =
    normalizeEmail(
      payment.customer_email,
    );

  if (!email) {
    throw new Error(
      "Cannot activate Academy access because this payment has no email.",
    );
  }

  const {
    error,
  } =
    await supabaseAdmin
      .from(
        "academy_enrollments",
      )
      .upsert(
        {
          user_email:
            email,

          customer_name:
            payment.customer_name,

          course_key:
            courseKey,

          course_title:
            payment.item_name,

          access_type:
            courseKey ===
            "full-academy"
              ? "full"
              : "single",

          payment_id:
            payment.id,

          status:
            "active",
        },
        {
          onConflict:
            "user_email,course_key",
        },
      );

  if (error) {
    throw new Error(
      `Unable to activate Academy access: ${error.message}`,
    );
  }
}

async function updateCounsellingBooking(
  supabaseAdmin,
  payment,
  status,
) {
  const bookingId =
    getNoteValue(
      payment.notes,
      "Booking ID",
    );

  if (!bookingId) {
    throw new Error(
      "Counselling payment is missing its Booking ID.",
    );
  }

  const {
    data: booking,
    error,
  } =
    await supabaseAdmin
      .from(
        "counselling_bookings",
      )
      .update({
        payment_status:
          status,
      })
      .eq(
        "id",
        bookingId,
      )
      .select("id")
      .maybeSingle();

  if (error) {
    throw new Error(
      `Unable to update counselling booking: ${error.message}`,
    );
  }

  if (!booking) {
    throw new Error(
      "The counselling booking linked to this payment could not be found.",
    );
  }
}

async function sendShopProcessingEmail(
  order,
) {
  if (
    !RESEND_API_KEY ||
    !RESEND_FROM_EMAIL
  ) {
    console.warn(
      "SHOP ADMIN EMAIL SKIPPED: Resend environment variables are not configured.",
    );

    return;
  }

  const resend =
    new Resend(
      RESEND_API_KEY,
    );

  try {
    await resend.emails.send({
      from:
        `DMs Orders <${RESEND_FROM_EMAIL}>`,

      to:
        order.customer_email,

      subject:
        "Your Delly's Matchups order is now processing",

      html: `
        <h2>Order Update</h2>
        <p>Hello ${order.customer_name},</p>
        <p>Your payment has been confirmed and your order is now processing.</p>
        <p><strong>Order Number:</strong> ${order.order_number || order.id}</p>
        <p><strong>New Status:</strong> processing</p>
        <p>Thank you for shopping with Delly's Matchups.</p>
      `,
    });
  } catch (error) {
    console.error(
      "SHOP PROCESSING EMAIL ERROR:",
      error,
    );
  }
}

async function updateShopOrder(
  supabaseAdmin,
  payment,
  status,
) {
  const shopOrderId =
    getNoteValue(
      payment.notes,
      "Shop Order ID",
    );

  if (!shopOrderId) {
    throw new Error(
      "Shop payment is missing its Shop Order ID.",
    );
  }

  const {
    data: currentOrder,
    error:
      orderLookupError,
  } =
    await supabaseAdmin
      .from("shop_orders")
      .select(
        "id,order_number,customer_name,customer_email,total_amount,payment_method,payment_status,status",
      )
      .eq(
        "id",
        shopOrderId,
      )
      .maybeSingle();

  if (
    orderLookupError
  ) {
    throw new Error(
      `Unable to load Shop order: ${orderLookupError.message}`,
    );
  }

  if (!currentOrder) {
    throw new Error(
      "The Shop order linked to this payment could not be found.",
    );
  }

  if (
    normalizeEmail(
      currentOrder.customer_email,
    ) !==
    normalizeEmail(
      payment.customer_email,
    )
  ) {
    throw new Error(
      "Shop order customer email does not match the payment.",
    );
  }

  if (
    Number(
      currentOrder.total_amount,
    ) !==
    Number(
      payment.amount,
    )
  ) {
    throw new Error(
      "Shop order total does not match the payment amount.",
    );
  }

  if (
    currentOrder.payment_method !==
    payment.payment_method
  ) {
    throw new Error(
      "Shop order payment method does not match the payment.",
    );
  }

  if (
    status === "paid"
  ) {
    const alreadyProcessing =
      currentOrder.payment_status ===
        "paid" &&
      currentOrder.status ===
        "processing";

    const {
      data: updatedOrder,
      error:
        updateError,
    } =
      await supabaseAdmin
        .from("shop_orders")
        .update({
          payment_status:
            "paid",

          status:
            "processing",
        })
        .eq(
          "id",
          shopOrderId,
        )
        .select(
          "id,order_number,customer_name,customer_email,total_amount,payment_method,payment_status,status",
        )
        .maybeSingle();

    if (updateError) {
      throw new Error(
        `Unable to confirm Shop order payment: ${updateError.message}`,
      );
    }

    if (!updatedOrder) {
      throw new Error(
        "Shop order could not be updated.",
      );
    }

    if (
      !alreadyProcessing
    ) {
      await sendShopProcessingEmail(
        updatedOrder,
      );
    }

    return;
  }

  const {
    data: updatedOrder,
    error:
      updateError,
  } =
    await supabaseAdmin
      .from("shop_orders")
      .update({
        payment_status:
          "rejected",

        status:
          "rejected",
      })
      .eq(
        "id",
        shopOrderId,
      )
      .select("id")
      .maybeSingle();

  if (updateError) {
    throw new Error(
      `Unable to reject Shop order payment: ${updateError.message}`,
    );
  }

  if (!updatedOrder) {
    throw new Error(
      "Shop order could not be updated.",
    );
  }
}

async function applyPurposeStatus(
  supabaseAdmin,
  payment,
  status,
) {
  switch (
    payment.purpose
  ) {
    case "membership":
      if (
        status === "paid"
      ) {
        await activateMembership(
          supabaseAdmin,
          payment,
        );
      }

      return;

    case "academy":
      if (
        status === "paid"
      ) {
        await activateAcademy(
          supabaseAdmin,
          payment,
        );
      }

      return;

    case "counselling":
      await updateCounsellingBooking(
        supabaseAdmin,
        payment,
        status,
      );

      return;

    case "shop":
      await updateShopOrder(
        supabaseAdmin,
        payment,
        status,
      );

      return;

    case "donation":
    case "partner":
      return;

    default:
      throw new Error(
        `Unsupported payment purpose: ${payment.purpose || "unknown"}.`,
      );
  }
}

async function getPayment(
  supabaseAdmin,
  paymentId,
) {
  const {
    data,
    error,
  } =
    await supabaseAdmin
      .from("payments")
      .select(
        "id,user_id,customer_name,customer_email,purpose,item_name,amount,currency,payment_method,status,provider_reference,proof_url,notes,created_at,updated_at",
      )
      .eq(
        "id",
        paymentId,
      )
      .maybeSingle();

  if (error) {
    throw new Error(
      error.message,
    );
  }

  return data;
}

export async function GET(
  request,
) {
  try {
    const supabaseAdmin =
      createSupabaseAdmin();

    const admin =
      await requireAdmin(
        request,
        supabaseAdmin,
      );

    if (admin.error) {
      return NextResponse.json(
        {
          error:
            admin.error,
        },
        {
          status:
            admin.status,
        },
      );
    }

    const {
      data,
      error,
    } =
      await supabaseAdmin
        .from("payments")
        .select("*")
        .order(
          "created_at",
          {
            ascending:
              false,
          },
        );

    if (error) {
      console.error(
        "ADMIN PAYMENTS GET ERROR:",
        error,
      );

      return NextResponse.json(
        {
          error:
            "Unable to load payments.",
        },
        {
          status: 500,
        },
      );
    }

    return NextResponse.json({
      payments:
        data || [],
    });
  } catch (error) {
    console.error(
      "ADMIN PAYMENTS GET ERROR:",
      error,
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to load payments.",
      },
      {
        status: 500,
      },
    );
  }
}

export async function PATCH(
  request,
) {
  try {
    const supabaseAdmin =
      createSupabaseAdmin();

    const admin =
      await requireAdmin(
        request,
        supabaseAdmin,
      );

    if (admin.error) {
      return NextResponse.json(
        {
          error:
            admin.error,
        },
        {
          status:
            admin.status,
        },
      );
    }

    const body =
      await request.json();

    const paymentId =
      getString(
        body.paymentId,
      );

    const status =
      getString(
        body.status,
      )
        .toLowerCase();

    if (!paymentId) {
      return NextResponse.json(
        {
          error:
            "Payment ID is required.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      !ALLOWED_TARGET_STATUSES.has(
        status,
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Payment status must be paid or rejected.",
        },
        {
          status: 400,
        },
      );
    }

    const payment =
      await getPayment(
        supabaseAdmin,
        paymentId,
      );

    if (!payment) {
      return NextResponse.json(
        {
          error:
            "Payment was not found.",
        },
        {
          status: 404,
        },
      );
    }

    if (
      !ALLOWED_PURPOSES.has(
        payment.purpose,
      )
    ) {
      return NextResponse.json(
        {
          error:
            "This payment purpose cannot be managed from Admin Payments.",
        },
        {
          status: 409,
        },
      );
    }

    if (
      !MANUAL_PAYMENT_METHODS.has(
        payment.payment_method,
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Only Mobile Money and Bank Transfer submissions can be manually approved or rejected. PayPal/Card payments are verified automatically.",
        },
        {
          status: 409,
        },
      );
    }

    if (
      payment.status ===
        "paid"
    ) {
      if (
        status !== "paid"
      ) {
        return NextResponse.json(
          {
            error:
              "A paid payment cannot be changed to rejected from Admin Payments.",
          },
          {
            status: 409,
          },
        );
      }

      await applyPurposeStatus(
        supabaseAdmin,
        payment,
        "paid",
      );

      return NextResponse.json({
        success: true,
        alreadyUpdated:
          true,
        payment: {
          ...payment,
          status:
            "paid",
        },
      });
    }

    if (
      payment.status ===
        "rejected"
    ) {
      if (
        status !==
        "rejected"
      ) {
        return NextResponse.json(
          {
            error:
              "A rejected payment cannot be changed to paid. Create or verify a new payment submission instead.",
          },
          {
            status: 409,
          },
        );
      }

      return NextResponse.json({
        success: true,
        alreadyUpdated:
          true,
        payment,
      });
    }

    if (
      payment.status !==
        "pending_confirmation"
    ) {
      return NextResponse.json(
        {
          error:
            `Payment status "${payment.status}" cannot be manually confirmed.`,
        },
        {
          status: 409,
        },
      );
    }

    await applyPurposeStatus(
      supabaseAdmin,
      payment,
      status,
    );

    const {
      data:
        updatedPayment,
      error:
        paymentUpdateError,
    } =
      await supabaseAdmin
        .from("payments")
        .update({
          status,
        })
        .eq(
          "id",
          payment.id,
        )
        .eq(
          "status",
          "pending_confirmation",
        )
        .select(
          "id,user_id,customer_name,customer_email,purpose,item_name,amount,currency,payment_method,status,provider_reference,proof_url,notes,created_at,updated_at",
        )
        .maybeSingle();

    if (
      paymentUpdateError
    ) {
      console.error(
        "ADMIN PAYMENT STATUS UPDATE ERROR:",
        paymentUpdateError,
      );

      return NextResponse.json(
        {
          error:
            "The related access/order was updated, but the payment status could not be finalized. Do not process the payment again until this record is checked.",
        },
        {
          status: 500,
        },
      );
    }

    if (!updatedPayment) {
      const currentPayment =
        await getPayment(
          supabaseAdmin,
          payment.id,
        );

      if (
        currentPayment?.status ===
        status
      ) {
        return NextResponse.json({
          success: true,
          alreadyUpdated:
            true,
          payment:
            currentPayment,
        });
      }

      return NextResponse.json(
        {
          error:
            "Payment changed while it was being processed. Refresh Admin Payments before trying again.",
        },
        {
          status: 409,
        },
      );
    }

    return NextResponse.json({
      success: true,
      alreadyUpdated:
        false,
      payment:
        updatedPayment,
    });
  } catch (error) {
    console.error(
      "ADMIN PAYMENTS PATCH ERROR:",
      error,
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to update payment.",
      },
      {
        status: 500,
      },
    );
  }
}

export async function DELETE(
  request,
) {
  try {
    const supabaseAdmin =
      createSupabaseAdmin();

    const admin =
      await requireAdmin(
        request,
        supabaseAdmin,
      );

    if (admin.error) {
      return NextResponse.json(
        {
          error:
            admin.error,
        },
        {
          status:
            admin.status,
        },
      );
    }

    const {
      searchParams,
    } =
      new URL(
        request.url,
      );

    const paymentId =
      getString(
        searchParams.get(
          "id",
        ),
      );

    if (!paymentId) {
      return NextResponse.json(
        {
          error:
            "Payment ID is required.",
        },
        {
          status: 400,
        },
      );
    }

    const payment =
      await getPayment(
        supabaseAdmin,
        paymentId,
      );

    if (!payment) {
      return NextResponse.json(
        {
          error:
            "Payment was not found.",
        },
        {
          status: 404,
        },
      );
    }

    if (
      payment.status ===
      "paid"
    ) {
      return NextResponse.json(
        {
          error:
            "Paid payment records cannot be deleted.",
        },
        {
          status: 409,
        },
      );
    }

    const {
      error:
        deleteError,
    } =
      await supabaseAdmin
        .from("payments")
        .delete()
        .eq(
          "id",
          payment.id,
        );

    if (deleteError) {
      console.error(
        "ADMIN PAYMENT DELETE ERROR:",
        deleteError,
      );

      return NextResponse.json(
        {
          error:
            "Unable to delete payment.",
        },
        {
          status: 500,
        },
      );
    }

    return NextResponse.json({
      success: true,
      paymentId:
        payment.id,
    });
  } catch (error) {
    console.error(
      "ADMIN PAYMENTS DELETE ERROR:",
      error,
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to delete payment.",
      },
      {
        status: 500,
      },
    );
  }
}
