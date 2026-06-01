import { Resend } from "resend";
import { supabase } from "@/lib/supabase";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request) {
  try {
    const { cart, customer, total, payment } = await request.json();

    if (!cart || cart.length === 0) {
      return Response.json({ error: "Cart is empty." }, { status: 400 });
    }

    if (!customer?.email || !customer?.fullName) {
      return Response.json(
        { error: "Customer name and email are required." },
        { status: 400 }
      );
    }
    const orderNumber = `DM-${Date.now()}`;
    const { data: order, error } = await supabase
      .from("shop_orders")
      .insert({
        order_number: orderNumber,
        shipping_amount: 0,
        status: payment.status ==="paid" ?
        "paid" :"pending",
        customer_name: customer.fullName,
        customer_email: customer.email,
        customer_phone: customer.phone,
        address: customer.address,
        city: customer.city,
        country: customer.country,
        note: customer.note,
        items: cart,
        total_amount: total,
        payment_method: payment.method,
        payment_status: payment.status,
        paypal_order_id: payment.paypalOrderId || null,
      })
      .select()
      .single();

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    const itemList = cart
      .map((item) => `<li>${item.title} - ${item.price}</li>`)
      .join("");

    await resend.emails.send({
      from: `DMs Orders <${process.env.RESEND_FROM_EMAIL}>`,
      to: customer.email,
      subject: "Your Delly's Matchups Order Confirmation",
      html: `
        <h2>Thank you for your order, ${customer.fullName}.</h2>
        <p>We have received your order successfully.</p>
        <ul>${itemList}</ul>
        <p><strong>Total:</strong> $${total}</p>
        <p><strong>Payment Method:</strong> ${payment.method}</p>
        <p><strong>Status:</strong> ${payment.status}</p>
      `,
    });

    await resend.emails.send({
      from: `DMs Orders <${process.env.RESEND_FROM_EMAIL}>`,
      to: process.env.ADMIN_EMAIL,
      subject: "New Shop Order Received",
      html: `
        <h2>New Shop Order</h2>
        <p><strong>Name:</strong> ${customer.fullName}</p>
        <p><strong>Email:</strong> ${customer.email}</p>
        <p><strong>Phone:</strong> ${customer.phone}</p>
        <p><strong>Address:</strong> ${customer.address}, ${customer.city}, ${customer.country}</p>
        <ul>${itemList}</ul>
        <p><strong>Total:</strong> $${total}</p>
        <p><strong>Payment Method:</strong> ${payment.method}</p>
        <p><strong>Status:</strong> ${payment.status}</p>
      `,
    });

    return Response.json({
      success: true,
      orderId: order.id,
    });
  } catch (error) {
    return Response.json(
      { error: error.message || "Unable to process order." },
      { status: 500 }
    );
  }
}
