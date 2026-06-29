// src/lib/email.ts
import nodemailer from "nodemailer";
import { formatMoney, toMoney } from "@/lib/money";

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

// Helper function to get all admin emails
const getAdminEmails = (): string[] => {
  const emails: string[] = [];

  // Check for individual admin email variables
  if (process.env.ADMIN_EMAIL_1) emails.push(process.env.ADMIN_EMAIL_1);
  if (process.env.ADMIN_EMAIL_2) emails.push(process.env.ADMIN_EMAIL_2);
  if (process.env.ADMIN_EMAIL_3) emails.push(process.env.ADMIN_EMAIL_3);
  if (process.env.ADMIN_EMAIL_4) emails.push(process.env.ADMIN_EMAIL_4);
  if (process.env.ADMIN_EMAIL_5) emails.push(process.env.ADMIN_EMAIL_5);

  // Fallback to single ADMIN_EMAIL if no individual ones are set
  if (emails.length === 0 && process.env.ADMIN_EMAIL) {
    emails.push(process.env.ADMIN_EMAIL);
  }

  // Final fallback default
  if (emails.length === 0) {
    emails.push("admin@kapuka.com");
  }

  return emails;
};

// Configure email transporter for Brevo (SMTP)
// Connection pooling is enabled only in development; in serverless (Vercel)
// each invocation is isolated so pooled sockets cannot be reused.
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
  connectionTimeout: 30000,
  socketTimeout: 30000,
  pool: process.env.NODE_ENV === "development",
  maxConnections: 5,
  rateDelta: 1000,
  rateLimit: 10,
} as any);

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

