// netlify/functions/send-password-reset.js
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = 'IDEAS-TVET Portal <noreply@theweb3alliance.org>';

function resetHTML({ full_name, reset_link }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>Reset Your Password — IDEAS-TVET</title>
</head>
<body style="margin:0;padding:0;background:#f0f4f8;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4f8;padding:32px 0;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.10);max-width:600px;width:100%;">

      <!-- HEADER -->
      <tr><td style="background:linear-gradient(135deg,#0a2e14 0%,#1a7a3c 100%);padding:32px 40px 24px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td>
              <img src="https://ideas.theweb3alliance.org/logo.png" alt="Web3.0 Alliance Ltd" style="height:48px;width:auto;display:block;margin-bottom:6px;" />
              <div style="color:#ffffff;font-size:20px;font-weight:bold;">WEB3.0 ALLIANCE LIMITED</div>
              <div style="color:rgba(255,255,255,0.7);font-size:12px;margin-top:2px;">IDEAS-TVET Programme — Plateau State</div>
            </td>
            <td align="right">
              <div style="background:rgba(255,255,255,0.15);border-radius:8px;padding:6px 12px;">
                <div style="color:#c8a82a;font-size:11px;font-weight:bold;letter-spacing:1px;">PASSWORD RESET</div>
              </div>
            </td>
          </tr>
        </table>
      </td></tr>

      <!-- GREEN STRIPE -->
      <tr><td style="height:4px;background:linear-gradient(90deg,#c8a82a,#1a7a3c);"></td></tr>

      <!-- BODY -->
      <tr><td style="padding:40px 40px 24px;">
        <!-- ICON -->
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
          <tr><td align="center">
            <div style="width:72px;height:72px;background:#f0fdf4;border:2px solid #bbf7d0;border-radius:50%;display:inline-block;text-align:center;line-height:72px;font-size:32px;">🔐</div>
          </td></tr>
        </table>

        <h1 style="margin:0 0 16px;font-size:24px;font-weight:bold;color:#0a2e14;text-align:center;">Reset Your Password</h1>

        <p style="margin:0 0 16px;font-size:15px;color:#334155;line-height:1.7;">
          Dear <strong>${full_name}</strong>,
        </p>
        <p style="margin:0 0 24px;font-size:15px;color:#334155;line-height:1.7;">
          We received a request to reset the password for your IDEAS-TVET trainee portal account. 
          Click the button below to set a new password. This link will expire in <strong>1 hour</strong>.
        </p>

        <!-- CTA BUTTON -->
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
          <tr><td align="center">
            <a href="${reset_link}" style="display:inline-block;background:linear-gradient(135deg,#0a2e14,#1a7a3c);color:#ffffff;text-decoration:none;font-weight:bold;font-size:16px;padding:16px 40px;border-radius:10px;letter-spacing:0.5px;">
              🔑 Reset My Password
            </a>
          </td></tr>
        </table>

        <!-- SECURITY NOTE -->
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;margin-bottom:24px;">
          <tr><td style="padding:16px 20px;">
            <div style="color:#991b1b;font-size:13px;line-height:1.6;">
              🛡️ <strong>Security Notice:</strong> If you did not request a password reset, please ignore this email. Your account remains secure. Do not share this link with anyone.
            </div>
          </td></tr>
        </table>

        <!-- MANUAL LINK -->
        <p style="margin:0 0 8px;font-size:13px;color:#64748b;">If the button above doesn't work, copy and paste this link into your browser:</p>
        <p style="margin:0 0 24px;font-size:12px;color:#1a7a3c;word-break:break-all;">${reset_link}</p>

        <p style="margin:0;font-size:14px;color:#64748b;line-height:1.7;">
          Need help? Contact us at <a href="mailto:ideas@theweb3alliance.org" style="color:#1a7a3c;">ideas@theweb3alliance.org</a>
        </p>
      </td></tr>

      <!-- FOOTER -->
      <tr><td style="background:linear-gradient(135deg,#0a2e14,#1a7a3c);padding:24px 40px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td>
              <div style="color:rgba(255,255,255,0.9);font-size:13px;font-weight:bold;">Web3.0 Alliance Limited</div>
              <div style="color:rgba(255,255,255,0.6);font-size:11px;margin-top:2px;">IDEAS-TVET Initiative · Plateau State Polytechnic, Jos</div>
              <div style="color:rgba(255,255,255,0.6);font-size:11px;margin-top:2px;">ideas@theweb3alliance.org · ideas.theweb3alliance.org</div>
            </td>
            <td align="right">
              <div style="color:rgba(255,255,255,0.4);font-size:10px;">World Bank Funded<br/>Federal Ministry of Education</div>
            </td>
          </tr>
        </table>
      </td></tr>

    </table>
  </td></tr>
</table>
</body>
</html>`;
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

  try {
    const { full_name, email, reset_link } = JSON.parse(event.body);

    const { data, error } = await resend.emails.send({
      from: FROM,
      to: email,
      subject: `🔐 Reset Your IDEAS-TVET Portal Password`,
      html: resetHTML({ full_name, reset_link }),
    });

    if (error) throw error;
    return { statusCode: 200, body: JSON.stringify({ success: true, id: data.id }) };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
