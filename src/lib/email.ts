// src/lib/email.ts
import nodemailer from "nodemailer";

// Validate environment variables
const requiredEnvVars = [
  "EMAIL_HOST",
  "EMAIL_PORT",
  "EMAIL_USER",
  "EMAIL_PASSWORD",
];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.warn(
      `Warning: ${envVar} environment variable is not set. Email sending will fail.`,
    );
  }
}

// Configure email transporter for Brevo
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || "smtp-relay.brevo.netlify.app",
  port: parseInt(process.env.EMAIL_PORT || "587"),
  secure: process.env.EMAIL_SECURE === "true",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
  tls: {
    rejectUnauthorized: false,
  },
  connectionTimeout: 10000,
  socketTimeout: 10000,
  pool: true,
  maxConnections: 5,
  rateDelta: 1000,
  rateLimit: 10,
});

if (process.env.NODE_ENV === "development") {
  transporter.verify((error, success) => {
    if (error) {
      console.error("Email transporter error:", error);
    } else {
      console.log("Email server is ready to send messages");
    }
  });
}

export interface ServiceRequestEmailData {
  requestId: string;
  driverName: string;
  driverEmail: string;
  driverPhone: string;
  carRegistration: string;
  carModel?: string;
  serviceType: string;
  amount: number;
  phoneNumber?: string;
  fuelType?: string;
  interest?: number;
  totalRepayable?: number;
  repaymentDays?: number;
  requestDate: string;
}