// Global styles for all email templates - Modern & Clean
const globalStyles = `
  body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    background-color: #f4f6f9;
    margin: 0;
    padding: 24px;
    -webkit-font-smoothing: antialiased;
  }
  .container {
    max-width: 580px;
    margin: 0 auto;
    background-color: #ffffff;
    border-radius: 20px;
    overflow: hidden;
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08), 0 1px 4px rgba(0, 0, 0, 0.04);
  }
  .header {
    background: linear-gradient(135deg, #0d4a2a 0%, #1a6b3e 50%, #0d4a2a 100%);
    padding: 36px 28px;
    text-align: center;
    position: relative;
  }
  .header::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, #bff202, #72bf00, #bff202);
  }
  .header h1 {
    color: #ffffff;
    margin: 0;
    font-size: 26px;
    font-weight: 700;
    letter-spacing: -0.5px;
  }
  .header p {
    color: rgba(255, 255, 255, 0.85);
    margin: 6px 0 0;
    font-size: 15px;
    font-weight: 400;
  }
  .content {
    padding: 32px;
  }
  .badge {
    display: inline-block;
    padding: 7px 18px;
    border-radius: 24px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.5px;
    text-transform: uppercase;
    margin-bottom: 24px;
  }
  .badge-pending { background-color: #f59e0b; color: #ffffff; }
  .badge-approved { background-color: #16a34a; color: #ffffff; }
  .badge-rejected { background-color: #dc2626; color: #ffffff; }
  .badge-uploaded { background-color: #16a34a; color: #ffffff; }
  .badge-info { background-color: #3b82f6; color: #ffffff; }
  .card {
    background-color: #f8fafc;
    border-radius: 14px;
    padding: 22px;
    margin-bottom: 20px;
    border: 1px solid #e2e8f0;
  }
  .card-title {
    color: #0d4a2a;
    font-size: 15px;
    font-weight: 700;
    margin: 0 0 14px 0;
    padding-bottom: 12px;
    border-bottom: 2px solid #dcfce7;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .info-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 0;
    font-size: 14px;
    border-bottom: 1px solid #f1f5f9;
  }
  .info-row:last-child { border-bottom: none; }
  .label { color: #64748b; font-weight: 500; }
  .value { color: #0f172a; font-weight: 600; }
  .amount-card {
    background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 50%, #bbf7d0 100%);
    border-radius: 16px;
    padding: 24px;
    text-align: center;
    margin: 20px 0;
    border: 1px solid #e2e8f0;
  }
  .amount-label {
    color: #0d4a2a;
    font-size: 13px;
    font-weight: 600;
    margin: 0 0 6px 0;
    letter-spacing: 0.3px;
  }
  .amount-value {
    font-size: 38px;
    font-weight: 800;
    color: #0d4a2a;
    letter-spacing: -1px;
    line-height: 1.1;
  }
  .otp-card {
    background: linear-gradient(135deg, #fef3c7 0%, #fde68a 50%, #fcd34d 100%);
    border-radius: 16px;
    padding: 28px 24px;
    text-align: center;
    margin: 20px 0;
    border: 1px solid #fcd34d;
  }
  .otp-label {
    color: #78350f;
    font-size: 12px;
    font-weight: 700;
    margin: 0 0 14px 0;
    letter-spacing: 2px;
    text-transform: uppercase;
  }
  .otp-code {
    background-color: #ffffff;
    border-radius: 14px;
    padding: 18px 20px;
    font-size: 40px;
    font-weight: 800;
    letter-spacing: 10px;
    color: #0d4a2a;
    font-family: 'SF Mono', 'Fira Code', 'Courier New', monospace;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    display: inline-block;
  }
  .otp-note {
    color: #78350f;
    font-size: 13px;
    margin: 14px 0 0 0;
    opacity: 0.85;
  }
  .validity-box {
    background-color: #fef3c7;
    border-radius: 12px;
    padding: 16px 20px;
    margin: 16px 0;
    border: 1px solid #fde68a;
  }
  .validity-text { color: #92400e; font-size: 14px; font-weight: 700; margin: 0; }
  .time-badge {
    background-color: #ea580c;
    color: white;
    padding: 5px 14px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 700;
    display: inline-block;
    margin-top: 8px;
    letter-spacing: 0.3px;
  }
  .driver-highlight {
    background: linear-gradient(135deg, #f0fdf4 0%, #f8fafc 100%);
    border-radius: 14px;
    padding: 20px;
    margin: 16px 0;
    border: 1px solid #dcfce7;
  }
  .driver-name { font-size: 20px; font-weight: 700; color: #0d4a2a; letter-spacing: -0.3px; }
  .car-reg { font-size: 15px; color: #16a34a; font-weight: 600; }
  .button {
    display: inline-block;
    background: linear-gradient(135deg, #0d4a2a 0%, #16a34a 100%);
    color: #ffffff;
    text-decoration: none;
    padding: 14px 32px;
    border-radius: 12px;
    font-weight: 600;
    font-size: 14px;
    margin-top: 20px;
    text-align: center;
    box-shadow: 0 2px 8px rgba(22, 163, 74, 0.2);
    transition: all 0.2s ease;
  }
  .button-secondary {
    display: inline-block;
    background-color: #ffffff;
    color: #0d4a2a;
    text-decoration: none;
    padding: 13px 30px;
    border-radius: 12px;
    font-weight: 600;
    font-size: 14px;
    margin: 10px 4px;
    text-align: center;
    border: 2px solid #0d4a2a;
  }
  .footer {
    background-color: #f8fafc;
    padding: 24px;
    text-align: center;
    font-size: 12px;
    color: #94a3b8;
    border-top: 1px solid #e2e8f0;
    line-height: 1.6;
  }
  .footer strong { color: #64748b; }
  .info-highlight {
    background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
    border-radius: 14px;
    padding: 20px;
    margin: 16px 0;
    border: 1px solid #bfdbfe;
  }
  .proof-box {
    background-color: #f0fdf4;
    border-radius: 14px;
    padding: 20px;
    text-align: center;
    margin: 16px 0;
    border: 1px solid #bbf7d0;
  }
  .remaining-box {
    background-color: #fef3c7;
    border-radius: 12px;
    padding: 16px 20px;
    margin: 16px 0;
    border: 1px solid #fde68a;
  }
  .remaining-value { font-size: 22px; color: #dc2626; font-weight: 800; letter-spacing: -0.5px; }
  .celebration-box {
    background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 50%, #bbf7d0 100%);
    border-radius: 16px;
    padding: 28px 24px;
    text-align: center;
    margin: 20px 0;
    border: 1px solid #86efac;
  }
  .reason-box {
    background-color: #fef2f2;
    border-radius: 12px;
    padding: 18px 20px;
    margin: 16px 0;
    border: 1px solid #fecaca;
    border-left: 4px solid #dc2626;
  }
  .reason-text { color: #991b1b; font-size: 14px; margin: 0; line-height: 1.5; }
  .loan-box {
    background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
    border-radius: 14px;
    padding: 20px;
    margin: 16px 0;
    border: 1px solid #bfdbfe;
  }
  .success-list { margin: 16px 0 0 20px; color: #0f172a; font-size: 14px; line-height: 1.6; }
  .success-list li { margin: 8px 0; }
  .divider { height: 1px; background: #e2e8f0; margin: 20px 0; }
  .icon-circle {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 48px;
    height: 48px;
    border-radius: 50%;
    font-size: 24px;
    margin-bottom: 12px;
  }
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
          <h1>Kapuka Tradings</h1>
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
            <div class="info-row"><span class="label"> Email:</span><span class="value">${data.driverEmail}</span></div>
            <div class="info-row"><span class="label"> Phone:</span><span class="value">${data.driverPhone}</span></div>
            ${data.carModel ? `<div class="info-row"><span class="label"> Car Model:</span><span class="value">${data.carModel}</span></div>` : ""}
          </div>
          
          <div class="card">
            <div class="card-title">Request Details</div>
            <div class="info-row"><span class="label">Service Type:</span><span class="value">${serviceTypeMap[data.serviceType] || data.serviceType}</span></div>
            <div class="info-row"><span class="label">Request ID:</span><span class="value">${data.requestId.slice(-8).toUpperCase()}</span></div>
            <div class="amount-card" style="margin: 16px 0;">
              <div class="amount-label"> Request Amount</div>
              <div class="amount-value">${formatMoney(data.amount)}</div>
            </div>
            <div class="info-row"><span class="label">Request Date:</span><span class="value">${formatDateTime(data.requestDate)}</span></div>
          </div>
          
          <div style="text-align: center;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/service-requests" class="button">Go to Admin Dashboard</a>
          </div>
        </div>
        <div class="footer">
          <p>Kapuka Tradings - Automated Notification</p>
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
  const adminEmails = getAdminEmails();

  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || '"Kapuka" <noreply@kapuka.com>',
      to: adminEmails,
      subject: `New Service Request: ${data.requestId.slice(-8).toUpperCase()}`,
      html: generateAdminEmailHtml(data),
      text: `New service request from ${data.driverName} for R${data.amount}`,
    });
    console.log("Admin notification email sent to:", adminEmails.join(", "));
    console.log("Email ID:", info.messageId);
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
  bankName?: string;
  accountHolder?: string;
  accountNumber?: string;
  branchCode?: string;
}) => {
  const serviceTypeMap: Record<string, string> = {
    fuel: "Fuel",
    airtime: "Airtime",
    cash: "Cash Loan",
    carwash: "Car Wash",
  };

  const isCash = data.serviceType === "cash";

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
              <div class="amount-label"> Approved Amount</div>
              <div class="amount-value">${formatMoney(data.amount)}</div>
            </div>
          </div>
          
          <div class="otp-card">
            <div class="otp-label">YOUR ONE-TIME PASSWORD (OTP)</div>
            <div class="otp-code">${data.otp}</div>
            <div class="otp-note">Please present this code at the service center</div>
          </div>
          
          <div class="validity-box">
            <div class="validity-text"> IMPORTANT: OTP Validity Information</div>
            <div style="margin-top: 12px; text-align: center;">
              <span class="time-badge"> Valid for 1 hour only</span>
            </div>
            <div style="margin-top: 12px; font-size: 13px; color: #92400e;">
              This OTP will expire <strong>1 hour</strong> from the time of approval.
              Please use it before it expires.
            </div>
          </div>

          ${isCash ? `
          <div class="card" style="background: #f0fdf4; border: 2px solid #16a34a; margin-top: 20px;">
            <div class="card-title" style="color: #166534;">Driver Banking Details</div>
            <div style="padding: 12px; font-size: 14px; line-height: 1.8;">
              ${data.bankName ? `<div><strong>Bank:</strong> ${data.bankName}</div>` : ''}
              ${data.accountHolder ? `<div><strong>Account Holder:</strong> ${data.accountHolder}</div>` : ''}
              ${data.accountNumber ? `<div><strong>Account Number:</strong> ${data.accountNumber}</div>` : ''}
              ${data.branchCode ? `<div><strong>Branch Code:</strong> ${data.branchCode}</div>` : ''}
              ${!data.bankName && !data.accountNumber ? '<div style="color: #dc2626; font-style: italic;">No banking details on file. Please contact support.</div>' : ''}
            </div>
          </div>
          <div style="background: #fef2f2; border: 3px solid #dc2626; border-radius: 12px; padding: 16px; margin-top: 16px; text-align: center;">
            <h3 style="color: #dc2626; margin: 0 0 8px 0; font-size: 18px; font-weight: 800;">⚠ PLEASE VERIFY AND CONFIRM</h3>
            <p style="color: #991b1b; margin: 0; font-size: 14px; line-height: 1.5;">
              Before releasing funds, verify the above banking details with the driver. 
              Kapuka Tradings is not liable for payments made to incorrect accounts.
            </p>
          </div>
          ` : ''}
          
          <div style="text-align: center;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/requests/history" class="button">View My Requests</a>
          </div>
        </div>
        <div class="footer">
          <p>Kapuka Tradings - Automated Notification</p>
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
  bankName?: string;
  accountHolder?: string;
  accountNumber?: string;
  branchCode?: string;
}) {
  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || '"Kapuka" <noreply@kapuka.com>',
      to: data.driverEmail,
      subject: ` Service Request Approved - ${data.requestId.slice(-8).toUpperCase()}`,
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
            <div class="info-row"><span class="label">Amount:</span><span class="value">${formatMoney(data.amount)}</span></div>
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
          <p>Kapuka Tradings - Automated Notification</p>
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
      subject: ` Service Request Rejected - ${data.requestId.slice(-8).toUpperCase()}`,
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
// Verification Notification Email (Admin) - Debug Version
export async function sendVerificationNotificationEmail(data: {
  driverName: string;
  driverEmail: string;
  driverPhone: string;
  carRegistration: string;
  carModel: string;
  verificationId: string;
  submissionDate: string;
}) {
  // Add debug logging
  console.log("=== sendVerificationNotificationEmail Debug ===");
  console.log("Received data:", JSON.stringify(data, null, 2));
  console.log("driverEmail value:", data.driverEmail);
  console.log("driverPhone value:", data.driverPhone);
  console.log("===========================================");

  const adminEmails = getAdminEmails();

  // Validate required fields
  if (!data.driverEmail) {
    console.error("ERROR: driverEmail is missing or empty!");
    return null;
  }

  if (!data.driverPhone) {
    console.warn("WARNING: driverPhone is missing or empty");
  }

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
          <h1>Kapuka Tradings</h1>
          <p>New Driver Verification Request</p>
        </div>
        <div class="content">
          <div style="text-align: center;">
            <span class="badge badge-pending">PENDING REVIEW</span>
          </div>
          
          <div class="driver-highlight">
            <div class="driver-name">${data.driverName || "N/A"}</div>
            <div class="car-reg">${data.carRegistration || "N/A"}</div>
            <div class="info-row" style="margin-top: 12px;"><span class="label"> Email:</span><span class="value">${data.driverEmail || "Not provided"}</span></div>
            <div class="info-row"><span class="label"> Phone:</span><span class="value">${data.driverPhone || "Not provided"}</span></div>
            <div class="info-row"><span class="label"> Car Model:</span><span class="value">${data.carModel || "Not specified"}</span></div>
          </div>
          
          <div class="card">
            <div class="card-title">Verification Status</div>
            <div class="info-row"><span class="label">Status:</span><span class="value">Pending Review</span></div>
            <div class="info-row"><span class="label">Verification ID:</span><span class="value">${data.verificationId?.slice(-8).toUpperCase() || "N/A"}</span></div>
            <div class="info-row"><span class="label">Submitted:</span><span class="value">${formatDateTime(data.submissionDate)}</span></div>
          </div>
          
          <div style="text-align: center;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/verifications" class="button">Review Verification</a>
          </div>
        </div>
        <div class="footer">
          <p>Kapuka Tradings - Automated Notification</p>
          <p>Please review the driver's documents to approve or reject.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || '"Kapuka" <noreply@kapuka.com>',
      to: adminEmails,
      subject: `New Driver Verification Request - ${data.driverName || "Unknown"}`,
      html: html,
      text: `New verification request from ${data.driverName || "Unknown"} (${data.carRegistration || "Unknown"})`,
    });
    console.log(
      "Verification notification email sent to:",
      adminEmails.join(", "),
    );
    console.log("Email ID:", info.messageId);
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
              <div style="font-size: 48px; margin-bottom: 8px;"></div>
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
            <p style="margin: 16px 0; font-size: 14px;">Please re-submit your verification with correct information to continue using Kapuka Tradings.</p>
          `
          }
          
          <div style="text-align: center;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}${isApproved ? "/requests" : "/verify"}" class="button">
              ${isApproved ? "Start Requesting" : "Re-submit Verification"}
            </a>
          </div>
        </div>
        <div class="footer">
          <p>Kapuka Tradings - Automated Notification</p>
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
        ? ` Driver Verification Approved - Kapuka`
        : ` Driver Verification Rejected - Kapuka`,
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
  const adminEmails = getAdminEmails();

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
          <h1>Kapuka Tradings</h1>
          <p>New Repayment Proof Submitted</p>
        </div>
        <div class="content">
          <div style="text-align: center;">
            <span class="badge badge-pending"> PENDING REVIEW</span>
          </div>
          
          <div class="driver-highlight">
            <div class="driver-name">${data.driverName}</div>
            <div class="car-reg">${data.carRegistration}</div>
            <div class="info-row" style="margin-top: 12px;"><span class="label"> Email:</span><span class="value">${data.driverEmail}</span></div>
            <div class="info-row"><span class="label"> Phone:</span><span class="value">${data.driverPhone}</span></div>
          </div>
          
          <div class="amount-card">
            <div class="amount-label"> Repayment Amount</div>
            <div class="amount-value">${formatMoney(data.amount)}</div>
            <div style="margin-top: 8px; font-size: 14px; color: #2d6a4f;">${data.serviceTypeLabel}</div>
          </div>
          
          <div class="remaining-box">
            <div style="font-weight: bold; margin-bottom: 8px;"> Remaining Balance After This Payment</div>
            <div class="remaining-value">${formatMoney(data.remainingBalance)}</div>
          </div>
          
          <div class="card">
            <div class="card-title">Payment Details</div>
            <div class="info-row"><span class="label">Service Type:</span><span class="value">${data.serviceTypeLabel}</span></div>
            <div class="info-row"><span class="label">Repayment ID:</span><span class="value">${data.repaymentId.slice(-8).toUpperCase()}</span></div>
            <div class="info-row"><span class="label">Submitted:</span><span class="value">${formatDateTime(data.submittedAt)}</span></div>
          </div>
          
          <div class="proof-box">
             <a href="${data.proofUrl}" target="_blank" style="color: #2d6a4f; font-weight: 600; text-decoration: underline;">View Proof of Payment Document</a>
          </div>
          
          <div class="validity-box">
            <div class="validity-text"> ACTION REQUIRED</div>
            <div style="margin-top: 8px; font-size: 13px; color: #92400e;">Please review the proof and approve or reject the repayment.</div>
          </div>
          
          <div style="text-align: center;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/repayments" class="button">Review Repayment</a>
          </div>
        </div>
        <div class="footer">
          <p>Kapuka Tradings - Automated Notification</p>
          <p>Please review the proof and approve or reject the repayment.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || '"Kapuka" <noreply@kapuka.com>',
      to: adminEmails,
      subject: `New Repayment Proof - ${data.driverName} - ${formatMoney(data.amount)}`,
      html: html,
      text: `New repayment proof submitted by ${data.driverName} for ${formatMoney(data.amount)}. Remaining balance: ${formatMoney(data.remainingBalance)}`,
    });
    console.log("Admin repayment proof email sent to:", adminEmails.join(", "));
    console.log("Email ID:", info.messageId);
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
            <span class="badge badge-approved">${data.isFullyPaid ? " FULLY PAID" : " APPROVED"}</span>
          </div>
          
          <div class="driver-highlight">
            <div class="driver-name">${data.driverName}</div>
            <div class="car-reg">${data.carRegistration}</div>
          </div>
          
          <div class="amount-card">
            <div class="amount-label"> Payment Amount</div>
            <div class="amount-value">${formatMoney(data.amount)}</div>
            <div style="margin-top: 8px;">${data.serviceTypeLabel}</div>
          </div>
          
          ${
            data.isFullyPaid
              ? `
            <div class="celebration-box">
              <div style="font-size: 48px; margin-bottom: 8px;"></div>
              <div style="font-weight: bold; font-size: 18px; color: #1a4d2a; margin-bottom: 8px;">Congratulations!</div>
              <div style="font-size: 14px; color: #2d6a4f;">Your ${data.serviceTypeLabel} loan is now fully paid off.</div>
              <div style="margin-top: 12px; font-size: 12px; color: #6c757d;">Thank you for being a responsible Kapuka customer!</div>
            </div>
          `
              : `
            <div class="remaining-box">
              <div style="font-weight: bold; margin-bottom: 8px;"> Remaining Balance</div>
              <div class="remaining-value">${formatMoney(data.remainingBalance)}</div>
              <div style="margin-top: 8px; font-size: 12px; color: #92400e;">Continue making payments to clear your balance</div>
            </div>
          `
          }
          
          <div style="text-align: center;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/requests/history" class="button">View Payment History</a>
          </div>
        </div>
        <div class="footer">
          <p>Kapuka Tradings - Automated Notification</p>
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
        ? ` ${data.serviceTypeLabel} Fully Paid - Kapuka`
        : ` Repayment of ${formatMoney(data.amount)} Approved - Kapuka`,
      html: html,
      text: `Your repayment of ${formatMoney(data.amount)} has been approved. Remaining balance: ${formatMoney(data.remainingBalance)}`,
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
            <span class="badge badge-rejected"> REJECTED</span>
          </div>
          
          <div class="driver-highlight">
            <div class="driver-name">${data.driverName}</div>
            <div class="car-reg">${data.carRegistration}</div>
          </div>
          
          <div class="amount-card" style="background: linear-gradient(135deg, #fef2f2 0%, #fecaca 100%);">
            <div class="amount-label"> Affected Payment</div>
            <div class="amount-value" style="color: #b91c1c;">${formatMoney(data.amount)}</div>
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
          <p>Kapuka Tradings - Automated Notification</p>
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
      subject: ` Repayment Proof Rejected - Kapuka`,
      html: html,
      text: `Your repayment proof of ${formatMoney(data.amount)} was rejected. Reason: ${data.reason}`,
    });
    console.log("Driver repayment rejection email sent:", info.messageId);
    return info;
  } catch (error) {
    console.error("Error sending driver repayment rejection email:", error);
    return null;
  }
}

