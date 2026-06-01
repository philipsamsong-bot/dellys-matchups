import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request) {
  try {
    const body = await request.json();

    const {
      fullName,
      email,
      service,
      preferredDate,
    } = body;

    const response = await resend.emails.send({
      from: "DMs Counselling <${process.env.RESND_FROM_EMAIL}>",
      to: email,
      subject: "Your Counselling Session Has Been Confirmed",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 40px; background: #fafafa;">
          <div style="max-width: 700px; margin: 0 auto; background: white; padding: 40px; border-radius: 24px;">
            
            <h1 style="color: #b30018; margin-bottom: 20px;">
              Delly’s Matchups (DMs)
            </h1>

            <h2 style="margin-bottom: 25px;">
              Counselling Booking Confirmation
            </h2>

            <p>
              Hello ${fullName},
            </p>

            <p>
              Your counselling or mentorship booking has been successfully received and confirmed.
            </p>

            <div style="margin-top: 30px; padding: 24px; background: #f5f5f5; border-radius: 16px;">
              <p>
                <strong>Service:</strong> ${service}
              </p>

              <p>
                <strong>Preferred Date:</strong> ${preferredDate}
              </p>
            </div>

            <p style="margin-top: 30px;">
              Our team will contact you shortly through your email address or WhatsApp number with further instructions concerning your session.
            </p>

            <p style="margin-top: 30px;">
              Thank you for choosing DMs.
            </p>

            <hr style="margin: 40px 0;" />

            <p style="color: #777;">
              Biblical Principles. Practical Wisdom. Lasting Transformation.
            </p>

          </div>
        </div>
      `,
    });

    return Response.json({
      success: true,
      response,
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
