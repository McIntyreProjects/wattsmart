import nodemailer from 'nodemailer'

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

const brand = `
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td style="padding:24px 0 8px;">
        <span style="font-family:'Fraunces',Georgia,serif;font-size:20px;font-weight:500;color:#1B3A2D;">
          <span style="display:inline-block;width:9px;height:9px;background:#4AFFA0;border-radius:50%;margin-right:6px;vertical-align:middle;"></span>WattSmart
        </span>
      </td>
    </tr>
    <tr><td style="border-bottom:1px solid #E5E5E5;padding-bottom:16px;"></td></tr>
  </table>
`

const footer = `
  <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:32px;">
    <tr><td style="border-top:1px solid #E5E5E5;padding-top:16px;"></td></tr>
    <tr>
      <td style="font-family:Inter,Arial,sans-serif;font-size:12px;color:#6B7E74;padding-top:8px;">
        WattSmart · wattsmart.co.uk<br/>
        This email was sent from an unmonitored address. For help, contact hello@wattsmart.co.uk
      </td>
    </tr>
  </table>
`

function wrap(body: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
    <body style="margin:0;padding:0;background:#F7F4EF;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td align="center" style="padding:24px 16px;">
            <table width="100%" style="max-width:560px;background:#ffffff;border-radius:12px;padding:24px 32px;" cellpadding="0" cellspacing="0">
              <tr><td>${brand}</td></tr>
              <tr><td style="font-family:Inter,Arial,sans-serif;font-size:15px;color:#1A1A1A;line-height:1.6;">${body}</td></tr>
              <tr><td>${footer}</td></tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `
}

async function send(to: string, subject: string, html: string) {
  await transporter.sendMail({
    from: `"${process.env.SMTP_FROM_NAME}" <${process.env.SMTP_FROM}>`,
    to,
    subject,
    html: wrap(html),
  })
}

export async function sendEnquiryConfirmation(to: string, ref: string, name: string) {
  await send(
    to,
    "We've received your WattSmart enquiry",
    `
    <h2 style="font-family:'Fraunces',Georgia,serif;font-size:22px;color:#1B3A2D;margin:24px 0 12px;">Hi ${name},</h2>
    <p>We've received your enquiry and your reference is <strong>${ref}</strong>.</p>
    <p>We're now matching you with up to three certified local installers. Once they've submitted their quotes (usually within 5 days), we'll email you so you can compare them — completely anonymously.</p>
    <p>You won't hear from any installer directly until you choose to proceed.</p>
    <p style="margin-top:24px;">— The WattSmart team</p>
    `
  )
}

export async function sendQuotesReady(to: string, ref: string, loginUrl: string) {
  await send(
    to,
    'Your quotes are ready to compare',
    `
    <h2 style="font-family:'Fraunces',Georgia,serif;font-size:22px;color:#1B3A2D;margin:24px 0 12px;">Your quotes are in.</h2>
    <p>We've received quotes for your enquiry <strong>${ref}</strong>. You can now compare them side by side — no installer names, no pressure.</p>
    <p style="margin:24px 0;">
      <a href="${loginUrl}" style="background:#1B3A2D;color:#4AFFA0;text-decoration:none;border-radius:8px;padding:12px 28px;font-family:Inter,Arial,sans-serif;font-weight:500;font-size:15px;display:inline-block;">Compare your quotes →</a>
    </p>
    <p style="font-size:13px;color:#6B7E74;">All installers are MCS certified and independently verified by WattSmart.</p>
    `
  )
}

export async function sendInstallerChosen(to: string, ref: string, portalUrl: string) {
  await send(
    to,
    'A customer has chosen your quote',
    `
    <h2 style="font-family:'Fraunces',Georgia,serif;font-size:22px;color:#1B3A2D;margin:24px 0 12px;">Great news — you've been chosen.</h2>
    <p>A customer has selected your quote for job <strong>${ref}</strong>.</p>
    <p>The customer's deposit has been paid and your 95% share has been transferred to your Stripe account. Contact them within three working days to arrange a site survey.</p>
    <p style="margin:24px 0;">
      <a href="${portalUrl}" style="background:#1B3A2D;color:#4AFFA0;text-decoration:none;border-radius:8px;padding:12px 28px;font-family:Inter,Arial,sans-serif;font-weight:500;font-size:15px;display:inline-block;">View job details →</a>
    </p>
    `
  )
}

export async function sendDepositConfirmedCustomer(to: string, ref: string, amount: string) {
  await send(
    to,
    "Your deposit is confirmed. You're all set.",
    `
    <h2 style="font-family:'Fraunces',Georgia,serif;font-size:22px;color:#1B3A2D;margin:24px 0 12px;">Deposit confirmed.</h2>
    <p>Your deposit of <strong>${amount}</strong> for job <strong>${ref}</strong> has been paid securely to your installer through WattSmart.</p>
    <p>Your installer will be in touch within three working days to arrange your site survey and confirm your installation date.</p>
    `
  )
}

export async function sendDepositConfirmedInstaller(to: string, ref: string) {
  await send(
    to,
    'Deposit received — contact the customer to arrange your survey',
    `
    <h2 style="font-family:'Fraunces',Georgia,serif;font-size:22px;color:#1B3A2D;margin:24px 0 12px;">Deposit received.</h2>
    <p>The customer has paid their deposit for job <strong>${ref}</strong>. Your 95% share has been transferred to your Stripe account.</p>
    <p>Please contact the customer within three working days to arrange a site survey.</p>
    `
  )
}

export async function sendDepositReleased(to: string, ref: string, amount: string) {
  await send(
    to,
    'Your deposit payment is confirmed',
    `
    <h2 style="font-family:'Fraunces',Georgia,serif;font-size:22px;color:#1B3A2D;margin:24px 0 12px;">Payment confirmed.</h2>
    <p>The deposit of <strong>${amount}</strong> for job <strong>${ref}</strong> was paid to your Stripe account at the time of payment. The 5% WattSmart referral fee was deducted automatically when the customer paid.</p>
    `
  )
}

export async function sendFeeInvoice(
  to: string,
  ref: string,
  amount: string,
  dueDate: string,
  invoiceUrl: string,
  breakdown?: {
    totalInstallFee: string
    wattsmartTotalFee: string
    depositFeeCollected: string
    amountNowDue: string
  }
) {
  const breakdownHtml = breakdown
    ? `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;border:1px solid #E5E5E5;border-radius:8px;overflow:hidden;">
      <tr style="background:#F7F4EF;">
        <td style="padding:10px 16px;font-family:Inter,Arial,sans-serif;font-size:13px;color:#6B7E74;">Total installation value</td>
        <td style="padding:10px 16px;font-family:Inter,Arial,sans-serif;font-size:13px;color:#1A1A1A;text-align:right;">${breakdown.totalInstallFee}</td>
      </tr>
      <tr>
        <td style="padding:10px 16px;font-family:Inter,Arial,sans-serif;font-size:13px;color:#6B7E74;">WattSmart referral fee (5%)</td>
        <td style="padding:10px 16px;font-family:Inter,Arial,sans-serif;font-size:13px;color:#1A1A1A;text-align:right;">${breakdown.wattsmartTotalFee}</td>
      </tr>
      <tr style="background:#F7F4EF;">
        <td style="padding:10px 16px;font-family:Inter,Arial,sans-serif;font-size:13px;color:#6B7E74;">Deposit fee already collected</td>
        <td style="padding:10px 16px;font-family:Inter,Arial,sans-serif;font-size:13px;color:#1A1A1A;text-align:right;">−${breakdown.depositFeeCollected}</td>
      </tr>
      <tr style="border-top:2px solid #1B3A2D;">
        <td style="padding:12px 16px;font-family:Inter,Arial,sans-serif;font-size:14px;font-weight:600;color:#1B3A2D;">Amount now due</td>
        <td style="padding:12px 16px;font-family:Inter,Arial,sans-serif;font-size:14px;font-weight:600;color:#1B3A2D;text-align:right;">${breakdown.amountNowDue}</td>
      </tr>
    </table>
    `
    : `<p>Amount due: <strong>${amount}</strong></p>`

  await send(
    to,
    `WattSmart referral fee invoice — Job #${ref}`,
    `
    <h2 style="font-family:'Fraunces',Georgia,serif;font-size:22px;color:#1B3A2D;margin:24px 0 12px;">Referral fee invoice.</h2>
    <p>A referral fee invoice has been generated for job <strong>${ref}</strong>.</p>
    ${breakdownHtml}
    <p>Due date: <strong>${dueDate}</strong></p>
    <p style="margin:24px 0;">
      <a href="${invoiceUrl}" style="background:#1B3A2D;color:#4AFFA0;text-decoration:none;border-radius:8px;padding:12px 28px;font-family:Inter,Arial,sans-serif;font-weight:500;font-size:15px;display:inline-block;">View invoice →</a>
    </p>
    `
  )
}