// ==================== RECEIPT UPLOAD NOTIFICATIONS ====================

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
  const adminEmails = getAdminEmails();

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>New Receipt Uploaded</title>
      <style>${globalStyles}</style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Kapuka Tradings</h1>
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
            <div class="info-row"><span class="label">Requested Amount:</span><span class="value amount-value">${formatMoney(data.amount)}</span></div>
            <div class="info-row"><span class="label">Actual Amount Used:</span><span class="value actual-amount-value">${formatMoney(data.actualAmount)}</span></div>
            ${
              data.totalRepayable
                ? `
            <div class="info-row"><span class="label">Total Repayable (with interest):</span><span class="value">${formatMoney(data.totalRepayable)}</span></div>
            `
                : ""
            }
            <div class="info-row"><span class="label">Uploaded:</span><span class="value">${formatDateTime(data.uploadedAt)}</span></div>
          </div>
          
          ${
            data.totalRepayable
              ? `
          <div class="loan-details">
            <div style="font-weight: bold; margin-bottom: 12px; color: #1a4d2a;"> Loan Information</div>
            <div class="info-row"><span class="label">Interest Amount:</span><span class="value">${formatMoney(toMoney(data.totalRepayable - data.actualAmount))}</span></div>
            <div class="info-row"><span class="label">Repayment Schedule:</span><span class="value">Daily payments of ${formatMoney(toMoney((data.totalRepayable || 0) / 7))} for 7 days</span></div>
          </div>
          `
              : ""
          }
          
          <div class="proof-box">
            <div style="font-size: 14px; color: #0d4a2a; margin-bottom: 6px;"> Uploaded Receipt</div>
            <a href="${data.popUrl}" target="_blank" style="color: #16a34a; font-weight: 700; text-decoration: underline; word-break: break-all;">View Receipt Document  &gt; </a>
            <div style="margin-top: 6px; font-size: 12px; color: #64748b;">Click to view the uploaded receipt</div>
          </div>
          
          <div style="text-align: center;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/service-requests" class="button">Review Receipt</a>
          </div>
          
          <div class="validity-box">
            <div class="validity-text"> Action Required</div>
            <div style="margin-top: 6px; font-size: 13px; color: #92400e;">Please verify the receipt and mark the service request as completed if everything is in order.</div>
          </div>
        </div>
        <div class="footer">
          <p><strong>Kapuka Tradings</strong>  --  Automated Notification</p>
          <p>This is an automated message, please do not reply.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || '"Kapuka" <noreply@kapuka.com>',
      to: adminEmails,
      subject: `New Receipt Uploaded - ${data.driverName} (${data.serviceTypeLabel})`,
      html: html,
      text: `${data.driverName} has uploaded a receipt for their ${data.serviceTypeLabel} request. Amount: ${formatMoney(data.actualAmount)}. Please verify the receipt.`,
    });
    console.log("Admin receipt upload email sent to:", adminEmails.join(", "));
    console.log("Email ID:", info.messageId);
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
      <style>${globalStyles}</style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Receipt Uploaded</h1>
        </div>
        <div class="content">
          <div style="text-align: center;">
            <span class="badge badge-approved">UPLOADED</span>
          </div>
          
          <p style="font-size: 16px; margin: 0 0 20px; color: #0f172a; line-height: 1.6;">Hello ${data.driverName},</p>
          <p style="margin: 0 0 24px; color: #475569; line-height: 1.6; font-size: 15px;">Your receipt for your <strong style="color: #0d4a2a;">${data.serviceTypeLabel}</strong> has been successfully uploaded and is pending verification.</p>
          
          <div class="amount-card">
            <div class="amount-label">Actual Amount Used</div>
            <div class="amount-value">${formatMoney(data.actualAmount)}</div>
            <div style="margin-top: 10px; color: #64748b; font-size: 14px;">${data.serviceTypeLabel}  -  ${data.carRegistration}</div>
          </div>
          
          ${
            data.totalRepayable
              ? `
          <div class="loan-box">
            <div style="font-weight: bold; margin-bottom: 12px; color: #0d4a2a;"> Loan Summary</div>
            <div class="info-row"><span class="label">Original Amount:</span><span class="value">${formatMoney(data.actualAmount)}</span></div>
            <div class="info-row"><span class="label">Total Repayable:</span><span class="value">${formatMoney(data.totalRepayable)}</span></div>
            <div class="info-row"><span class="label">Interest (15%):</span><span class="value">${formatMoney(toMoney(data.totalRepayable - data.actualAmount))}</span></div>
            <div class="info-row"><span class="label">Repayment Period:</span><span class="value">7 days (daily installments)</span></div>
          </div>
          `
              : ""
          }
          
          <div class="validity-box">
            <div class="validity-text"> Pending Verification</div>
            <div style="margin-top: 6px; font-size: 14px; color: #92400e;">Your receipt will be reviewed by our admin team. You will be notified once verified.</div>
          </div>
          
          ${
            data.totalRepayable
              ? `
          <div class="info-highlight">
            <strong style="color: #1e40af;"> Next Steps:</strong>
            <div style="margin-top: 6px; color: #1e3a5f; font-size: 14px;">Once verified, you'll need to make daily repayments of <strong>${formatMoney(toMoney(data.totalRepayable / 7))}</strong> for 7 days.</div>
          </div>
          `
              : ""
          }
          
          <div style="text-align: center;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/requests/history" class="button">Track Your Request</a>
          </div>
        </div>
        <div class="footer">
          <p><strong>Kapuka Tradings</strong>  --  Automated Notification</p>
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
      text: `Your receipt for ${formatMoney(data.actualAmount)} has been uploaded and is pending verification.`,
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

