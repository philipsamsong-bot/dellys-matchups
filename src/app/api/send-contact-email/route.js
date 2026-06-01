import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request) {
  try {
    const body = await request.json();

    const {
      fullName,
      email,
      phone,
      subject,
      message,
    } = body;

    await resend.emails.send({
      from: "DMs Contact <${process.env.RESND_FROM_EMAIL}>",
      to: email,
      subject: "We Received Your Message",
      html: `
        <div style="font-family: Arial, sans-serif; background: #fff5f5; padding: 40px;">
          <div style="max-width: 700px; margin: 0 auto; background: white; border-radius: 24px; padding: 40px;">
            
            <h1 style="color: #b30018; margin-bottom: 20px;">
              Message Received
            </h1>

            <p style="font-size: 18px; line-height: 1.8;">
              Hello ${fullName},
            </p>

            <p style="font-size: 18px; line-height: 1.8;">
              Thank you for contacting Delly’s Matchups.
              Your message has been received successfully.
            </p>

            <p style="font-size: 18px; line-height: 1.8;">
              Our team will review your message and respond as soon as possible.
            </p>

            <div style="margin-top: 30px; background: #f5f5f5; padding: 24px; border-radius: 18px;">
              <p><strong>Subject:</strong> ${subject}</p>

              <p style="margin-top: 20px;">
                <strong>Your Message:</strong>
              </p>

              <p style="line-height: 1.8;">
                ${message}
              </p>
            </div>

            <p style="margin-top: 40px; font-size: 18px; line-height: 1.8;">
              Biblical Principles. Practical Wisdom. Lasting Transformation.
            </p>

          </div>
        </div>
      `,
    });

    await resend.emails.send({
      from: "DMs Contact Alert <${process.env.RESND_FROM_EMAIL}>",
      to: "philipsamsong@gmail.com",
      subject: "New Contact Message Received",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 40px;">
          
          <h1 style="color: #b30018;">
            New Contact Message
          </h1>

          <p><strong>Name:</strong> ${fullName}</p>

          <p><strong>Email:</strong> ${email}</p>

          <p><strong>Phone:</strong> ${
            phone || "Not provided"
          }</p>

          <p><strong>Subject:</strong> ${subject}</p>

          <div style="margin-top: 30px; background: #f5f5f5; padding: 24px; border-radius: 18px;">
            <p><strong>Message:</strong></p>

            <p style="line-height: 1.8;">
              ${message}
            </p>
          </div>

        </div>
      `,
    });

    return Response.json({
      success: true,
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