// Helper function to format date consistently
const formatDateTime = (date: string | Date): string => {
  const d = new Date(date);
  return d.toLocaleString("en-ZA", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

const formatDate = (date: string | Date): string => {
  const d = new Date(date);
  return d.toLocaleDateString("en-ZA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

// Global styles for all email templates
const globalStyles = `
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f0f2f5; margin: 0; padding: 20px; }
  .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
  .header { background-color: #1a4d2a; padding: 30px 20px; text-align: center; }
  .header h1 { color: #ffffff; margin: 0; font-size: 24px; font-weight: bold; }
  .header p { color: #c8e6b5; margin: 8px 0 0; font-size: 14px; }
  .content { padding: 30px; }
  .badge { display: inline-block; padding: 6px 14px; border-radius: 20px; font-size: 12px; font-weight: 600; margin-bottom: 24px; }
  .badge-pending { background-color: #ea8c2b; color: #ffffff; }
  .badge-approved { background-color: #25a73d; color: #ffffff; }
  .badge-rejected { background-color: #b91c1c; color: #ffffff; }
  .badge-uploaded { background-color: #25a73d; color: #ffffff; }
  .card { background-color: #f8f9fa; border-radius: 12px; padding: 20px; margin-bottom: 20px; border: 1px solid #e9ecef; }
  .card-title { color: #1a4d2a; font-size: 16px; font-weight: bold; margin: 0 0 16px 0; padding-bottom: 12px; border-bottom: 2px solid #c8e6b5; }
  .info-row { display: flex; justify-content: space-between; padding: 10px 0; font-size: 14px; border-bottom: 1px solid #e9ecef; }
  .info-row:last-child { border-bottom: none; }
  .label { color: #6c757d; font-weight: 500; }
  .value { color: #212529; font-weight: 600; }
  .amount-card { background: linear-gradient(135deg, #e8f5e9 0%, #c8e6b5 100%); border-radius: 16px; padding: 24px; text-align: center; margin: 20px 0; }
  .amount-label { color: #1a4d2a; font-size: 14px; font-weight: 600; margin: 0 0 8px 0; }
  .amount-value { font-size: 36px; font-weight: bold; color: #1a4d2a; }
  .otp-card { background: linear-gradient(135deg, #f59e0b 0%, #ea580c 100%); border-radius: 16px; padding: 24px; text-align: center; margin: 20px 0; }
  .otp-label { color: #ffffff; font-size: 14px; font-weight: 600; margin: 0 0 12px 0; letter-spacing: 1px; }
  .otp-code { background-color: #ffffff; border-radius: 12px; padding: 16px; font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #1a4d2a; font-family: 'Courier New', monospace; }
  .otp-note { color: #ffffff; font-size: 12px; margin: 12px 0 0 0; opacity: 0.9; }
  .validity-box { background-color: #fef3c7; border-left: 4px solid #ea8c2b; padding: 12px 16px; border-radius: 8px; margin: 16px 0; }
  .validity-text { color: #92400e; font-size: 14px; font-weight: 600; margin: 0; }
  .time-badge { background-color: #ea8c2b; color: white; padding: 4px 12px; border-radius: 20px; font-size: 13px; font-weight: bold; display: inline-block; margin-top: 8px; }
  .driver-highlight { background-color: #e8f5e9; border-radius: 12px; padding: 16px; margin: 16px 0; border: 1px solid #c8e6b5; }
  .driver-name { font-size: 20px; font-weight: bold; color: #1a4d2a; }
  .car-reg { font-size: 16px; color: #2d6a4f; font-weight: 600; }
  .button { display: inline-block; background-color: #2d6a4f; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 600; margin-top: 20px; text-align: center; }
  .button-secondary { display: inline-block; background-color: #6c757d; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 600; margin: 10px 5px; text-align: center; }
  .footer { background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #6c757d; border-top: 1px solid #e9ecef; }
  .info-highlight { background-color: #e3f2fd; border-radius: 12px; padding: 16px; margin: 16px 0; border-left: 4px solid #2196f3; }
  .proof-box { background-color: #e8f5e9; border-radius: 12px; padding: 16px; text-align: center; margin: 16px 0; border: 1px solid #c8e6b5; }
  .remaining-box { background-color: #fef3c7; border-left: 4px solid #ea8c2b; padding: 12px 16px; border-radius: 8px; margin: 16px 0; }
  .remaining-value { font-size: 20px; color: #b91c1c; font-weight: bold; }
  .celebration-box { background: linear-gradient(135deg, #e8f5e9 0%, #c8e6b5 100%); border-radius: 16px; padding: 24px; text-align: center; margin: 20px 0; }
  .reason-box { background-color: #fef2f2; border-left: 4px solid #b91c1c; padding: 16px; border-radius: 8px; margin: 16px 0; }
  .reason-text { color: #991b1b; font-size: 14px; margin: 0; }
  .loan-box { background-color: #e3f2fd; border-radius: 12px; padding: 16px; margin: 16px 0; border-left: 4px solid #2196f3; }
  .success-list { margin: 16px 0 0 20px; color: #212529; font-size: 14px; }
  .success-list li { margin: 8px 0; }
`;

// Admin Notification Email - New Service Request
const generateAdminEmailHtml = (data: ServiceRequestEmailData): string => {
  const serviceTypeMap: Record<string, string> = {
    fuel: "Fuel Request",
    airtime: "Airtime Request",
    cash: "Cash Loan Request",
    carwash: "Car Wash Request",
  };

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>New Service Request</title>
      <style>${globalStyles}</style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Kapuka Services</h1>
          <p>New Service Request Received</p>
        </div>
        <div class="content">
          <div style="text-align: center;">
            <span class="badge badge-pending">PENDING APPROVAL</span>
          </div>
          
          <div class="driver-highlight">
            <div style="text-align: center; margin-bottom: 12px;">
              <div class="driver-name">${data.driverName}</div>
              <div class="car-reg">${data.carRegistration}</div>
            </div>
            <div class="info-row"><span class="label">📧 Email:</span><span class="value">${data.driverEmail}</span></div>
            <div class="info-row"><span class="label">📱 Phone:</span><span class="value">${data.driverPhone}</span></div>
            ${data.carModel ? `<div class="info-row"><span class="label">🚗 Car Model:</span><span class="value">${data.carModel}</span></div>` : ""}
          </div>
          
          <div class="card">
            <div class="card-title">Request Details</div>
            <div class="info-row"><span class="label">Service Type:</span><span class="value">${serviceTypeMap[data.serviceType] || data.serviceType}</span></div>
            <div class="info-row"><span class="label">Request ID:</span><span class="value">${data.requestId.slice(-8).toUpperCase()}</span></div>
            <div class="amount-card" style="margin: 16px 0;">
              <div class="amount-label">💰 Request Amount</div>
              <div class="amount-value">R ${data.amount.toLocaleString()}</div>
            </div>
            <div class="info-row"><span class="label">Request Date:</span><span class="value">${formatDateTime(data.requestDate)}</span></div>
          </div>
          
          <div style="text-align: center;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/service-requests" class="button">Go to Admin Dashboard</a>
          </div>
        </div>
        <div class="footer">
          <p>Kapuka Services - Automated Notification</p>
          <p>This is an automated message, please do not reply.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

export async function sendAdminNotificationEmail(
  data: ServiceRequestEmailData,
) {
  const adminEmail = process.env.ADMIN_EMAIL || "admin@kapuka.com";

  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || '"Kapuka" <noreply@kapuka.com>',
      to: adminEmail,
      subject: `New Service Request: ${data.requestId.slice(-8).toUpperCase()}`,
      html: generateAdminEmailHtml(data),
      text: `New service request from ${data.driverName} for R${data.amount}`,
    });
    console.log("Admin notification email sent:", info.messageId);
    return info;
  } catch (error) {
    console.error("Error sending admin notification email:", error);
    return null;
  }
}

// Driver Approval Email - With prominent OTP display and 1-hour validity
const generateDriverApprovalHtml = (data: {
  driverName: string;
  requestId: string;
  serviceType: string;
  amount: number;
  otp: string;
  carRegistration: string;
}) => {
  const serviceTypeMap: Record<string, string> = {
    fuel: "Fuel",
    airtime: "Airtime",
    cash: "Cash Loan",
    carwash: "Car Wash",
  };

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Service Request Approved</title>
      <style>${globalStyles}</style>
    </head>
    <body>
      <div class="container">
        <div class="header" style="background-color: #25a73d;">
          <h1>Request Approved</h1>
          <p>Your service request has been approved</p>
        </div>
        <div class="content">
          <div style="text-align: center;">
            <span class="badge badge-approved">APPROVED</span>
          </div>
          
          <div class="driver-highlight">
            <div style="text-align: center;">
              <div class="driver-name">${data.driverName}</div>
              <div class="car-reg" style="margin-top: 4px;">Car Reg: ${data.carRegistration}</div>
            </div>
          </div>
          
          <div class="card">
            <div class="card-title">Request Information</div>
            <div class="info-row"><span class="label">Service Type:</span><span class="value">${serviceTypeMap[data.serviceType] || data.serviceType}</span></div>
            <div class="amount-card" style="margin: 16px 0;">
              <div class="amount-label">💰 Approved Amount</div>
              <div class="amount-value">R ${data.amount.toLocaleString()}</div>
            </div>
          </div>
          
          <div class="otp-card">
            <div class="otp-label">YOUR ONE-TIME PASSWORD (OTP)</div>
            <div class="otp-code">${data.otp}</div>
            <div class="otp-note">Please present this code at the service center</div>
          </div>
          
          <div class="validity-box">
            <div class="validity-text">⚠️ IMPORTANT: OTP Validity Information</div>
            <div style="margin-top: 12px; text-align: center;">
              <span class="time-badge">⏰ Valid for 1 hour only</span>
            </div>
            <div style="margin-top: 12px; font-size: 13px; color: #92400e;">
              This OTP will expire <strong>1 hour</strong> from the time of approval.
              Please use it before it expires.
            </div>
          </div>
          
          <div style="text-align: center;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/requests/history" class="button">View My Requests</a>
          </div>
        </div>
        <div class="footer">
          <p>Kapuka Services - Automated Notification</p>
          <p>This is an automated message, please do not reply.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

export async function sendDriverApprovalEmail(data: {
  driverEmail: string;
  driverName: string;
  requestId: string;
  serviceType: string;
  amount: number;
  otp: string;
  carRegistration: string;
}) {
  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || '"Kapuka" <noreply@kapuka.com>',
      to: data.driverEmail,
      subject: `✅ Service Request Approved - ${data.requestId.slice(-8).toUpperCase()}`,
      html: generateDriverApprovalHtml(data),
      text: `Your request for R${data.amount} has been approved. OTP: ${data.otp} - Valid for 1 hour`,
    });
    console.log("Driver approval email sent:", info.messageId);
    return info;
  } catch (error) {
    console.error("Error sending driver approval email:", error);
    return null;
  }
}

