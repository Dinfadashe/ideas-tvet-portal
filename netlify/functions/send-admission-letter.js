// netlify/functions/send-admission-letter.js
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = 'IDEAS-TVET Portal <noreply@theweb3alliance.org>';

function admissionHTML({ full_name, id_number, admission_link, email }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>Admission Offer — IDEAS-TVET</title>
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
              <div style="color:#ffffff;font-size:20px;font-weight:bold;letter-spacing:0.5px;">WEB3.0 ALLIANCE LIMITED</div>
              <div style="color:rgba(255,255,255,0.7);font-size:12px;margin-top:2px;">IDEAS-TVET Programme — Plateau State</div>
            </td>
            <td align="right">
              <div style="background:rgba(255,255,255,0.15);border-radius:8px;padding:6px 12px;display:inline-block;">
                <div style="color:#c8a82a;font-size:11px;font-weight:bold;letter-spacing:1px;">ADMISSION OFFER</div>
              </div>
            </td>
          </tr>
        </table>
      </td></tr>

      <!-- GREEN STRIPE -->
      <tr><td style="height:4px;background:linear-gradient(90deg,#c8a82a,#1a7a3c);"></td></tr>

      <!-- BODY -->
      <tr><td style="padding:40px 40px 24px;">
        <p style="margin:0 0 8px;font-size:13px;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;">Congratulations!</p>
        <h1 style="margin:0 0 24px;font-size:26px;font-weight:bold;color:#0a2e14;line-height:1.3;">You Have Been Admitted</h1>

        <p style="margin:0 0 16px;font-size:15px;color:#334155;line-height:1.7;">
          Dear <strong>${full_name}</strong>,
        </p>
        <p style="margin:0 0 16px;font-size:15px;color:#334155;line-height:1.7;">
          We are delighted to inform you that you have been selected for admission into the 
          <strong>IDEAS-TVET Computer Hardware &amp; Cellphone Repairs Training Programme</strong>, 
          funded by the <strong>World Bank</strong> and implemented by Web3.0 Alliance Limited in 
          partnership with the Federal Ministry of Education.
        </p>
        <p style="margin:0 0 24px;font-size:15px;color:#334155;line-height:1.7;">
          This programme is <strong>completely FREE</strong> of charge and is designed to equip 
          you with industry-relevant skills for employment and entrepreneurship.
        </p>

        <!-- ID BOX -->
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;margin-bottom:28px;">
          <tr><td style="padding:20px 24px;">
            <div style="font-size:12px;color:#16a34a;font-weight:bold;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px;">Your Trainee ID Number</div>
            <div style="font-size:28px;font-weight:bold;color:#0a2e14;letter-spacing:2px;">${id_number}</div>
            <div style="font-size:12px;color:#64748b;margin-top:4px;">Keep this ID for all official correspondence</div>
          </td></tr>
        </table>

        <!-- STEPS -->
        <p style="margin:0 0 16px;font-size:15px;font-weight:bold;color:#0a2e14;">Next Steps:</p>

        <!-- Step 1 -->
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
          <tr>
            <td width="40" valign="top">
              <div style="width:32px;height:32px;background:#1a7a3c;border-radius:50%;color:#fff;font-weight:bold;font-size:14px;text-align:center;line-height:32px;">1</div>
            </td>
            <td valign="top" style="padding-left:12px;">
              <div style="font-weight:bold;color:#0a2e14;font-size:14px;margin-bottom:4px;">Accept Your Admission</div>
              <div style="color:#64748b;font-size:13px;line-height:1.6;">Click the button below to officially accept your offer. This link is unique to you — do not share it.</div>
            </td>
          </tr>
        </table>

        <!-- Step 2 -->
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
          <tr>
            <td width="40" valign="top">
              <div style="width:32px;height:32px;background:#1a7a3c;border-radius:50%;color:#fff;font-weight:bold;font-size:14px;text-align:center;line-height:32px;">2</div>
            </td>
            <td valign="top" style="padding-left:12px;">
              <div style="font-weight:bold;color:#0a2e14;font-size:14px;margin-bottom:4px;">Log In &amp; Complete Your Profile</div>
              <div style="color:#64748b;font-size:13px;line-height:1.6;">Visit <a href="https://ideas.theweb3alliance.org" style="color:#1a7a3c;">ideas.theweb3alliance.org</a> · Email: ${email} · Default password: <strong>pass</strong></div>
            </td>
          </tr>
        </table>

        <!-- Step 3 -->
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
          <tr>
            <td width="40" valign="top">
              <div style="width:32px;height:32px;background:#1a7a3c;border-radius:50%;color:#fff;font-weight:bold;font-size:14px;text-align:center;line-height:32px;">3</div>
            </td>
            <td valign="top" style="padding-left:12px;">
              <div style="font-weight:bold;color:#0a2e14;font-size:14px;margin-bottom:4px;">Join the Telegram Classroom</div>
              <div style="color:#64748b;font-size:13px;line-height:1.6;">Join your private classroom group to connect with instructors and classmates: <a href="https://t.me/+pORFwMgPhCMyZmRk" style="color:#1a7a3c;font-weight:bold;">t.me/+pORFwMgPhCMyZmRk</a></div>
            </td>
          </tr>
        </table>

        <!-- CTA BUTTON -->
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
          <tr><td align="center">
            <a href="${admission_link}" style="display:inline-block;background:linear-gradient(135deg,#0a2e14,#1a7a3c);color:#ffffff;text-decoration:none;font-weight:bold;font-size:16px;padding:16px 40px;border-radius:10px;letter-spacing:0.5px;">
              ✅ Accept My Admission Now
            </a>
          </td></tr>
        </table>

        <!-- WARNING -->
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#fffbea;border:1px solid #fde68a;border-radius:8px;margin-bottom:24px;">
          <tr><td style="padding:16px 20px;">
            <div style="color:#92400e;font-size:13px;line-height:1.6;">
              ⚠️ <strong>Important:</strong> This offer must be accepted within <strong>24 hours</strong>. Failure to accept will be taken as voluntary withdrawal and your slot will be reallocated to another qualified applicant from our reserve list.
            </div>
          </td></tr>
        </table>

        <p style="margin:0;font-size:14px;color:#64748b;line-height:1.7;">
          For assistance, contact us at <a href="mailto:ideas@theweb3alliance.org" style="color:#1a7a3c;">ideas@theweb3alliance.org</a> or visit the portal.
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
    const { full_name, email, id_number, admission_token } = JSON.parse(event.body);
    const admission_link = `https://ideas.theweb3alliance.org/admit/${admission_token}`;

    const { data, error } = await resend.emails.send({
      from: FROM,
      to: email,
      subject: `🎓 Congratulations ${full_name} — Your IDEAS-TVET Admission Offer`,
      html: admissionHTML({ full_name, id_number, admission_link, email }),
    });

    if (error) throw error;
    return { statusCode: 200, body: JSON.stringify({ success: true, id: data.id }) };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
