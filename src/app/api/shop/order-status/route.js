import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    const { orderId, status } = await request.json();

    if (!orderId || !status) {
      return Response.json(
        { error: "Order ID and status are required." },
        { status: 400 }
      );
    }

    const { data: order, error } = await supabaseAdmin
      .from("shop_orders")
      .update({ status })
      .eq("id", orderId)
      .select()
      .single();

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    if (["processing", "shipped", "delivered"].includes(status)) {
      await resend.emails.send({
        from: `DMs Orders <${process.env.RESEND_FROM_EMAIL}>`,
        to: order.customer_email,
        subject: `Your Delly's Matchups order is now ${status}`,
        html: `
          <h2>Order Update</h2>
          <p>Hello ${order.customer_name},</p>
          <p>Your order status has been updated.</p>
          <p><strong>Order Number:</strong> ${order.order_number || order.id}</p>
          <p><strong>New Status:</strong> ${status}</p>
          <p>Thank you for shopping with Delly's Matchups.</p>
        `,
      });
    }

    return Response.json({ success: true, order });
  } catch (error) {
    return Response.json(
      { error: error.message || "Unable to update order status." },
      { status: 500 }
    );
  }
}