// Driver Rejection Email
const generateDriverRejectionHtml = (data: {
  driverName: string;
  driverEmail: string;
  carRegistration: string;
  requestId: string;
  serviceType: string;
  amount: number;
  reason: string;
}) => {
  const serviceTypeMap: Record<string, string> = {
    fuel: "Fuel",
    airtime: "Airtime",
    cash: "Cash Loan",
    carwash: "Car Wash",
  };

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Service Request Rejected</title>
      <style>${globalStyles}</style>
    </head>
    <body>
      <div class="container">
        <div class="header" style="background-color: #b91c1c;">
          <h1>Request Rejected</h1>
          <p>We regret to inform you</p>
        </div>
        <div class="content">
          <div style="text-align: center;">
            <span class="badge badge-rejected">REJECTED</span>
          </div>
          
          <div class="driver-highlight">
            <div class="driver-name">${data.driverName}</div>
            <div class="car-reg">${data.carRegistration}</div>
            <div style="margin-top: 8px; font-size: 12px; color: #6c757d;">Request ID: ${data.requestId.slice(-8).toUpperCase()}</div>
          </div>
          
          <div class="card">
            <div class="card-title">Request Information</div>
            <div class="info-row"><span class="label">Service Type:</span><span class="value">${serviceTypeMap[data.serviceType] || data.serviceType}</span></div>
            <div class="info-row"><span class="label">Amount:</span><span class="value">R ${data.amount.toLocaleString()}</span></div>
          </div>
          
          <div class="reason-box">
            <div style="font-weight: bold; margin-bottom: 8px;">Reason for Rejection:</div>
            <div class="reason-text">${data.reason}</div>
          </div>
          
          <div style="text-align: center;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/requests/new" class="button-secondary">Submit New Request</a>
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/requests/history" class="button">View History</a>
          </div>
        </div>
        <div class="footer">
          <p>Kapuka Services - Automated Notification</p>
          <p>This is an automated message, please do not reply.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

export async function sendDriverRejectionEmail(data: {
  driverEmail: string;
  driverName: string;
  carRegistration: string;
  requestId: string;
  serviceType: string;
  amount: number;
  reason: string;
}) {
  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || '"Kapuka" <noreply@kapuka.com>',
      to: data.driverEmail,
      subject: `❌ Service Request Rejected - ${data.requestId.slice(-8).toUpperCase()}`,
      html: generateDriverRejectionHtml(data),
      text: `Your request for R${data.amount} has been rejected. Reason: ${data.reason}`,
    });
    console.log("Driver rejection email sent:", info.messageId);
    return info;
  } catch (error) {
    console.error("Error sending driver rejection email:", error);
    return null;
  }
}

// Verification Notification Email (Admin)
export async function sendVerificationNotificationEmail(data: {
  driverName: string;
  driverEmail: string;
  driverPhone: string;
  carRegistration: string;
  carModel: string;
  verificationId: string;
  submissionDate: string;
}) {
  const adminEmail = process.env.ADMIN_EMAIL || "admin@kapuka.com";

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>New Driver Verification Request</title>
      <style>${globalStyles}</style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Kapuka Services</h1>
          <p>New Driver Verification Request</p>
        </div>
        <div class="content">
          <div style="text-align: center;">
            <span class="badge badge-pending">PENDING REVIEW</span>
          </div>
          
          <div class="driver-highlight">
            <div class="driver-name">${data.driverName}</div>
            <div class="car-reg">${data.carRegistration}</div>
            <div class="info-row" style="margin-top: 12px;"><span class="label">📧 Email:</span><span class="value">${data.driverEmail}</span></div>
            <div class="info-row"><span class="label">📱 Phone:</span><span class="value">${data.driverPhone}</span></div>
            <div class="info-row"><span class="label">🚗 Car Model:</span><span class="value">${data.carModel || "Not specified"}</span></div>
          </div>
          
          <div class="card">
            <div class="card-title">Verification Status</div>
            <div class="info-row"><span class="label">Status:</span><span class="value">Pending Review</span></div>
            <div class="info-row"><span class="label">Verification ID:</span><span class="value">${data.verificationId.slice(-8).toUpperCase()}</span></div>
            <div class="info-row"><span class="label">Submitted:</span><span class="value">${formatDateTime(data.submissionDate)}</span></div>
          </div>
          
          <div style="text-align: center;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/verifications" class="button">Review Verification</a>
          </div>
        </div>
        <div class="footer">
          <p>Kapuka Services - Automated Notification</p>
          <p>Please review the driver's documents to approve or reject.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || '"Kapuka" <noreply@kapuka.com>',
      to: adminEmail,
      subject: `New Driver Verification Request - ${data.driverName}`,
      html: html,
      text: `New verification request from ${data.driverName} (${data.carRegistration})`,
    });
    console.log("Verification notification email sent:", info.messageId);
    return info;
  } catch (error) {
    console.error("Error sending verification notification email:", error);
    return null;
  }
}

