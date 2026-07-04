// netlify/functions/send-profile-reminder.js
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = 'IDEAS-TVET Portal <noreply@theweb3alliance.org>';

function reminderHTML({ full_name, id_number, missing_fields, portal_link }) {
  const missingList = (missing_fields || [
    'Passport photograph',
    'Bank account details',
    'Next of kin information',
    'NIN / BVN',
  ]).map(f => `<li style="margin-bottom:6px;color:#334155;font-size:14px;">${f}</li>`).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>Complete Your Profile — IDEAS-TVET</title>
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
              <div style="color:#ffffff;font-size:20px;font-weight:bold;">WEB3.0 ALLIANCE LIMITED</div>
              <div style="color:rgba(255,255,255,0.7);font-size:12px;margin-top:2px;">IDEAS-TVET Programme — Plateau State</div>
            </td>
            <td align="right">
              <div style="background:rgba(200,168,42,0.25);border-radius:8px;padding:6px 12px;">
                <div style="color:#c8a82a;font-size:11px;font-weight:bold;letter-spacing:1px;">ACTION REQUIRED</div>
              </div>
            </td>
          </tr>
        </table>
      </td></tr>

      <!-- GOLD STRIPE -->
      <tr><td style="height:4px;background:linear-gradient(90deg,#c8a82a,#1a7a3c);"></td></tr>

      <!-- BODY -->
      <tr><td style="padding:40px 40px 24px;">
        <p style="margin:0 0 8px;font-size:13px;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;">Friendly Reminder</p>
        <h1 style="margin:0 0 24px;font-size:24px;font-weight:bold;color:#0a2e14;line-height:1.3;">Your Profile Is Incomplete</h1>

        <p style="margin:0 0 16px;font-size:15px;color:#334155;line-height:1.7;">
          Dear <strong>${full_name}</strong>,
        </p>
        <p style="margin:0 0 16px;font-size:15px;color:#334155;line-height:1.7;">
          Thank you for accepting your admission to the IDEAS-TVET programme. We noticed that your 
          trainee profile on the portal is not yet complete. A complete profile is required for:
        </p>

        <ul style="margin:0 0 20px;padding-left:20px;">
          <li style="margin-bottom:6px;color:#334155;font-size:14px;">Processing your monthly stipend payments</li>
          <li style="margin-bottom:6px;color:#334155;font-size:14px;">Generating your official ID card</li>
          <li style="margin-bottom:6px;color:#334155;font-size:14px;">Issuing your Certificate of Completion</li>
          <li style="margin-bottom:6px;color:#334155;font-size:14px;">Official programme documentation and reporting</li>
        </ul>

        <!-- MISSING FIELDS BOX -->
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#fffbea;border:1px solid #fde68a;border-radius:10px;margin-bottom:28px;">
          <tr><td style="padding:20px 24px;">
            <div style="font-size:13px;font-weight:bold;color:#92400e;margin-bottom:12px;text-transform:uppercase;letter-spacing:0.5px;">⚠️ Items Still Needed:</div>
            <ul style="margin:0;padding-left:20px;">
              ${missingList}
            </ul>
          </td></tr>
        </table>

        <!-- ID -->
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;margin-bottom:28px;">
          <tr><td style="padding:14px 20px;">
            <span style="font-size:12px;color:#94a3b8;">Your Trainee ID: </span>
            <span style="font-size:14px;font-weight:bold;color:#0a2e14;">${id_number}</span>
          </td></tr>
        </table>

        <!-- HOW TO -->
        <p style="margin:0 0 12px;font-size:14px;font-weight:bold;color:#0a2e14;">How to complete your profile:</p>
        <ol style="margin:0 0 28px;padding-left:20px;">
          <li style="margin-bottom:8px;color:#334155;font-size:14px;line-height:1.6;">Visit <a href="${portal_link}" style="color:#1a7a3c;font-weight:bold;">ideas.theweb3alliance.org</a> and log in</li>
          <li style="margin-bottom:8px;color:#334155;font-size:14px;line-height:1.6;">Click <strong>"My Profile"</strong> from the dashboard</li>
          <li style="margin-bottom:8px;color:#334155;font-size:14px;line-height:1.6;">Fill in all required fields and upload your passport photograph</li>
          <li style="margin-bottom:8px;color:#334155;font-size:14px;line-height:1.6;">Click <strong>"Save Profile"</strong> when done</li>
        </ol>

        <!-- CTA BUTTON -->
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
          <tr><td align="center">
            <a href="${portal_link}" style="display:inline-block;background:linear-gradient(135deg,#0a2e14,#1a7a3c);color:#ffffff;text-decoration:none;font-weight:bold;font-size:16px;padding:16px 40px;border-radius:10px;letter-spacing:0.5px;">
              📝 Complete My Profile Now
            </a>
          </td></tr>
        </table>

        <p style="margin:0;font-size:14px;color:#64748b;line-height:1.7;">
          Need help? Contact us at <a href="mailto:ideas@theweb3alliance.org" style="color:#1a7a3c;">ideas@theweb3alliance.org</a> or join our Telegram group: 
          <a href="https://t.me/+USMLdmxFHyk2Yzc0" style="color:#1a7a3c;">t.me/+USMLdmxFHyk2Yzc0</a>
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
    const { full_name, email, id_number, missing_fields } = JSON.parse(event.body);
    const portal_link = 'https://ideas.theweb3alliance.org';

    const { data, error } = await resend.emails.send({
      from: FROM,
      to: email,
      subject: `⚠️ Action Required — Complete Your IDEAS-TVET Profile, ${full_name}`,
      html: reminderHTML({ full_name, id_number, missing_fields, portal_link }),
    });

    if (error) throw error;
    return { statusCode: 200, body: JSON.stringify({ success: true, id: data.id }) };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
