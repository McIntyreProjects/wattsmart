import { NextRequest, NextResponse } from 'next/server'

async function sendContactEmail(name: string, email: string, message: string, subject?: string) {
  const nodemailer = (await import('nodemailer')).default
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    tls: { rejectUnauthorized: false },
  })

  const adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_FROM || 'hello@wattsmart.co.uk'
  const subjectLine = subject
    ? `[Contact] ${subject} — from ${name}`
    : `[Contact] New message from ${name}`

  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="margin:0;padding:0;background:#F7F4EF;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td align="center" style="padding:24px 16px;">
            <table width="100%" style="max-width:560px;background:#ffffff;border-radius:12px;padding:24px 32px;" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding:24px 0 8px;">
                  <span style="font-family:'Fraunces',Georgia,serif;font-size:20px;font-weight:500;color:#1B3A2D;">
                    <span style="display:inline-block;width:9px;height:9px;background:#4AFFA0;border-radius:50%;margin-right:6px;vertical-align:middle;"></span>WattSmart
                  </span>
                </td>
              </tr>
              <tr><td style="border-bottom:1px solid #E5E5E5;padding-bottom:16px;"></td></tr>
              <tr>
                <td style="font-family:Inter,Arial,sans-serif;font-size:15px;color:#1A1A1A;line-height:1.6;padding-top:16px;">
                  <h2 style="font-family:'Fraunces',Georgia,serif;font-size:22px;color:#1B3A2D;margin:0 0 12px;">New contact form message</h2>
                  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;border:1px solid #E5E5E5;border-radius:8px;overflow:hidden;">
                    <tr style="background:#F7F4EF;">
                      <td style="padding:8px 14px;font-size:13px;color:#6B7E74;width:90px;">Name</td>
                      <td style="padding:8px 14px;font-size:13px;color:#1A1A1A;">${name}</td>
                    </tr>
                    <tr>
                      <td style="padding:8px 14px;font-size:13px;color:#6B7E74;">Email</td>
                      <td style="padding:8px 14px;font-size:13px;color:#1A1A1A;"><a href="mailto:${email}" style="color:#1B3A2D;">${email}</a></td>
                    </tr>
                    ${subject ? `<tr style="background:#F7F4EF;"><td style="padding:8px 14px;font-size:13px;color:#6B7E74;">Subject</td><td style="padding:8px 14px;font-size:13px;color:#1A1A1A;">${subject}</td></tr>` : ''}
                  </table>
                  <p style="margin:0 0 8px;font-size:13px;color:#6B7E74;font-weight:600;">Message</p>
                  <div style="background:#F7F4EF;border-radius:8px;padding:14px;font-size:14px;color:#1A1A1A;white-space:pre-wrap;">${message.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
                </td>
              </tr>
              <tr>
                <td style="font-family:Inter,Arial,sans-serif;font-size:12px;color:#6B7E74;border-top:1px solid #E5E5E5;padding-top:16px;margin-top:32px;">
                  WattSmart · wattsmart.co.uk<br/>
                  Reply directly to this email to respond to ${name}.
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `

  await transporter.sendMail({
    from: `"${process.env.SMTP_FROM_NAME || 'WattSmart'}" <${process.env.SMTP_FROM || 'hello@wattsmart.co.uk'}>`,
    replyTo: `"${name}" <${email}>`,
    to: adminEmail,
    subject: subjectLine,
    html,
  })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, email, message, subject } = body

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'name, email and message are required' },
        { status: 400 }
      )
    }

    await sendContactEmail(
      String(name).trim(),
      String(email).trim(),
      String(message).trim(),
      subject ? String(subject).trim() : undefined
    )

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[/api/contact] error:', err)
    return NextResponse.json(
      { error: 'Failed to send message. Please try again or email hello@wattsmart.co.uk directly.' },
      { status: 500 }
    )
  }
}