// Driver Verification Result Email
export async function sendDriverVerificationResultEmail(data: {
  driverEmail: string;
  driverName: string;
  carRegistration: string;
  status: "approved" | "rejected";
  reason: string | null;
}) {
  const isApproved = data.status === "approved";

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Driver Verification ${isApproved ? "Approved" : "Rejected"}</title>
      <style>${globalStyles}</style>
    </head>
    <body>
      <div class="container">
        <div class="header" style="background-color: ${isApproved ? "#25a73d" : "#b91c1c"};">
          <h1>${isApproved ? "Verification Approved" : "Verification Rejected"}</h1>
          <p>${isApproved ? "Congratulations! Your account is now active" : "We regret to inform you"}</p>
        </div>
        <div class="content">
          <div style="text-align: center;">
            <span class="badge ${isApproved ? "badge-approved" : "badge-rejected"}">${isApproved ? "APPROVED" : "REJECTED"}</span>
          </div>
          
          <div class="driver-highlight">
            <div class="driver-name">${data.driverName}</div>
            <div class="car-reg">${data.carRegistration}</div>
          </div>
          
          ${
            isApproved
              ? `
            <div class="celebration-box">
              <div style="font-size: 48px; margin-bottom: 8px;">🎉</div>
              <div style="font-weight: bold; font-size: 18px; color: #1a4d2a; margin-bottom: 8px;">Welcome to Kapuka!</div>
              <div style="font-size: 14px; color: #2d6a4f;">Your driver verification has been approved.</div>
            </div>
            <div class="card">
              <div class="card-title">What you can do now:</div>
              <ul class="success-list">
                <li>Request fuel, airtime, cash loans, and car wash services</li>
                <li>Track your request history</li>
                <li>Access all Kapuka features</li>
              </ul>
            </div>
          `
              : `
            <div class="reason-box">
              <div style="font-weight: bold; margin-bottom: 8px;">Reason for rejection:</div>
              <div class="reason-text">${data.reason || "Your documents could not be verified"}</div>
            </div>
            <p style="margin: 16px 0; font-size: 14px;">Please re-submit your verification with correct information to continue using Kapuka services.</p>
          `
          }
          
          <div style="text-align: center;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}${isApproved ? "/requests" : "/verify"}" class="button">
              ${isApproved ? "Start Requesting" : "Re-submit Verification"}
            </a>
          </div>
        </div>
        <div class="footer">
          <p>Kapuka Services - Automated Notification</p>
          <p>This is an automated message, please do not reply.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || '"Kapuka" <noreply@kapuka.com>',
      to: data.driverEmail,
      subject: isApproved
        ? `✅ Driver Verification Approved - Kapuka`
        : `❌ Driver Verification Rejected - Kapuka`,
      html: html,
    });
    console.log(`Driver verification ${data.status} email sent`);
  } catch (error) {
    console.error(`Error sending verification ${data.status} email:`, error);
  }
}

