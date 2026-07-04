// netlify/functions/send-final-warning.js
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = 'IDEAS-TVET Portal <noreply@theweb3alliance.org>';

function warningHTML({ full_name, id_number, deadline, portal_link }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>Final Warning — IDEAS-TVET</title>
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
              <div style="background:rgba(220,38,38,0.3);border-radius:8px;padding:6px 12px;">
                <div style="color:#fca5a5;font-size:11px;font-weight:bold;letter-spacing:1px;">FINAL WARNING</div>
              </div>
            </td>
          </tr>
        </table>
      </td></tr>

      <!-- RED STRIPE -->
      <tr><td style="height:4px;background:linear-gradient(90deg,#dc2626,#c8a82a);"></td></tr>

      <!-- RED ALERT BANNER -->
      <tr><td style="background:#fef2f2;padding:16px 40px;border-bottom:1px solid #fecaca;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td width="40" align="center" style="font-size:28px;">🚨</td>
            <td style="padding-left:12px;">
              <div style="font-size:15px;font-weight:bold;color:#991b1b;">FINAL NOTICE — Immediate Action Required</div>
              <div style="font-size:13px;color:#b91c1c;margin-top:2px;">Your training slot is at risk of being withdrawn</div>
            </td>
          </tr>
        </table>
      </td></tr>

      <!-- BODY -->
      <tr><td style="padding:40px 40px 24px;">
        <p style="margin:0 0 16px;font-size:15px;color:#334155;line-height:1.7;">
          Dear <strong>${full_name}</strong>,
        </p>
        <p style="margin:0 0 16px;font-size:15px;color:#334155;line-height:1.7;">
          Despite previous reminders, our records indicate that your trainee profile on the 
          IDEAS-TVET portal remains <strong>incomplete</strong>. You have not yet uploaded 
          your passport photograph and/or completed all required profile fields.
        </p>
        <p style="margin:0 0 24px;font-size:15px;color:#334155;line-height:1.7;">
          This is your <strong>final notice</strong>. Profile completion is a mandatory requirement 
          for continued participation in this programme.
        </p>

        <!-- DEADLINE BOX -->
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#fef2f2;border:2px solid #dc2626;border-radius:10px;margin-bottom:28px;">
          <tr><td style="padding:20px 24px;text-align:center;">
            <div style="font-size:12px;font-weight:bold;color:#dc2626;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">⏰ Deadline</div>
            <div style="font-size:28px;font-weight:bold;color:#991b1b;">${deadline}</div>
            <div style="font-size:13px;color:#b91c1c;margin-top:6px;">Failure to comply by this date will result in your slot being reallocated</div>
          </td></tr>
        </table>

        <!-- ID -->
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;margin-bottom:24px;">
          <tr><td style="padding:14px 20px;">
            <span style="font-size:12px;color:#94a3b8;">Your Trainee ID: </span>
            <span style="font-size:14px;font-weight:bold;color:#0a2e14;">${id_number}</span>
          </td></tr>
        </table>

        <!-- CONSEQUENCE -->
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#fff7ed;border:1px solid #fed7aa;border-radius:8px;margin-bottom:28px;">
          <tr><td style="padding:16px 20px;">
            <div style="font-size:13px;font-weight:bold;color:#92400e;margin-bottom:8px;">What happens if you do not comply:</div>
            <ul style="margin:0;padding-left:20px;">
              <li style="margin-bottom:6px;color:#9a3412;font-size:13px;line-height:1.6;">Your admission will be <strong>withdrawn</strong></li>
              <li style="margin-bottom:6px;color:#9a3412;font-size:13px;line-height:1.6;">Your slot will be <strong>reallocated</strong> to a qualified candidate from our reserve list of 360+ applicants</li>
              <li style="margin-bottom:6px;color:#9a3412;font-size:13px;line-height:1.6;">You will <strong>forfeit</strong> all stipend payments and certification</li>
              <li style="margin-bottom:0;color:#9a3412;font-size:13px;line-height:1.6;">This programme is <strong>free of charge</strong> — this is a privilege, not a right</li>
            </ul>
          </td></tr>
        </table>

        <!-- STEPS -->
        <p style="margin:0 0 12px;font-size:14px;font-weight:bold;color:#0a2e14;">Complete your profile now in 3 steps:</p>
        <ol style="margin:0 0 28px;padding-left:20px;">
          <li style="margin-bottom:8px;color:#334155;font-size:14px;line-height:1.6;">Go to <a href="${portal_link}" style="color:#1a7a3c;font-weight:bold;">ideas.theweb3alliance.org</a> and log in</li>
          <li style="margin-bottom:8px;color:#334155;font-size:14px;line-height:1.6;">Click <strong>"My Profile"</strong> and complete ALL fields including passport photo upload</li>
          <li style="margin-bottom:8px;color:#334155;font-size:14px;line-height:1.6;">Click <strong>"Save Profile"</strong> — you will receive a confirmation once done</li>
        </ol>

        <!-- CTA BUTTON -->
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
          <tr><td align="center">
            <a href="${portal_link}" style="display:inline-block;background:linear-gradient(135deg,#dc2626,#991b1b);color:#ffffff;text-decoration:none;font-weight:bold;font-size:16px;padding:16px 40px;border-radius:10px;letter-spacing:0.5px;">
              🚨 Complete My Profile Before I Lose My Slot
            </a>
          </td></tr>
        </table>

        <p style="margin:0;font-size:14px;color:#64748b;line-height:1.7;">
          If you are experiencing difficulties, contact us <strong>immediately</strong> at 
          <a href="mailto:ideas@theweb3alliance.org" style="color:#1a7a3c;">ideas@theweb3alliance.org</a> 
          or join our Telegram group: 
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
    const { full_name, email, id_number, deadline } = JSON.parse(event.body);
    const portal_link = 'https://ideas.theweb3alliance.org';

    const { data, error } = await resend.emails.send({
      from: FROM,
      to: email,
      subject: `🚨 FINAL WARNING — Complete Your Profile or Lose Your IDEAS-TVET Slot`,
      html: warningHTML({ full_name, id_number, deadline, portal_link }),
    });

    if (error) throw error;
    return { statusCode: 200, body: JSON.stringify({ success: true, id: data.id }) };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