export async function sendNewInstallerApplication(adminEmail: string, companyName: string, adminUrl: string) {
  await send(
    adminEmail,
    `New installer application — ${companyName}`,
    `
    <h2 style="font-family:'Fraunces',Georgia,serif;font-size:22px;color:#1B3A2D;margin:24px 0 12px;">New application.</h2>
    <p><strong>${companyName}</strong> has submitted an installer application. All certifications have been verified.</p>
    <p style="margin:24px 0;">
      <a href="${adminUrl}" style="background:#1B3A2D;color:#4AFFA0;text-decoration:none;border-radius:8px;padding:12px 28px;font-family:Inter,Arial,sans-serif;font-weight:500;font-size:15px;display:inline-block;">Review application →</a>
    </p>
    `
  )
}

export async function sendCertExpiring(to: string, certType: string, expiresDate: string) {
  await send(
    to,
    `Action needed — your ${certType.toUpperCase()} expires in 30 days`,
    `
    <h2 style="font-family:'Fraunces',Georgia,serif;font-size:22px;color:#1B3A2D;margin:24px 0 12px;">Certification expiring soon.</h2>
    <p>Your <strong>${certType.toUpperCase()}</strong> certification expires on <strong>${expiresDate}</strong>.</p>
    <p>Please renew it before the expiry date to avoid your account being paused. Once renewed, log in to your WattSmart portal and update your certification number — we'll re-verify automatically.</p>
    `
  )
}