// ==================== INVOICE EMAIL ====================

export interface InvoiceEmailData {
  driverEmail: string;
  driverName: string;
  carRegistration: string;
  carModel?: string;
  serviceTypeLabel: string;
  requestId: string;
  invoiceDate: string;
  // Fuel fields
  actualAmount?: number;
  interestRate?: number;
  interestAmount?: number;
  totalRepayable?: number;
  dailyPayment?: number;
  repaymentDays?: number;
  // Car wash fields
  packageName?: string;
  serviceCharge?: number;
  totalDue?: number;
}

const generateInvoiceHtml = (data: InvoiceEmailData): string => {
  const invoiceId = `INV-${data.requestId.slice(-8).toUpperCase()}`;
  const isFuel = !!data.totalRepayable && data.totalRepayable > (data.actualAmount || 0);
  const isCarWash = !isFuel;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Invoice - Kapuka Tradings</title>
      <style>${globalStyles}</style>
      <style>
        .invoice-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; padding-bottom: 20px; border-bottom: 2px solid #0d4a2a; }
        .invoice-title { font-size: 32px; font-weight: 800; color: #0d4a2a; letter-spacing: -1px; margin: 0; }
        .invoice-subtitle { color: #64748b; font-size: 13px; margin: 4px 0 0; }
        .invoice-meta { text-align: right; }
        .invoice-meta-item { font-size: 14px; margin: 2px 0; }
        .invoice-meta-label { color: #64748b; }
        .invoice-meta-value { color: #0f172a; font-weight: 600; }
        .bill-section { margin-bottom: 24px; }
        .bill-label { color: #64748b; font-size: 11px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; margin: 0 0 8px; }
        .bill-name { font-size: 18px; font-weight: 700; color: #0f172a; margin: 0; }
        .bill-detail { color: #475569; font-size: 14px; margin: 2px 0; }
        .table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .table th { background-color: #f8fafc; color: #0d4a2a; font-size: 11px; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase; text-align: left; padding: 12px 16px; border-bottom: 2px solid #0d4a2a; }
        .table td { padding: 14px 16px; border-bottom: 1px solid #e2e8f0; font-size: 14px; color: #0f172a; }
        .table td:last-child, .table th:last-child { text-align: right; }
        .table td:nth-child(2), .table th:nth-child(2) { text-align: right; }
        .totals { margin-top: 16px; border-top: 2px solid #e2e8f0; padding-top: 16px; text-align: right; }
        .total-row { display: flex; justify-content: flex-end; padding: 6px 0; gap: 40px; }
        .total-label { color: #64748b; font-size: 14px; }
        .total-value { color: #0f172a; font-weight: 600; font-size: 14px; min-width: 100px; text-align: right; }
        .grand-total { border-top: 2px solid #0d4a2a; margin-top: 8px; padding-top: 12px; }
        .grand-total .total-label { color: #0d4a2a; font-size: 16px; font-weight: 700; }
        .grand-total .total-value { color: #0d4a2a; font-size: 20px; font-weight: 800; }
        .terms { background-color: #f8fafc; border-radius: 12px; padding: 16px; margin: 20px 0; font-size: 13px; color: #64748b; line-height: 1.5; }
        .terms strong { color: #0f172a; }
        .status-paid { display: inline-block; background-color: #16a34a; color: #ffffff; padding: 6px 16px; border-radius: 20px; font-size: 12px; font-weight: 700; letter-spacing: 0.5px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Kapuka Tradings</h1>
          <p>Official Tax Invoice</p>
        </div>
        <div class="content">
          <div class="invoice-header">
            <div>
              <h2 class="invoice-title">INVOICE</h2>
              <p class="invoice-subtitle">${data.serviceTypeLabel} Service</p>
              <div style="color: #dc2626; font-weight: 800; font-size: 13px; margin-top: 4px;">Remember to do immediate payment.</div>
            </div>
            <div class="invoice-meta">
              <div class="invoice-meta-item"><span class="invoice-meta-label">Invoice #:</span> <span class="invoice-meta-value">${invoiceId}</span></div>
              <div class="invoice-meta-item"><span class="invoice-meta-label">Date:</span> <span class="invoice-meta-value">${formatDate(data.invoiceDate)}</span></div>
              <div style="margin-top: 8px;"><span class="status-paid">AMOUNT DUE</span></div>
            </div>
          </div>

          <div class="bill-section">
            <p class="bill-label">Bill To</p>
            <p class="bill-name">${data.driverName}</p>
            <p class="bill-detail">${data.carRegistration}${data.carModel ? ` | ${data.carModel}` : ""}</p>
          </div>

          <table class="table">
            <thead>
              <tr>
                <th>Description</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              ${
                isCarWash && data.packageName
                  ? `
              <tr>
                <td>Car Wash - ${data.packageName} Package</td>
                <td>${formatMoney(data.actualAmount! - (data.serviceCharge || 0))}</td>
              </tr>
              ${data.serviceCharge && data.serviceCharge > 0 ? `
              <tr>
                <td>Service Charge</td>
                <td>${formatMoney(data.serviceCharge)}</td>
              </tr>
              ` : ""}
              `
                  : `
              <tr>
                <td>Fuel - Actual Amount Used</td>
                <td>${formatMoney(data.actualAmount!)}</td>
              </tr>
              ${data.interestAmount && data.interestAmount > 0 ? `
              <tr>
                <td>Interest (${data.interestRate || 13}%)</td>
                <td>${formatMoney(data.interestAmount)}</td>
              </tr>
              ` : ""}
              `
              }
            </tbody>
          </table>

          <div class="totals">
            <div class="total-row">
              <span class="total-label">Subtotal:</span>
              <span class="total-value">${formatMoney(data.actualAmount!)}</span>
            </div>
            ${
              data.interestAmount && data.interestAmount > 0
                ? `<div class="total-row"><span class="total-label">Interest (${data.interestRate || 13}%):</span><span class="total-value">${formatMoney(data.interestAmount)}</span></div>`
                : ""
            }
            ${
              data.serviceCharge && data.serviceCharge > 0
                ? `<div class="total-row"><span class="total-label">Service Charge:</span><span class="total-value">${formatMoney(data.serviceCharge)}</span></div>`
                : ""
            }
            <div class="total-row grand-total">
              <span class="total-label">Total Due:</span>
              <span class="total-value">${formatMoney(data.totalRepayable || data.totalDue || data.actualAmount!)}</span>
            </div>
          </div>

          ${
            isFuel && data.dailyPayment && data.repaymentDays
              ? `
          <div class="terms">
            <strong>Payment Terms:</strong><br>
            This invoice is for a fuel loan. The total repayable amount of <strong>${formatMoney(data.totalRepayable!)}</strong> includes interest at ${data.interestRate || 13}%.<br>
            The amount due must be paid in full within <strong>${data.repaymentDays} days</strong>.<br>
            Please ensure payment is made on time to avoid penalties.
          </div>
          `
              : `
          <div class="terms">
            <strong>Payment Terms:</strong><br>
            This invoice has been fully paid. No further action is required.<br>
            Thank you for choosing Kapuka Tradings.
          </div>
          `
          }

          <div class="validity-box">
            <div class="validity-text"> Banking Details</div>
            <div style="margin-top: 8px; font-size: 13px; line-height: 1.6; color: #333;">
              <strong>Bank:</strong> FNB/RMB<br>
              <strong>Account Holder:</strong> Japhet Sibuyi<br>
              <strong>Account Type:</strong> FNB Aspire Current Account<br>
              <strong>Account Number:</strong> 63131222307<br>
              <strong>Branch Code:</strong> 250655<br>
              <strong style="color: #dc2626;">Reference:</strong> Please use your <strong style="color: #dc2626;">car registration (${data.carRegistration})</strong> as payment reference
            </div>
          </div>

          <div class="validity-box" style="background-color: #fef3c7; border-color: #fde68a;">
            <div class="validity-text" style="color: #92400e;"> Reminder: Immediate Payment Required</div>
            <div style="margin-top: 6px; font-size: 13px; color: #92400e;">Please process payment immediately to avoid any service interruptions.</div>
          </div>

          <div style="text-align: center;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/requests/history" class="button">View Request History</a>
          </div>
        </div>
        <div class="footer">
          <p><strong>Kapuka Tradings</strong> -- Automated Invoice</p>
          <p>This is an automatically generated invoice. Please do not reply to this email.</p>
          <p>For queries, contact: ${process.env.EMAIL_FROM ? `Kapuka Support` : "support@kapuka.com"}</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

export async function sendDriverInvoiceEmail(data: InvoiceEmailData) {
  const invoiceId = `INV-${data.requestId.slice(-8).toUpperCase()}`;

  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || '"Kapuka" <noreply@kapuka.com>',
      to: data.driverEmail,
      subject: `Invoice ${invoiceId} - ${data.serviceTypeLabel} Service - Kapuka Tradings`,
      html: generateInvoiceHtml(data),
      text: `Invoice ${invoiceId}\n\nDear ${data.driverName},\n\nThank you for your payment. Please find your invoice attached.\n\nService: ${data.serviceTypeLabel}\nAmount: ${formatMoney(data.actualAmount || 0)}\nTotal: ${formatMoney(data.totalRepayable || data.totalDue || data.actualAmount || 0)}\n\nBANKING DETAILS:\nBank: FNB/RMB\nAccount Holder: Japhet Sibuyi\nAccount Type: FNB Aspire Current Account\nAccount Number: 63131222307\nBranch Code: 250655\nReference: Use your car registration (${data.carRegistration})\n\nRemember to do immediate payment.\n\nThank you for choosing Kapuka Tradings.`,
    });
    console.log("Driver invoice email sent:", info.messageId);
    return info;
  } catch (error) {
    console.error("Error sending driver invoice email:", error);
    return null;
  }
}

// ==================== WEEKLY INVOICE SUMMARY ====================

const serviceTypeLabelMap: Record<string, string> = {
  fuel: "Fuel",
  airtime: "Airtime",
  cash: "Cash Loan",
  carwash: "Car Wash",
};

export async function sendDriverWeeklyInvoiceEmail(data: {
  driverEmail: string;
  driverName: string;
  totalOutstanding: number;
  items: {
    type: string;
    carNumber: string;
    amount: number;
    totalRepayable: number;
    remainingBalance: number;
  }[];
  discountPercent?: number;
}) {
  const statementId = `WKS-${Date.now().toString(36).toUpperCase()}`;
  const discountPct = data.discountPercent || 0;
  const discountMultiplier = discountPct > 0 ? (113 - discountPct) / 113 : 1;
  const discountIntMult = discountPct > 0 ? (13 - discountPct) / 13 : 1;
  const tableRows = data.items
    .map(
      (item) => {
        const itemDiscounted = discountPct > 0 ? item.remainingBalance * discountMultiplier : item.remainingBalance;
        const itemIntDiscounted = discountPct > 0 ? (item.totalRepayable - item.amount) * discountIntMult : (item.totalRepayable - item.amount);
        return `
    <tr>
      <td>${serviceTypeLabelMap[item.type] || item.type} - ${item.carNumber}</td>
      <td>${formatMoney(item.amount)}</td>
      <td>${discountPct > 0 ? `<span style="text-decoration: line-through; color: #94a3b8; font-size: 12px;">${formatMoney(item.totalRepayable)}</span> <span style="color: #dc2626; font-weight: 700;">${formatMoney(item.totalRepayable * discountMultiplier)}</span>` : formatMoney(item.totalRepayable)}</td>
      <td>${discountPct > 0 ? `<span style="text-decoration: line-through; color: #94a3b8; font-size: 12px;">${formatMoney(item.totalRepayable - item.amount)}</span> <span style="color: #dc2626; font-weight: 700;">${formatMoney(itemIntDiscounted)}</span>` : formatMoney(item.totalRepayable - item.amount)}</td>
      <td style="color: #dc2626; font-weight: 700;">${discountPct > 0 ? `<span style="text-decoration: line-through; color: #94a3b8; font-size: 12px; font-weight: 400;">${formatMoney(item.remainingBalance)}</span> ${formatMoney(itemDiscounted)}` : formatMoney(item.remainingBalance)}</td>
    </tr>`;
      },
    )
    .join("");

  const totalInterest = data.items.reduce(
    (sum, item) => sum + (item.totalRepayable - item.amount),
    0,
  );
  const totalAmount = data.items.reduce((sum, item) => sum + item.amount, 0);
  const totalRepayableAll = data.items.reduce(
    (sum, item) => sum + item.totalRepayable,
    0,
  );

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Weekly Statement - Kapuka Tradings</title>
      <style>${globalStyles}</style>
      <style>
        .invoice-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; padding-bottom: 20px; border-bottom: 2px solid #0d4a2a; }
        .invoice-title { font-size: 28px; font-weight: 800; color: #0d4a2a; letter-spacing: -1px; margin: 0; }
        .invoice-subtitle { color: #64748b; font-size: 13px; margin: 4px 0 0; }
        .invoice-meta { text-align: right; }
        .invoice-meta-item { font-size: 14px; margin: 2px 0; }
        .invoice-meta-label { color: #64748b; }
        .invoice-meta-value { color: #0f172a; font-weight: 600; }
        .bill-section { margin-bottom: 24px; }
        .bill-label { color: #64748b; font-size: 11px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; margin: 0 0 8px; }
        .bill-name { font-size: 18px; font-weight: 700; color: #0f172a; margin: 0; }
        .bill-detail { color: #475569; font-size: 14px; margin: 2px 0; }
        .table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .table th { background-color: #f8fafc; color: #0d4a2a; font-size: 10px; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase; text-align: left; padding: 12px 10px; border-bottom: 2px solid #0d4a2a; }
        .table td { padding: 12px 10px; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #0f172a; }
        .table th:last-child, .table td:last-child { text-align: right; }
        .table th:nth-child(2), .table td:nth-child(2) { text-align: right; }
        .table th:nth-child(3), .table td:nth-child(3) { text-align: right; }
        .table th:nth-child(4), .table td:nth-child(4) { text-align: right; }
        .totals { margin-top: 16px; border-top: 2px solid #e2e8f0; padding-top: 16px; text-align: right; }
        .total-row { display: flex; justify-content: flex-end; padding: 6px 0; gap: 40px; }
        .total-label { color: #64748b; font-size: 14px; }
        .total-value { color: #0f172a; font-weight: 600; font-size: 14px; min-width: 100px; text-align: right; }
        .grand-total { border-top: 2px solid #0d4a2a; margin-top: 8px; padding-top: 12px; }
        .grand-total .total-label { color: #0d4a2a; font-size: 16px; font-weight: 700; }
        .grand-total .total-value { color: #dc2626; font-size: 22px; font-weight: 800; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Kapuka Tradings</h1>
          <p>Weekly Statement of Account</p>
        </div>
        <div class="content">
          <div class="invoice-header">
            <div>
              <h2 class="invoice-title">STATEMENT</h2>
              <p class="invoice-subtitle">Outstanding Balances</p>
              <div style="color: #dc2626; font-weight: 800; font-size: 13px; margin-top: 4px;">Remember to do immediate payment.</div>
            </div>
            <div class="invoice-meta">
              <div class="invoice-meta-item"><span class="invoice-meta-label">Statement #:</span> <span class="invoice-meta-value">${statementId}</span></div>
              <div class="invoice-meta-item"><span class="invoice-meta-label">Date:</span> <span class="invoice-meta-value">${formatDate(new Date().toISOString())}</span></div>
              <div class="invoice-meta-item"><span class="invoice-meta-label">Items:</span> <span class="invoice-meta-value">${data.items.length}</span></div>
            </div>
          </div>

          <div class="bill-section">
            <p class="bill-label">Bill To</p>
            <p class="bill-name">${data.driverName}</p>
            <p class="bill-detail">${data.driverEmail}</p>
          </div>

          <table class="table">
            <thead>
              <tr>
                <th>Service</th>
                <th>Amount</th>
                <th>Total Repayable</th>
                <th>Interest</th>
                <th>Outstanding</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>

          <div class="totals">
            ${discountPct > 0 ? `<div style="text-align: right; color: #dc2626; font-size: 11px; font-weight: 700; margin-bottom: 8px;">${discountPct}% DISCOUNT APPLIED</div>` : ''}
            <div class="total-row">
              <span class="total-label">Total Amount:</span>
              <span class="total-value">${formatMoney(totalAmount)}</span>
            </div>
            <div class="total-row">
              <span class="total-label">Total Interest:</span>
              ${discountPct > 0 ? `<span class="total-value"><span style="text-decoration: line-through; color: #94a3b8; font-size: 12px;">${formatMoney(totalInterest)}</span> <span style="color: #dc2626;">${formatMoney(totalInterest * discountIntMult)}</span></span>` : `<span class="total-value">${formatMoney(totalInterest)}</span>`}
            </div>
            <div class="total-row">
              <span class="total-label">Total Repayable:</span>
              ${discountPct > 0 ? `<span class="total-value"><span style="text-decoration: line-through; color: #94a3b8; font-size: 12px;">${formatMoney(totalRepayableAll)}</span> <span style="color: #dc2626;">${formatMoney(totalRepayableAll * discountMultiplier)}</span></span>` : `<span class="total-value">${formatMoney(totalRepayableAll)}</span>`}
            </div>
            <div class="total-row grand-total">
              <span class="total-label">Total Outstanding:</span>
              ${discountPct > 0 ? `<span class="total-value"><span style="text-decoration: line-through; color: #94a3b8; font-size: 14px;">${formatMoney(totalRepayableAll)}</span> <span style="color: #dc2626;">${formatMoney(data.totalOutstanding)}</span></span>` : `<span class="total-value">${formatMoney(data.totalOutstanding)}</span>`}
            </div>
          </div>

          <div class="validity-box">
            <div class="validity-text"> Banking Details</div>
            <div style="margin-top: 8px; font-size: 13px; line-height: 1.6; color: #333;">
              <strong>Bank:</strong> FNB/RMB<br>
              <strong>Account Holder:</strong> Japhet Sibuyi<br>
              <strong>Account Type:</strong> FNB Aspire Current Account<br>
              <strong>Account Number:</strong> 63131222307<br>
              <strong>Branch Code:</strong> 250655<br>
              <strong style="color: #dc2626;">Reference:</strong> Please use your <strong style="color: #dc2626;">car registration</strong> as payment reference
            </div>
          </div>

          <div class="validity-box" style="background-color: #fef3c7; border-color: #fde68a;">
            <div class="validity-text" style="color: #92400e;"> Reminder: Immediate Payment Required</div>
            <div style="margin-top: 6px; font-size: 13px; color: #92400e;">Please ensure all outstanding amounts are paid promptly to avoid any service interruptions.</div>
          </div>

          <div style="text-align: center;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/requests/history" class="button">View Payment History</a>
          </div>
        </div>
        <div class="footer">
          <p><strong>Kapuka Tradings</strong> -- Weekly Statement</p>
          <p>This is an automated statement. Please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const itemCount = data.items.length;

  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || '"Kapuka" <noreply@kapuka.com>',
      to: data.driverEmail,
      subject: `Weekly Statement - ${formatMoney(data.totalOutstanding)} Outstanding - Kapuka Tradings`,
      html: html,
      text: `Weekly Statement\n\nDear ${data.driverName},\n\nTotal Outstanding: ${formatMoney(data.totalOutstanding)}\nItems: ${itemCount}\n\nBANKING DETAILS:\nBank: FNB/RMB\nAccount Holder: Japhet Sibuyi\nAccount Type: FNB Aspire Current Account\nAccount Number: 63131222307\nBranch Code: 250655\nReference: Use your car registration as payment reference\n\nRemember to do immediate payment.\n\nPlease log in to view details.\n\nKapuka Tradings`,
    });
    console.log("Weekly statement email sent:", info.messageId);
    return info;
  } catch (error) {
    console.error("Error sending weekly statement:", error);
    return null;
  }
}

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
          <h1>Loan Fully Paid! </h1>
          <p>Congratulations on completing your repayment</p>
        </div>
        <div class="content">
          <div style="text-align: center;">
            <span class="badge badge-approved"> FULLY PAID</span>
          </div>
          
          <div class="driver-highlight">
            <div class="driver-name">${data.driverName}</div>
            <div class="car-reg">${data.carRegistration}</div>
          </div>
          
          <div class="celebration-box">
            <div style="font-size: 48px; margin-bottom: 8px;"></div>
            <div style="font-weight: bold; font-size: 18px; color: #1a4d2a; margin-bottom: 8px;">Congratulations!</div>
            <div style="font-size: 14px; color: #2d6a4f;">Your ${data.serviceTypeLabel} loan has been fully paid off.</div>
          </div>
          
          <div class="amount-card">
            <div class="amount-label"> Total Amount Repaid</div>
            <div class="amount-value">${formatMoney(data.totalPaid)}</div>
            <div style="margin-top: 8px;">${data.serviceTypeLabel}</div>
          </div>
          
          <div class="card">
            <div class="card-title">Repayment Summary</div>
            <div class="info-row"><span class="label">Service Type:</span><span class="value">${data.serviceTypeLabel}</span></div>
            <div class="info-row"><span class="label">Completed Date:</span><span class="value">${formatDate(data.completedDate)}</span></div>
            <div class="info-row"><span class="label">Status:</span><span class="value" style="color: #25a73d; font-weight: bold;">Fully Paid</span></div>
          </div>
          
          <div class="info-highlight">
            <div style="font-weight: bold; margin-bottom: 8px;"> What's Next?</div>
            <div style="font-size: 13px;">
              Thank you for being a responsible Kapuka customer! You can now request new services.
            </div>
          </div>
          
          <div style="text-align: center;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/requests/new" class="button">Request New Service</a>
          </div>
        </div>
        <div class="footer">
          <p>Kapuka Tradings - Automated Notification</p>
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
      subject: ` ${data.serviceTypeLabel} Fully Paid - Kapuka`,
      html: html,
      text: `Congratulations! Your ${data.serviceTypeLabel} has been fully paid off. Total paid: ${formatMoney(data.totalPaid)}`,
    });
    console.log("Repayment completed email sent:", info.messageId);
    return info;
  } catch (error) {
    console.error("Error sending repayment completed email:", error);
    return null;
  }
}

// ==================== PASSWORD RESET EMAIL ====================

const generatePasswordResetHtml = (data: {
  driverName: string;
  resetUrl: string;
}): string => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reset Your Password - Kapuka</title>
      <style>${globalStyles}</style>
    </head>
    <body>
      <div class="container">
        <div class="header" style="background: linear-gradient(135deg, #0d4a2a 0%, #1a6b3e 50%, #0d4a2a 100%);">
          <div style="font-size: 48px; margin-bottom: 12px;"></div>
          <h1>Reset Your Password</h1>
          <p>You requested a password reset</p>
        </div>
        <div class="content">
          <p style="font-size: 16px; margin: 0 0 20px; color: #0f172a; line-height: 1.6;">Hello ${data.driverName},</p>
          <p style="margin: 0 0 24px; color: #475569; line-height: 1.6; font-size: 15px;">
            We received a request to reset your password. Click the button below to set a new password. 
            This link will expire in <strong>1 hour</strong>.
          </p>

          <div style="text-align: center;">
            <a href="${data.resetUrl}" class="button" style="font-size: 16px; padding: 16px 40px;">Reset Password</a>
          </div>

          <p style="margin: 32px 0 0; color: #64748b; font-size: 13px; line-height: 1.6;">
            If you didn't request a password reset, please ignore this email. No changes have been made to your account.
          </p>

          <div style="border-left: 4px solid #bff202; padding: 16px 20px; margin: 24px 0; background-color: #f8fafc; border-radius: 0 12px 12px 0;">
            <p style="margin: 0; font-size: 13px; color: #64748b; word-break: break-all;">
              If the button doesn't work, copy and paste this link into your browser:<br>
              <a href="${data.resetUrl}" style="color: #16a34a; text-decoration: underline;">${data.resetUrl}</a>
            </p>
          </div>
        </div>
        <div class="footer">
          <p>Kapuka Tradings - Automated Notification</p>
          <p>This is an automated message, please do not reply.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

export async function sendPasswordResetEmail(data: {
  email: string;
  name: string;
  resetUrl: string;
}) {
  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || '"Kapuka" <noreply@kapuka.com>',
      to: data.email,
      subject: "Reset Your Password - Kapuka Tradings",
      html: generatePasswordResetHtml({
        driverName: data.name,
        resetUrl: data.resetUrl,
      }),
      text: `Reset your password\n\nHello ${data.name},\n\nClick the link below to reset your password. It expires in 1 hour.\n\n${data.resetUrl}\n\nIf you didn't request this, ignore this email.\n\nKapuka Tradings`,
    });
    console.log("Password reset email sent:", info.messageId);
    return info;
  } catch (error) {
    console.error("Error sending password reset email:", error);
    return null;
  }
}

// ==================== PROFILE CHANGE NOTIFICATION ====================

const generateProfileChangeAdminHtml = (data: {
  driverName: string;
  driverEmail: string;
  changes: { field: string; newValue: string }[];
}): string => {
  const changesRows = data.changes
    .map(
      (change) => `
    <div class="info-row">
      <span class="label">${change.field}:</span>
      <span class="value">${change.newValue || "N/A"}</span>
    </div>`,
    )
    .join("");

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Profile Update Notification</title>
      <style>${globalStyles}</style>
    </head>
    <body>
      <div class="container">
        <div class="header" style="background-color: #1a4d2a;">
          <h1>Kapuka Tradings</h1>
          <p>Driver Profile Updated</p>
        </div>
        <div class="content">
          <div style="text-align: center;">
            <span class="badge badge-pending">PROFILE UPDATE</span>
          </div>

          <div class="driver-highlight">
            <div class="driver-name">${data.driverName}</div>
            <div class="info-row" style="margin-top: 12px;"><span class="label"> Email:</span><span class="value">${data.driverEmail}</span></div>
          </div>

          <div class="card">
            <div class="card-title">Updated Information</div>
            ${changesRows}
          </div>

          <div style="text-align: center;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/dashboard" class="button">Go to Admin Dashboard</a>
          </div>
        </div>
        <div class="footer">
          <p>Kapuka Tradings - Automated Notification</p>
          <p>This is an automated message, please do not reply.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

export async function sendAdminProfileChangeEmail(data: {
  driverName: string;
  driverEmail: string;
  changes: { field: string; newValue: string }[];
}) {
  const adminEmails = getAdminEmails();

  const fieldList = data.changes.map((c) => c.field).join(", ");
  const changesText = data.changes
    .map((c) => `${c.field}: ${c.newValue}`)
    .join("\n");

  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || '"Kapuka" <noreply@kapuka.com>',
      to: adminEmails,
      subject: `Driver Profile Updated - ${data.driverName} (${fieldList})`,
      html: generateProfileChangeAdminHtml(data),
      text: `Driver ${data.driverName} (${data.driverEmail}) updated their profile:\n\n${changesText}`,
    });
    console.log("Profile change notification sent to:", adminEmails.join(", "));
    console.log("Email ID:", info.messageId);
    return info;
  } catch (error) {
    console.error("Error sending profile change email:", error);
    return null;
  }
}


