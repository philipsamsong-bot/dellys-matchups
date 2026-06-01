import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request) {
  try {
    const body = await request.json();

    const { fullName, email, service, preferredDate, amount } = body;

    if (!email) {
      return Response.json(
        { success: false, error: "Customer email is missing." },
        { status: 400 }
      );
    }

    const customerEmail = await resend.emails.send({
      from: `DMs Counselling <${process.env.RESEND_FROM_EMAIL}>`,
      to: email,
      subject: "Your counselling booking is confirmed",
      html: `
        <div style="font-family: Arial, sans-serif; background: #fff5f5; padding: 40px;">
          <div style="max-width: 700px; margin: 0 auto; background: white; border-radius: 24px; padding: 40px;">
            <h1 style="color: #b30018;">Booking Confirmed</h1>

            <p>Hello ${fullName || "Client"},</p>

            <p>
              Your counselling booking and payment were received successfully.
            </p>

            <div style="margin-top: 30px; background: #f5f5f5; padding: 24px; border-radius: 18px;">
              <p><strong>Service:</strong> ${service}</p>
              <p><strong>Preferred Date:</strong> ${preferredDate}</p>
              <p><strong>Amount Paid:</strong> $${amount}</p>
            </div>

            <p style="margin-top: 30px;">
              Our team will contact you shortly with the next steps for your session.
            </p>

            <p style="margin-top: 30px;">
              Biblical Principles. Practical Wisdom. Lasting Transformation.
            </p>
          </div>
        </div>
      `,
    });

    const adminEmail = await resend.emails.send({
      from: `DMs Notifications <${process.env.RESEND_FROM_EMAIL}>`,
      to: process.env.ADMIN_EMAIL,
      subject: "New paid counselling booking",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 40px;">
          <h1 style="color: #b30018;">New Paid Counselling Booking</h1>

          <p><strong>Name:</strong> ${fullName || "Client"}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Service:</strong> ${service}</p>
          <p><strong>Preferred Date:</strong> ${preferredDate}</p>
          <p><strong>Amount Paid:</strong> $${amount}</p>
        </div>
      `,
    });

    return Response.json({
      success: true,
      customerEmail,
      adminEmail,
    });
  } catch (error) {
    return Response.json(
      {
        success: false,
        error: error.message,
      },
      {
        status: 500,
      }
    );
  }
}