export async function sendCertExpired(to: string, certType: string, companyName?: string) {
  const isAdmin = !!companyName
  await send(
    to,
    isAdmin
      ? `Installer paused — ${companyName} ${certType.toUpperCase()} expired`
      : `Your account has been paused — ${certType.toUpperCase()} has expired`,
    isAdmin
      ? `<p>The installer <strong>${companyName}</strong> has had their account automatically paused because their <strong>${certType.toUpperCase()}</strong> certification has expired.</p>`
      : `
      <h2 style="font-family:'Fraunces',Georgia,serif;font-size:22px;color:#1B3A2D;margin:24px 0 12px;">Account paused.</h2>
      <p>Your <strong>${certType.toUpperCase()}</strong> certification has expired and your WattSmart account has been automatically paused. You will not receive new job briefs until your certification is renewed.</p>
      <p>Once renewed, log in to your portal and update your certification number to reactivate your account.</p>
      `
  )
}

export async function sendApplicationApproved(to: string, companyName: string, portalUrl: string) {
  await send(
    to,
    'Welcome to WattSmart — your account is live',
    `
    <h2 style="font-family:'Fraunces',Georgia,serif;font-size:22px;color:#1B3A2D;margin:24px 0 12px;">Welcome, ${companyName}.</h2>
    <p>Your WattSmart installer account is now live. You'll start receiving job briefs for properties in your coverage area.</p>
    <p style="margin:24px 0;">
      <a href="${portalUrl}" style="background:#1B3A2D;color:#4AFFA0;text-decoration:none;border-radius:8px;padding:12px 28px;font-family:Inter,Arial,sans-serif;font-weight:500;font-size:15px;display:inline-block;">Go to your dashboard →</a>
    </p>
    `
  )
}

export async function sendApplicationRejected(to: string, companyName: string, reason?: string) {
  await send(
    to,
    'Your WattSmart application',
    `
    <h2 style="font-family:'Fraunces',Georgia,serif;font-size:22px;color:#1B3A2D;margin:24px 0 12px;">Application update.</h2>
    <p>Thank you for applying to join WattSmart, ${companyName}.</p>
    <p>Unfortunately we're unable to approve your application at this time.${reason ? ` Reason: ${reason}` : ''}</p>
    <p>If you believe this is an error or your circumstances have changed, please contact hello@wattsmart.co.uk.</p>
    `
  )
}

export async function sendInstallerInvite(to: string, companyName: string, inviteUrl: string) {
  await send(
    to,
    `You've been invited to join ${companyName} on WattSmart`,
    `
    <h2 style="font-family:'Fraunces',Georgia,serif;font-size:22px;color:#1B3A2D;margin:24px 0 12px;">You've been invited.</h2>
    <p>Someone at <strong>${companyName}</strong> has invited you to join their WattSmart workspace.</p>
    <p>Click the button below to create your account and get started. This link expires in 7 days.</p>
    <p style="margin:24px 0;">
      <a href="${inviteUrl}" style="background:#1B3A2D;color:#4AFFA0;text-decoration:none;border-radius:8px;padding:12px 28px;font-family:Inter,Arial,sans-serif;font-weight:500;font-size:15px;display:inline-block;">Accept invite →</a>
    </p>
    <p style="font-size:13px;color:#6B7B6E;">If you weren't expecting this, you can safely ignore it.</p>
    `
  )
}
