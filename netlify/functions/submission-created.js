// Netlify Forms event handler — fires on every form submission.
// Sends a welcome email to the subscriber via Netlify Emails (SendGrid).
// Required env vars (set in Netlify dashboard → Site settings → Environment variables):
//   NETLIFY_EMAILS_PROVIDER_API_KEY  — SendGrid API key
//   NETLIFY_EMAILS_DIRECTORY         — "./emails" (auto-set by Netlify Emails add-on)
//   FROM_EMAIL                       — e.g. "hello@alphalumina.com"

exports.handler = async function (event) {
  // Only handle Netlify Forms submissions
  const payload = JSON.parse(event.body || "{}");
  const formName = payload.form_name || "";
  if (!formName.includes("waitlist") && !formName.includes("early")) {
    return { statusCode: 200, body: "ignored" };
  }

  const email = (payload.data || {}).email;
  if (!email) return { statusCode: 200, body: "no email" };

  const from = process.env.FROM_EMAIL || "hello@alphalumina.com";
  const apiKey = process.env.NETLIFY_EMAILS_PROVIDER_API_KEY;

  if (!apiKey) {
    console.log("No NETLIFY_EMAILS_PROVIDER_API_KEY — skipping autoresponder");
    return { statusCode: 200, body: "no api key" };
  }

  const subject = "You're on the Alphalumina waitlist";
  const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { background:#03030c; color:#f0f0ea; font-family:'Helvetica Neue',Arial,sans-serif; margin:0; padding:0; }
    .wrap { max-width:560px; margin:40px auto; padding:40px 32px; background:#0a0a1f; border:1px solid rgba(196,154,58,0.15); border-radius:8px; }
    h1 { color:#c49a3a; font-size:22px; font-weight:700; margin:0 0 8px; letter-spacing:1px; }
    p  { color:rgba(240,240,234,0.75); font-size:15px; line-height:1.7; margin:16px 0; }
    .badge { display:inline-block; background:rgba(196,154,58,0.1); color:#c49a3a; border:1px solid rgba(196,154,58,0.3); border-radius:4px; padding:4px 12px; font-size:13px; letter-spacing:2px; margin-bottom:24px; }
    .footer { margin-top:32px; font-size:12px; color:rgba(240,240,234,0.25); border-top:1px solid rgba(196,154,58,0.08); padding-top:16px; }
    a { color:#c49a3a; text-decoration:none; }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="badge">ALPHALUMINA</div>
    <h1>You're on the list.</h1>
    <p>We'll notify you when early access opens. Alphalumina is an AI-powered signal intelligence layer for Solana — every setup scored across 20+ dimensions, paper-tested before delivery, outcomes tracked openly.</p>
    <p>What to expect when you join:</p>
    <p>
      ✅ &nbsp;Scored signals with a transparent breakdown<br>
      ✅ &nbsp;Clean Telegram alerts — not noise<br>
      ✅ &nbsp;Paper-validated before you see them<br>
      ✅ &nbsp;Outcome tracking so you can judge the record
    </p>
    <p>In the meantime, keep an eye on <a href="https://alphalumina.com">alphalumina.com</a> for updates.</p>
    <div class="footer">
      You signed up at alphalumina.com. To unsubscribe, reply with "unsubscribe" in the subject.
    </div>
  </div>
</body>
</html>`;

  try {
    const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email }] }],
        from: { email: from, name: "Alphalumina" },
        subject,
        content: [{ type: "text/html", value: htmlBody }],
      }),
    });
    if (!res.ok) {
      console.error("SendGrid error:", res.status, await res.text());
    } else {
      console.log("Autoresponder sent to", email);
    }
  } catch (err) {
    console.error("Autoresponder failed:", err.message);
  }

  return { statusCode: 200, body: "ok" };
};