// Admin Repayment Proof Notification Email
export async function sendAdminRepaymentProofEmail(data: {
  driverName: string;
  driverEmail: string;
  driverPhone: string;
  carRegistration: string;
  serviceType: string;
  serviceTypeLabel: string;
  amount: number;
  remainingBalance: number;
  proofUrl: string;
  submittedAt: string;
  repaymentId: string;
}) {
  const adminEmail = process.env.ADMIN_EMAIL || "admin@kapuka.com";

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>New Repayment Proof Submitted</title>
      <style>${globalStyles}</style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Kapuka Services</h1>
          <p>New Repayment Proof Submitted</p>
        </div>
        <div class="content">
          <div style="text-align: center;">
            <span class="badge badge-pending">⏳ PENDING REVIEW</span>
          </div>
          
          <div class="driver-highlight">
            <div class="driver-name">${data.driverName}</div>
            <div class="car-reg">${data.carRegistration}</div>
            <div class="info-row" style="margin-top: 12px;"><span class="label">📧 Email:</span><span class="value">${data.driverEmail}</span></div>
            <div class="info-row"><span class="label">📱 Phone:</span><span class="value">${data.driverPhone}</span></div>
          </div>
          
          <div class="amount-card">
            <div class="amount-label">💰 Repayment Amount</div>
            <div class="amount-value">R ${data.amount.toLocaleString()}</div>
            <div style="margin-top: 8px; font-size: 14px; color: #2d6a4f;">${data.serviceTypeLabel}</div>
          </div>
          
          <div class="remaining-box">
            <div style="font-weight: bold; margin-bottom: 8px;">💰 Remaining Balance After This Payment</div>
            <div class="remaining-value">R ${data.remainingBalance.toLocaleString()}</div>
          </div>
          
          <div class="card">
            <div class="card-title">Payment Details</div>
            <div class="info-row"><span class="label">Service Type:</span><span class="value">${data.serviceTypeLabel}</span></div>
            <div class="info-row"><span class="label">Repayment ID:</span><span class="value">${data.repaymentId.slice(-8).toUpperCase()}</span></div>
            <div class="info-row"><span class="label">Submitted:</span><span class="value">${formatDateTime(data.submittedAt)}</span></div>
          </div>
          
          <div class="proof-box">
            📎 <a href="${data.proofUrl}" target="_blank" style="color: #2d6a4f; font-weight: 600; text-decoration: underline;">View Proof of Payment Document</a>
          </div>
          
          <div class="validity-box">
            <div class="validity-text">⚠️ ACTION REQUIRED</div>
            <div style="margin-top: 8px; font-size: 13px; color: #92400e;">Please review the proof and approve or reject the repayment.</div>
          </div>
          
          <div style="text-align: center;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/repayments" class="button">Review Repayment</a>
          </div>
        </div>
        <div class="footer">
          <p>Kapuka Services - Automated Notification</p>
          <p>Please review the proof and approve or reject the repayment.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || '"Kapuka" <noreply@kapuka.com>',
      to: adminEmail,
      subject: `New Repayment Proof - ${data.driverName} - R${data.amount.toLocaleString()}`,
      html: html,
      text: `New repayment proof submitted by ${data.driverName} for R${data.amount.toLocaleString()}. Remaining balance: R${data.remainingBalance.toLocaleString()}`,
    });
    console.log("Admin repayment proof email sent:", info.messageId);
    return info;
  } catch (error) {
    console.error("Error sending admin repayment proof email:", error);
    return null;
  }
}

// Driver Repayment Approval Email
export async function sendDriverRepaymentApprovalEmail(data: {
  driverEmail: string;
  driverName: string;
  carRegistration: string;
  serviceTypeLabel: string;
  amount: number;
  remainingBalance: number;
  isFullyPaid: boolean;
}) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${data.isFullyPaid ? "Repayment Completed" : "Repayment Approved"}</title>
      <style>${globalStyles}</style>
    </head>
    <body>
      <div class="container">
        <div class="header" style="background-color: ${data.isFullyPaid ? "#25a73d" : "#2d6a4f"};">
          <h1>${data.isFullyPaid ? "Repayment Completed!" : "Repayment Approved"}</h1>
          <p>${data.isFullyPaid ? "Your loan has been fully paid off" : "Your repayment has been verified"}</p>
        </div>
        <div class="content">
          <div style="text-align: center;">
            <span class="badge badge-approved">${data.isFullyPaid ? "✅ FULLY PAID" : "✓ APPROVED"}</span>
          </div>
          
          <div class="driver-highlight">
            <div class="driver-name">${data.driverName}</div>
            <div class="car-reg">${data.carRegistration}</div>
          </div>
          
          <div class="amount-card">
            <div class="amount-label">💰 Payment Amount</div>
            <div class="amount-value">R ${data.amount.toLocaleString()}</div>
            <div style="margin-top: 8px;">${data.serviceTypeLabel}</div>
          </div>
          
          ${
            data.isFullyPaid
              ? `
            <div class="celebration-box">
              <div style="font-size: 48px; margin-bottom: 8px;">🎉</div>
              <div style="font-weight: bold; font-size: 18px; color: #1a4d2a; margin-bottom: 8px;">Congratulations!</div>
              <div style="font-size: 14px; color: #2d6a4f;">Your ${data.serviceTypeLabel} loan is now fully paid off.</div>
              <div style="margin-top: 12px; font-size: 12px; color: #6c757d;">Thank you for being a responsible Kapuka customer!</div>
            </div>
          `
              : `
            <div class="remaining-box">
              <div style="font-weight: bold; margin-bottom: 8px;">💰 Remaining Balance</div>
              <div class="remaining-value">R ${data.remainingBalance.toLocaleString()}</div>
              <div style="margin-top: 8px; font-size: 12px; color: #92400e;">Continue making payments to clear your balance</div>
            </div>
          `
          }
          
          <div style="text-align: center;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/requests/history" class="button">View Payment History</a>
          </div>
        </div>
        <div class="footer">
          <p>Kapuka Services - Automated Notification</p>
          <p>This is an automated message, please do not reply.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || '"Kapuka" <noreply@kapuka.com>',
      to: data.driverEmail,
      subject: data.isFullyPaid
        ? `🎉 ${data.serviceTypeLabel} Fully Paid - Kapuka`
        : `✓ Repayment of R${data.amount.toLocaleString()} Approved - Kapuka`,
      html: html,
      text: `Your repayment of R${data.amount.toLocaleString()} has been approved. Remaining balance: R${data.remainingBalance.toLocaleString()}`,
    });
    console.log("Driver repayment approval email sent:", info.messageId);
    return info;
  } catch (error) {
    console.error("Error sending driver repayment approval email:", error);
    return null;
  }
}

// Driver Repayment Rejection Email
export async function sendDriverRepaymentRejectionEmail(data: {
  driverEmail: string;
  driverName: string;
  carRegistration: string;
  serviceTypeLabel: string;
  amount: number;
  reason: string;
}) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Repayment Proof Rejected</title>
      <style>${globalStyles}</style>
    </head>
    <body>
      <div class="container">
        <div class="header" style="background-color: #b91c1c;">
          <h1>Repayment Proof Rejected</h1>
          <p>We could not verify your payment</p>
        </div>
        <div class="content">
          <div style="text-align: center;">
            <span class="badge badge-rejected">✗ REJECTED</span>
          </div>
          
          <div class="driver-highlight">
            <div class="driver-name">${data.driverName}</div>
            <div class="car-reg">${data.carRegistration}</div>
          </div>
          
          <div class="amount-card" style="background: linear-gradient(135deg, #fef2f2 0%, #fecaca 100%);">
            <div class="amount-label">💰 Affected Payment</div>
            <div class="amount-value" style="color: #b91c1c;">R ${data.amount.toLocaleString()}</div>
            <div style="margin-top: 8px;">${data.serviceTypeLabel}</div>
          </div>
          
          <div class="reason-box">
            <div style="font-weight: bold; margin-bottom: 8px;">Reason for rejection:</div>
            <div class="reason-text">${data.reason}</div>
          </div>
          
          <p style="margin: 16px 0; font-size: 14px;">Please submit a new repayment proof with correct documentation.</p>
          
          <div style="text-align: center;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/requests/history" class="button-secondary">View History</a>
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/requests/repayments" class="button">Submit New Proof</a>
          </div>
        </div>
        <div class="footer">
          <p>Kapuka Services - Automated Notification</p>
          <p>This is an automated message, please do not reply.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || '"Kapuka" <noreply@kapuka.com>',
      to: data.driverEmail,
      subject: `❌ Repayment Proof Rejected - Kapuka`,
      html: html,
      text: `Your repayment proof of R${data.amount.toLocaleString()} was rejected. Reason: ${data.reason}`,
    });
    console.log("Driver repayment rejection email sent:", info.messageId);
    return info;
  } catch (error) {
    console.error("Error sending driver repayment rejection email:", error);
    return null;
  }
}

// ==================== RECEIPT UPLOAD NOTIFICATIONS ====================

// Add these functions to your existing email.ts file

// Admin Receipt Upload Notification Email (POP Upload)
export async function sendAdminReceiptUploadEmail(data: {
  driverName: string;
  driverEmail: string;
  driverPhone: string;
  carRegistration: string;
  serviceType: string;
  serviceTypeLabel: string;
  amount: number;
  actualAmount: number;
  totalRepayable?: number;
  popUrl: string;
  uploadedAt: string;
  requestId: string;
}) {
  const adminEmail = process.env.ADMIN_EMAIL || "admin@kapuka.com";

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>New Receipt Uploaded</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f0f2f5; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        .header { background-color: #1a4d2a; padding: 30px; text-align: center; }
        .header h1 { color: white; margin: 0; font-size: 24px; }
        .header p { color: #c8e6b5; margin: 8px 0 0; }
        .content { padding: 30px; }
        .badge { display: inline-block; background-color: #ea8c2b; color: white; padding: 6px 14px; border-radius: 20px; font-size: 12px; font-weight: 600; margin-bottom: 24px; }
        .card { background: #f8f9fa; border-radius: 12px; padding: 20px; margin-bottom: 20px; border: 1px solid #e9ecef; }
        .card-title { color: #1a4d2a; font-size: 16px; font-weight: bold; margin: 0 0 16px 0; padding-bottom: 12px; border-bottom: 2px solid #c8e6b5; }
        .info-row { display: flex; justify-content: space-between; padding: 10px 0; font-size: 14px; border-bottom: 1px solid #e9ecef; }
        .info-row:last-child { border-bottom: none; }
        .label { color: #6c757d; font-weight: 500; }
        .value { color: #212529; font-weight: 600; }
        .amount-value { font-size: 24px; color: #2d6a4f; font-weight: bold; }
        .actual-amount-value { font-size: 20px; color: #ea8c2b; font-weight: bold; }
        .proof-box { background: white; border: 2px solid #c8e6b5; border-radius: 12px; padding: 16px; text-align: center; margin: 16px 0; }
        .button { display: inline-block; background-color: #2d6a4f; color: white; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 600; margin-top: 20px; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #6c757d; border-top: 1px solid #e9ecef; }
        .loan-details { background-color: #e8f5e9; border-radius: 12px; padding: 16px; margin-top: 16px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Kapuka Services</h1>
          <p>New Receipt Uploaded for Verification</p>
        </div>
        <div class="content">
          <div style="text-align: center;">
            <span class="badge">PENDING VERIFICATION</span>
          </div>
          
          <div class="card">
            <div class="card-title">Driver Information</div>
            <div class="info-row"><span class="label">Driver Name:</span><span class="value">${data.driverName}</span></div>
            <div class="info-row"><span class="label">Email:</span><span class="value">${data.driverEmail}</span></div>
            <div class="info-row"><span class="label">Phone:</span><span class="value">${data.driverPhone}</span></div>
            <div class="info-row"><span class="label">Car Registration:</span><span class="value">${data.carRegistration}</span></div>
          </div>
          
          <div class="card">
            <div class="card-title">Service Details</div>
            <div class="info-row"><span class="label">Service Type:</span><span class="value">${data.serviceTypeLabel}</span></div>
            <div class="info-row"><span class="label">Request ID:</span><span class="value">${data.requestId.slice(-8).toUpperCase()}</span></div>
            <div class="info-row"><span class="label">Requested Amount:</span><span class="value amount-value">R ${data.amount.toLocaleString()}</span></div>
            <div class="info-row"><span class="label">Actual Amount Used:</span><span class="value actual-amount-value">R ${data.actualAmount.toLocaleString()}</span></div>
            ${
              data.totalRepayable
                ? `
            <div class="info-row"><span class="label">Total Repayable (with interest):</span><span class="value">R ${data.totalRepayable.toLocaleString()}</span></div>
            `
                : ""
            }
            <div class="info-row"><span class="label">Uploaded:</span><span class="value">${formatDateTime(data.uploadedAt)}</span></div>
          </div>
          
          ${
            data.totalRepayable
              ? `
          <div class="loan-details">
            <div style="font-weight: bold; margin-bottom: 12px; color: #1a4d2a;">📋 Loan Information</div>
            <div class="info-row"><span class="label">Interest Amount:</span><span class="value">R ${(data.totalRepayable - data.actualAmount).toLocaleString()}</span></div>
            <div class="info-row"><span class="label">Repayment Schedule:</span><span class="value">Daily payments of R ${((data.totalRepayable || 0) / 7).toFixed(2)} for 7 days</span></div>
          </div>
          `
              : ""
          }
          
          <div class="proof-box">
            <div style="font-weight: bold; margin-bottom: 12px; color: #1a4d2a;">📎 Uploaded Receipt</div>
            <a href="${data.popUrl}" target="_blank" style="color: #2d6a4f; text-decoration: underline; word-break: break-all;">View Receipt Document</a>
            <div style="margin-top: 8px; font-size: 12px; color: #6c757d;">Click to view the uploaded receipt</div>
          </div>
          
          <div style="text-align: center;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/service-requests" class="button">Review Receipt</a>
          </div>
          
          <div style="margin-top: 20px; padding: 12px; background-color: #fef3c7; border-radius: 8px; font-size: 12px; color: #92400e;">
            <strong>⚠️ Action Required:</strong> Please verify the receipt and mark the service request as completed if everything is in order.
          </div>
        </div>
        <div class="footer">
          <p>Kapuka Services - Automated Notification</p>
          <p>This is an automated message, please do not reply.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || '"Kapuka" <noreply@kapuka.com>',
      to: adminEmail,
      subject: `New Receipt Uploaded - ${data.driverName} (${data.serviceTypeLabel})`,
      html: html,
      text: `${data.driverName} has uploaded a receipt for their ${data.serviceTypeLabel} request. Amount: R${data.actualAmount.toLocaleString()}. Please verify the receipt.`,
    });
    console.log("Admin receipt upload email sent:", info.messageId);
    return info;
  } catch (error) {
    console.error("Error sending admin receipt upload email:", error);
    return null;
  }
}

// Driver Receipt Upload Confirmation Email
export async function sendDriverReceiptUploadConfirmation(data: {
  driverEmail: string;
  driverName: string;
  carRegistration: string;
  serviceTypeLabel: string;
  amount: number;
  actualAmount: number;
  totalRepayable?: number;
  uploadedAt: string;
  requestId: string;
}) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Receipt Uploaded Successfully</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f0f2f5; margin: 0; padding: 20px; }
        .container { max-width: 550px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        .header { background: #25a73d; padding: 30px; text-align: center; }
        .header h1 { color: white; margin: 0; font-size: 24px; }
        .content { padding: 30px; }
        .success-badge { display: inline-block; background: #25a73d; color: white; padding: 6px 14px; border-radius: 20px; font-size: 12px; font-weight: 600; margin-bottom: 24px; }
        .card { background: #f8f9fa; border-radius: 12px; padding: 20px; margin-bottom: 20px; border: 1px solid #e9ecef; }
        .card-title { color: #1a4d2a; font-size: 16px; font-weight: bold; margin: 0 0 16px 0; padding-bottom: 12px; border-bottom: 2px solid #c8e6b5; }
        .info-row { display: flex; justify-content: space-between; padding: 10px 0; font-size: 14px; border-bottom: 1px solid #e9ecef; }
        .info-row:last-child { border-bottom: none; }
        .label { color: #6c757d; font-weight: 500; }
        .value { color: #212529; font-weight: 600; }
        .amount-box { background: linear-gradient(135deg, #e8f5e9 0%, #c8e6b5 100%); border-radius: 12px; padding: 20px; text-align: center; margin: 20px 0; }
        .amount-value { font-size: 32px; font-weight: bold; color: #1a4d2a; }
        .pending-box { background: #fef3c7; border-radius: 12px; padding: 16px; text-align: center; margin: 20px 0; }
        .loan-summary { background: #e3f2fd; border-radius: 12px; padding: 16px; margin-top: 16px; }
        .button { display: inline-block; background-color: #2d6a4f; color: white; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 600; margin-top: 20px; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #6c757d; border-top: 1px solid #e9ecef; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Receipt Uploaded</h1>
        </div>
        <div class="content">
          <div style="text-align: center;">
            <span class="success-badge">UPLOADED</span>
          </div>
          
          <p style="font-size: 16px; margin-bottom: 20px;">Hello ${data.driverName},</p>
          <p style="margin-bottom: 20px;">Your receipt for your <strong>${data.serviceTypeLabel}</strong> has been successfully uploaded and is pending verification.</p>
          
          <div class="amount-box">
            <div style="margin-bottom: 8px; font-weight: bold; color: #1a4d2a;">Actual Amount Used</div>
            <div class="amount-value">R ${data.actualAmount.toLocaleString()}</div>
            <div style="margin-top: 8px;">${data.serviceTypeLabel} • ${data.carRegistration}</div>
          </div>
          
          ${
            data.totalRepayable
              ? `
          <div class="loan-summary">
            <div style="font-weight: bold; margin-bottom: 12px; color: #1a4d2a;">💰 Loan Summary</div>
            <div class="info-row"><span class="label">Original Amount:</span><span class="value">R ${data.actualAmount.toLocaleString()}</span></div>
            <div class="info-row"><span class="label">Total Repayable:</span><span class="value">R ${data.totalRepayable.toLocaleString()}</span></div>
            <div class="info-row"><span class="label">Interest (15%):</span><span class="value">R ${(data.totalRepayable - data.actualAmount).toLocaleString()}</span></div>
            <div class="info-row"><span class="label">Repayment Period:</span><span class="value">7 days (daily installments)</span></div>
          </div>
          `
              : ""
          }
          
          <div class="pending-box">
            <div style="font-weight: bold; margin-bottom: 8px; color: #92400e;">⏳ Pending Verification</div>
            <div style="font-size: 14px;">Your receipt will be reviewed by our admin team. You will be notified once verified.</div>
          </div>
          
          ${
            data.totalRepayable
              ? `
          <div style="margin-top: 16px; padding: 12px; background-color: #e8f5e9; border-radius: 8px; font-size: 13px;">
            <strong>📌 Next Steps:</strong> Once verified, you'll need to make daily repayments of <strong>R ${(data.totalRepayable / 7).toFixed(2)}</strong> for 7 days.
          </div>
          `
              : ""
          }
          
          <div style="text-align: center;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/requests/history" class="button">Track Your Request</a>
          </div>
        </div>
        <div class="footer">
          <p>Kapuka Services - Automated Notification</p>
          <p>This is an automated message, please do not reply.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || '"Kapuka" <noreply@kapuka.com>',
      to: data.driverEmail,
      subject: `Receipt Uploaded - ${data.serviceTypeLabel} Request`,
      html: html,
      text: `Your receipt for R${data.actualAmount.toLocaleString()} has been uploaded and is pending verification.`,
    });
    console.log(
      "Driver receipt upload confirmation email sent:",
      info.messageId,
    );
    return info;
  } catch (error) {
    console.error(
      "Error sending driver receipt upload confirmation email:",
      error,
    );
    return null;
  }
}

// Add this function to your email.ts file, before the closing of the file

// Repayment Completed Email (for when a loan is fully paid off)
export async function sendRepaymentCompletedEmail(data: {
  driverEmail: string;
  driverName: string;
  carRegistration: string;
  serviceTypeLabel: string;
  totalPaid: number;
  completedDate: string;
}) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Loan Fully Paid - Kapuka</title>
      <style>${globalStyles}</style>
    </head>
    <body>
      <div class="container">
        <div class="header" style="background-color: #25a73d;">
          <h1>Loan Fully Paid! 🎉</h1>
          <p>Congratulations on completing your repayment</p>
        </div>
        <div class="content">
          <div style="text-align: center;">
            <span class="badge badge-approved">✅ FULLY PAID</span>
          </div>
          
          <div class="driver-highlight">
            <div class="driver-name">${data.driverName}</div>
            <div class="car-reg">${data.carRegistration}</div>
          </div>
          
          <div class="celebration-box">
            <div style="font-size: 48px; margin-bottom: 8px;">🎉</div>
            <div style="font-weight: bold; font-size: 18px; color: #1a4d2a; margin-bottom: 8px;">Congratulations!</div>
            <div style="font-size: 14px; color: #2d6a4f;">Your ${data.serviceTypeLabel} loan has been fully paid off.</div>
          </div>
          
          <div class="amount-card">
            <div class="amount-label">💰 Total Amount Repaid</div>
            <div class="amount-value">R ${data.totalPaid.toLocaleString()}</div>
            <div style="margin-top: 8px;">${data.serviceTypeLabel}</div>
          </div>
          
          <div class="card">
            <div class="card-title">Repayment Summary</div>
            <div class="info-row"><span class="label">Service Type:</span><span class="value">${data.serviceTypeLabel}</span></div>
            <div class="info-row"><span class="label">Completed Date:</span><span class="value">${formatDate(data.completedDate)}</span></div>
            <div class="info-row"><span class="label">Status:</span><span class="value" style="color: #25a73d; font-weight: bold;">Fully Paid</span></div>
          </div>
          
          <div class="info-highlight">
            <div style="font-weight: bold; margin-bottom: 8px;">📌 What's Next?</div>
            <div style="font-size: 13px;">
              Thank you for being a responsible Kapuka customer! You can now request new services.
            </div>
          </div>
          
          <div style="text-align: center;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/requests/new" class="button">Request New Service</a>
          </div>
        </div>
        <div class="footer">
          <p>Kapuka Services - Automated Notification</p>
          <p>This is an automated message, please do not reply.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || '"Kapuka" <noreply@kapuka.com>',
      to: data.driverEmail,
      subject: `🎉 ${data.serviceTypeLabel} Fully Paid - Kapuka`,
      html: html,
      text: `Congratulations! Your ${data.serviceTypeLabel} has been fully paid off. Total paid: R${data.totalPaid.toLocaleString()}`,
    });
    console.log("Repayment completed email sent:", info.messageId);
    return info;
  } catch (error) {
    console.error("Error sending repayment completed email:", error);
    return null;
  }
}
