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
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f0f2f5; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        .header { background-color: #1a4d2a; padding: 30px 20px; text-align: center; }
        .header h1 { color: #ffffff; margin: 0; font-size: 24px; font-weight: bold; }
        .header p { color: #c8e6b5; margin: 8px 0 0; font-size: 14px; }
        .content { padding: 30px; }
        .badge { display: inline-block; background-color: #ea8c2b; color: #ffffff; padding: 6px 14px; border-radius: 20px; font-size: 12px; font-weight: 600; margin-bottom: 24px; }
        .card { background-color: #f8f9fa; border-radius: 12px; padding: 20px; margin-bottom: 20px; border: 1px solid #e9ecef; }
        .card-title { color: #1a4d2a; font-size: 16px; font-weight: bold; margin: 0 0 16px 0; padding-bottom: 12px; border-bottom: 2px solid #c8e6b5; }
        .info-row { display: flex; justify-content: space-between; padding: 10px 0; font-size: 14px; border-bottom: 1px solid #e9ecef; }
        .info-row:last-child { border-bottom: none; }
        .label { color: #6c757d; font-weight: 500; }
        .value { color: #212529; font-weight: 600; }
        .amount-value { font-size: 20px; color: #2d6a4f; font-weight: bold; }
        .button { display: inline-block; background-color: #2d6a4f; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 600; margin-top: 20px; text-align: center; }
        .footer { background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #6c757d; border-top: 1px solid #e9ecef; }
        .time-badge { background-color: #e8f5e9; color: #2d6a4f; padding: 4px 12px; border-radius: 16px; font-size: 12px; font-weight: 500; display: inline-block; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Kapuka Services</h1>
          <p>New Service Request Received</p>
        </div>
        <div class="content">
          <div style="text-align: center;">
            <span class="badge">PENDING APPROVAL</span>
          </div>
          
          <div class="card">
            <div class="card-title">Driver Information</div>
            <div class="info-row"><span class="label">Full Name:</span><span class="value">${data.driverName}</span></div>
            <div class="info-row"><span class="label">Email Address:</span><span class="value">${data.driverEmail}</span></div>
            <div class="info-row"><span class="label">Phone Number:</span><span class="value">${data.driverPhone}</span></div>
            <div class="info-row"><span class="label">Car Registration:</span><span class="value">${data.carRegistration}</span></div>
            ${data.carModel ? `<div class="info-row"><span class="label">Car Model:</span><span class="value">${data.carModel}</span></div>` : ""}
          </div>
          
          <div class="card">
            <div class="card-title">Request Details</div>
            <div class="info-row"><span class="label">Service Type:</span><span class="value">${serviceTypeMap[data.serviceType] || data.serviceType}</span></div>
            <div class="info-row"><span class="label">Request ID:</span><span class="value">${data.requestId.slice(-8).toUpperCase()}</span></div>
            <div class="info-row"><span class="label">Request Amount:</span><span class="value amount-value">R ${data.amount.toLocaleString()}</span></div>
            ${data.phoneNumber ? `<div class="info-row"><span class="label">Contact Number:</span><span class="value">${data.phoneNumber}</span></div>` : ""}
            <div class="info-row"><span class="label">Request Date & Time:</span><span class="value">${formatDateTime(data.requestDate)}</span></div>
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
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f0f2f5; margin: 0; padding: 20px; }
        .container { max-width: 550px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        .header { background-color: #25a73d; padding: 30px 20px; text-align: center; }
        .header h1 { color: #ffffff; margin: 0; font-size: 24px; font-weight: bold; }
        .header p { color: #d4f5d4; margin: 8px 0 0; font-size: 14px; }
        .content { padding: 30px; }
        .success-badge { display: inline-block; background-color: #25a73d; color: #ffffff; padding: 6px 14px; border-radius: 20px; font-size: 12px; font-weight: 600; margin-bottom: 24px; }
        .card { background-color: #f8f9fa; border-radius: 12px; padding: 20px; margin-bottom: 20px; border: 1px solid #e9ecef; }
        .card-title { color: #1a4d2a; font-size: 16px; font-weight: bold; margin: 0 0 16px 0; padding-bottom: 12px; border-bottom: 2px solid #c8e6b5; }
        .info-row { display: flex; justify-content: space-between; padding: 10px 0; font-size: 14px; border-bottom: 1px solid #e9ecef; }
        .info-row:last-child { border-bottom: none; }
        .label { color: #6c757d; font-weight: 500; }
        .value { color: #212529; font-weight: 600; }
        .otp-card { background: linear-gradient(135deg, #f59e0b 0%, #ea580c 100%); border-radius: 16px; padding: 24px; text-align: center; margin: 20px 0; }
        .otp-label { color: #ffffff; font-size: 14px; font-weight: 600; margin: 0 0 12px 0; letter-spacing: 1px; }
        .otp-code { background-color: #ffffff; border-radius: 12px; padding: 16px; font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #1a4d2a; font-family: 'Courier New', monospace; }
        .otp-note { color: #ffffff; font-size: 12px; margin: 12px 0 0 0; opacity: 0.9; }
        .amount-value { font-size: 20px; color: #2d6a4f; font-weight: bold; }
        .validity-box { background-color: #fef3c7; border-left: 4px solid #ea8c2b; padding: 12px 16px; border-radius: 8px; margin: 16px 0; }
        .validity-text { color: #92400e; font-size: 14px; font-weight: 600; margin: 0; }
        .validity-highlight { background-color: #ea8c2b; color: #ffffff; padding: 4px 10px; border-radius: 20px; font-size: 13px; font-weight: bold; display: inline-block; margin-top: 8px; }
        .button { display: inline-block; background-color: #2d6a4f; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 600; margin-top: 20px; text-align: center; }
        .footer { background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #6c757d; border-top: 1px solid #e9ecef; }
        .warning-text { color: #b91c1c; font-weight: bold; }
        .time-badge { background-color: #ea8c2b; color: white; padding: 4px 12px; border-radius: 20px; font-size: 13px; font-weight: bold; display: inline-block; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Request Approved</h1>
          <p>Your service request has been approved</p>
        </div>
        <div class="content">
          <div style="text-align: center;">
            <span class="success-badge">APPROVED</span>
          </div>
          
          <div class="card">
            <div class="card-title">Request Information</div>
            <div class="info-row"><span class="label">Service Type:</span><span class="value">${serviceTypeMap[data.serviceType] || data.serviceType}</span></div>
            <div class="info-row"><span class="label">Request ID:</span><span class="value">${data.requestId.slice(-8).toUpperCase()}</span></div>
            <div class="info-row"><span class="label">Amount:</span><span class="value amount-value">R ${data.amount.toLocaleString()}</span></div>
          </div>
          
          <div class="otp-card">
            <div class="otp-label">YOUR ONE-TIME PASSWORD (OTP)</div>
            <div class="otp-code">${data.otp}</div>
            <div class="otp-note">Please present this code at the service center</div>
          </div>
          
          <div class="validity-box">
            <div class="validity-text">IMPORTANT: OTP Validity Information</div>
            <div style="margin-top: 8px;">
              <span class="time-badge">Valid for 1 hour only</span>
            </div>
            <div style="margin-top: 8px; font-size: 13px; color: #92400e;">
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
}) {
  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || '"Kapuka" <noreply@kapuka.com>',
      to: data.driverEmail,
      subject: `Service Request Approved - ${data.requestId.slice(-8).toUpperCase()}`,
      html: generateDriverApprovalHtml(data),
      text: `Your request for R${data.amount} has been approved. OTP: ${data.otp}`,
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
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f0f2f5; margin: 0; padding: 20px; }
        .container { max-width: 550px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        .header { background-color: #b91c1c; padding: 30px 20px; text-align: center; }
        .header h1 { color: #ffffff; margin: 0; font-size: 24px; font-weight: bold; }
        .header p { color: #fecaca; margin: 8px 0 0; font-size: 14px; }
        .content { padding: 30px; }
        .reject-badge { display: inline-block; background-color: #b91c1c; color: #ffffff; padding: 6px 14px; border-radius: 20px; font-size: 12px; font-weight: 600; margin-bottom: 24px; }
        .card { background-color: #f8f9fa; border-radius: 12px; padding: 20px; margin-bottom: 20px; border: 1px solid #e9ecef; }
        .card-title { color: #1a4d2a; font-size: 16px; font-weight: bold; margin: 0 0 16px 0; padding-bottom: 12px; border-bottom: 2px solid #e9ecef; }
        .info-row { display: flex; justify-content: space-between; padding: 10px 0; font-size: 14px; border-bottom: 1px solid #e9ecef; }
        .info-row:last-child { border-bottom: none; }
        .label { color: #6c757d; font-weight: 500; }
        .value { color: #212529; font-weight: 600; }
        .reason-box { background-color: #fef2f2; border-left: 4px solid #b91c1c; padding: 16px; border-radius: 8px; margin: 16px 0; }
        .reason-text { color: #991b1b; font-size: 14px; margin: 0; }
        .button { display: inline-block; background-color: #2d6a4f; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 600; margin: 10px 5px; text-align: center; }
        .button-secondary { display: inline-block; background-color: #6c757d; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 600; margin: 10px 5px; text-align: center; }
        .footer { background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #6c757d; border-top: 1px solid #e9ecef; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Request Rejected</h1>
          <p>We regret to inform you</p>
        </div>
        <div class="content">
          <div style="text-align: center;">
            <span class="reject-badge">REJECTED</span>
          </div>
          
          <div class="card">
            <div class="card-title">Request Information</div>
            <div class="info-row"><span class="label">Service Type:</span><span class="value">${serviceTypeMap[data.serviceType] || data.serviceType}</span></div>
            <div class="info-row"><span class="label">Request ID:</span><span class="value">${data.requestId.slice(-8).toUpperCase()}</span></div>
            <div class="info-row"><span class="label">Amount:</span><span class="value">R ${data.amount.toLocaleString()}</span></div>
          </div>
          
          <div class="reason-box">
            <div class="label" style="margin-bottom: 8px;">Reason for Rejection:</div>
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
  requestId: string;
  serviceType: string;
  amount: number;
  reason: string;
}) {
  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || '"Kapuka" <noreply@kapuka.com>',
      to: data.driverEmail,
      subject: `Service Request Rejected - ${data.requestId.slice(-8).toUpperCase()}`,
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
        .button { display: inline-block; background-color: #2d6a4f; color: white; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 600; margin-top: 20px; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #6c757d; border-top: 1px solid #e9ecef; }
        .time-badge { background-color: #e8f5e9; color: #2d6a4f; padding: 4px 12px; border-radius: 16px; font-size: 12px; display: inline-block; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Kapuka Services</h1>
          <p>New Driver Verification Request</p>
        </div>
        <div class="content">
          <div style="text-align: center;">
            <span class="badge">PENDING REVIEW</span>
          </div>
          
          <div class="card">
            <div class="card-title">Driver Information</div>
            <div class="info-row"><span class="label">Driver Name:</span><span class="value">${data.driverName}</span></div>
            <div class="info-row"><span class="label">Email:</span><span class="value">${data.driverEmail}</span></div>
            <div class="info-row"><span class="label">Phone:</span><span class="value">${data.driverPhone}</span></div>
            <div class="info-row"><span class="label">Car Registration:</span><span class="value">${data.carRegistration}</span></div>
            <div class="info-row"><span class="label">Car Model:</span><span class="value">${data.carModel || "Not specified"}</span></div>
            <div class="info-row"><span class="label">Submitted:</span><span class="value">${formatDateTime(data.submissionDate)}</span></div>
          </div>
          
          <div class="card">
            <div class="card-title">Verification Status</div>
            <div class="info-row"><span class="label">Status:</span><span class="value">Pending Review</span></div>
            <div class="info-row"><span class="label">Verification ID:</span><span class="value">${data.verificationId.slice(-8).toUpperCase()}</span></div>
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
  } catch (error) {
    console.error("Error sending verification notification email:", error);
  }
}

// Driver Verification Result Email
export async function sendDriverVerificationResultEmail(data: {
  driverEmail: string;
  driverName: string;
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
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f0f2f5; margin: 0; padding: 20px; }
        .container { max-width: 500px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        .header { background: ${isApproved ? "#25a73d" : "#b91c1c"}; padding: 30px; text-align: center; }
        .header h1 { color: white; margin: 0; font-size: 24px; }
        .content { padding: 30px; }
        .badge { display: inline-block; background: ${isApproved ? "#25a73d" : "#b91c1c"}; color: white; padding: 6px 14px; border-radius: 20px; font-size: 12px; font-weight: 600; margin-bottom: 24px; }
        .card { background: #f8f9fa; border-radius: 12px; padding: 20px; margin-bottom: 20px; border: 1px solid #e9ecef; }
        .card-title { color: #1a4d2a; font-size: 16px; font-weight: bold; margin: 0 0 16px 0; padding-bottom: 12px; border-bottom: 2px solid #c8e6b5; }
        .reason-box { background-color: #fef2f2; border-left: 4px solid #b91c1c; padding: 16px; border-radius: 8px; margin: 16px 0; }
        .reason-text { color: #991b1b; font-size: 14px; margin: 0; }
        .button { display: inline-block; background-color: #2d6a4f; color: white; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 600; margin-top: 20px; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #6c757d; border-top: 1px solid #e9ecef; }
        .success-list { margin: 16px 0 0 20px; color: #212529; font-size: 14px; }
        .success-list li { margin: 8px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${isApproved ? "Verification Approved" : "Verification Rejected"}</h1>
        </div>
        <div class="content">
          <div style="text-align: center;">
            <span class="badge">${isApproved ? "APPROVED" : "REJECTED"}</span>
          </div>
          
          <p style="font-size: 16px; margin-bottom: 20px;">Hello ${data.driverName},</p>
          
          ${
            isApproved
              ? `
            <div class="card">
              <div class="card-title">Congratulations!</div>
              <p style="margin: 0 0 16px 0; font-size: 14px;">Your driver verification has been <strong>APPROVED</strong>. You can now access all Kapuka services.</p>
              <div style="font-weight: bold; margin-bottom: 8px;">What you can do now:</div>
              <ul class="success-list">
                <li>Request fuel, airtime, cash loans, and car wash services</li>
                <li>Track your request history</li>
                <li>Access all Kapuka features</li>
              </ul>
            </div>
          `
              : `
            <div class="card">
              <div class="card-title">Application Status</div>
              <p style="margin: 0 0 16px 0; font-size: 14px;">We regret to inform you that your driver verification has been <strong>REJECTED</strong>.</p>
              ${
                data.reason
                  ? `
                <div class="reason-box">
                  <div style="font-weight: bold; margin-bottom: 8px;">Reason for rejection:</div>
                  <div class="reason-text">${data.reason}</div>
                </div>
              `
                  : ""
              }
              <p style="margin: 16px 0 0 0; font-size: 14px;">Please re-submit your verification with correct information to continue using Kapuka services.</p>
            </div>
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
        ? `Driver Verification Approved - Kapuka`
        : `Driver Verification Rejected - Kapuka`,
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
        .amount-remaining { font-size: 18px; color: #b91c1c; font-weight: bold; }
        .proof-box { background: white; border: 2px solid #c8e6b5; border-radius: 12px; padding: 16px; text-align: center; margin: 16px 0; }
        .button { display: inline-block; background-color: #2d6a4f; color: white; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 600; margin-top: 20px; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #6c757d; border-top: 1px solid #e9ecef; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Kapuka Services</h1>
          <p>New Repayment Proof Submitted</p>
        </div>
        <div class="content">
          <div style="text-align: center;">
            <span class="badge">PENDING REVIEW</span>
          </div>
          
          <div class="card">
            <div class="card-title">Driver Information</div>
            <div class="info-row"><span class="label">Driver Name:</span><span class="value">${data.driverName}</span></div>
            <div class="info-row"><span class="label">Email:</span><span class="value">${data.driverEmail}</span></div>
            <div class="info-row"><span class="label">Phone:</span><span class="value">${data.driverPhone}</span></div>
            <div class="info-row"><span class="label">Car Registration:</span><span class="value">${data.carRegistration}</span></div>
          </div>
          
          <div class="card">
            <div class="card-title">Payment Details</div>
            <div class="info-row"><span class="label">Service Type:</span><span class="value">${data.serviceTypeLabel}</span></div>
            <div class="info-row"><span class="label">Payment Amount:</span><span class="value amount-value">R ${data.amount.toLocaleString()}</span></div>
            <div class="info-row"><span class="label">Remaining Balance:</span><span class="value amount-remaining">R ${data.remainingBalance.toLocaleString()}</span></div>
            <div class="info-row"><span class="label">Submitted:</span><span class="value">${formatDateTime(data.submittedAt)}</span></div>
            <div class="info-row"><span class="label">Repayment ID:</span><span class="value">${data.repaymentId.slice(-8).toUpperCase()}</span></div>
          </div>
          
          <div class="proof-box">
            <div style="font-weight: bold; margin-bottom: 12px; color: #1a4d2a;">Proof of Payment</div>
            <a href="${data.proofUrl}" target="_blank" style="color: #2d6a4f; text-decoration: underline;">View Payment Proof Document</a>
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
      <title>Repayment Approved</title>
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
        .remaining-value { font-size: 18px; color: ${data.remainingBalance > 0 ? "#b91c1c" : "#2d6a4f"}; font-weight: bold; }
        .celebration-box { background: #e8f5e9; border-radius: 12px; padding: 16px; text-align: center; margin: 20px 0; }
        .warning-box { background: #fef3c7; border-radius: 12px; padding: 16px; text-align: center; margin: 20px 0; }
        .button { display: inline-block; background-color: #2d6a4f; color: white; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 600; margin-top: 20px; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #6c757d; border-top: 1px solid #e9ecef; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${data.isFullyPaid ? "Repayment Completed" : "Repayment Approved"}</h1>
        </div>
        <div class="content">
          <div style="text-align: center;">
            <span class="success-badge">${data.isFullyPaid ? "FULLY PAID" : "APPROVED"}</span>
          </div>
          
          <p style="font-size: 16px; margin-bottom: 20px;">Hello ${data.driverName},</p>
          <p style="margin-bottom: 20px;">Your repayment of <strong>R ${data.amount.toLocaleString()}</strong> for your ${data.serviceTypeLabel} has been <strong>${data.isFullyPaid ? "processed and completed" : "approved"}</strong>.</p>
          
          <div class="amount-box">
            <div style="margin-bottom: 8px; font-weight: bold; color: #1a4d2a;">Payment Details</div>
            <div class="amount-value">R ${data.amount.toLocaleString()}</div>
            <div style="margin-top: 8px;">${data.serviceTypeLabel} • ${data.carRegistration}</div>
          </div>
          
          ${
            data.isFullyPaid
              ? `
            <div class="celebration-box">
              <div style="font-weight: bold; margin-bottom: 8px; color: #1a4d2a;">Congratulations!</div>
              <div>Your ${data.serviceTypeLabel} is now fully paid off.</div>
            </div>
          `
              : `
            <div class="warning-box">
              <div style="margin-bottom: 8px; font-weight: bold; color: #92400e;">Remaining Balance</div>
              <div class="remaining-value">R ${data.remainingBalance.toLocaleString()}</div>
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
        ? `${data.serviceTypeLabel} Fully Paid - Kapuka`
        : `Repayment of R${data.amount.toLocaleString()} Approved - Kapuka`,
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
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f0f2f5; margin: 0; padding: 20px; }
        .container { max-width: 550px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        .header { background: #b91c1c; padding: 30px; text-align: center; }
        .header h1 { color: white; margin: 0; font-size: 24px; }
        .content { padding: 30px; }
        .reject-badge { display: inline-block; background: #b91c1c; color: white; padding: 6px 14px; border-radius: 20px; font-size: 12px; font-weight: 600; margin-bottom: 24px; }
        .card { background: #f8f9fa; border-radius: 12px; padding: 20px; margin-bottom: 20px; border: 1px solid #e9ecef; }
        .card-title { color: #1a4d2a; font-size: 16px; font-weight: bold; margin: 0 0 16px 0; padding-bottom: 12px; border-bottom: 2px solid #c8e6b5; }
        .info-row { display: flex; justify-content: space-between; padding: 10px 0; font-size: 14px; border-bottom: 1px solid #e9ecef; }
        .info-row:last-child { border-bottom: none; }
        .label { color: #6c757d; font-weight: 500; }
        .value { color: #212529; font-weight: 600; }
        .reason-box { background: #fef2f2; border-left: 4px solid #b91c1c; padding: 16px; border-radius: 8px; margin: 16px 0; }
        .reason-text { color: #991b1b; font-size: 14px; margin: 0; }
        .amount-box { background: #e8f5e9; border-radius: 12px; padding: 16px; text-align: center; margin: 16px 0; }
        .button { display: inline-block; background-color: #b91c1c; color: white; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 600; margin-top: 20px; }
        .button-secondary { display: inline-block; background-color: #2d6a4f; color: white; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 600; margin: 10px 5px; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #6c757d; border-top: 1px solid #e9ecef; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Repayment Proof Rejected</h1>
        </div>
        <div class="content">
          <div style="text-align: center;">
            <span class="reject-badge">REJECTED</span>
          </div>
          
          <p style="font-size: 16px; margin-bottom: 20px;">Hello ${data.driverName},</p>
          <p style="margin-bottom: 20px;">We regret to inform you that your repayment proof of <strong>R ${data.amount.toLocaleString()}</strong> for your ${data.serviceTypeLabel} has been <strong>REJECTED</strong>.</p>
          
          <div class="reason-box">
            <div style="font-weight: bold; margin-bottom: 8px;">Reason for rejection:</div>
            <div class="reason-text">${data.reason}</div>
          </div>
          
          <div class="amount-box">
            <div>${data.serviceTypeLabel} • ${data.carRegistration}</div>
            <div style="font-weight: bold; margin-top: 8px;">Amount: R ${data.amount.toLocaleString()}</div>
          </div>
          
          <p>Please submit a new repayment proof with correct documentation.</p>
          
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
      subject: `Repayment Proof Rejected - Kapuka`,
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

// Repayment Completed Email
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
      <title>Repayment Completed</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f0f2f5; margin: 0; padding: 20px; }
        .container { max-width: 550px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        .header { background: #25a73d; padding: 30px; text-align: center; }
        .header h1 { color: white; margin: 0; font-size: 24px; }
        .content { padding: 30px; }
        .completed-badge { display: inline-block; background: #25a73d; color: white; padding: 6px 14px; border-radius: 20px; font-size: 12px; font-weight: 600; margin-bottom: 24px; }
        .celebration-box { background: linear-gradient(135deg, #e8f5e9 0%, #c8e6b5 100%); border-radius: 16px; padding: 24px; text-align: center; margin: 20px 0; }
        .total-value { font-size: 36px; font-weight: bold; color: #1a4d2a; }
        .button { display: inline-block; background-color: #2d6a4f; color: white; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 600; margin-top: 20px; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #6c757d; border-top: 1px solid #e9ecef; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Repayment Completed</h1>
        </div>
        <div class="content">
          <div style="text-align: center;">
            <span class="completed-badge">FULLY PAID</span>
          </div>
          
          <p style="font-size: 16px; margin-bottom: 20px;">Hello ${data.driverName},</p>
          <p style="margin-bottom: 20px;">Congratulations! Your <strong>${data.serviceTypeLabel}</strong> has been fully repaid and marked as <strong>COMPLETED</strong>.</p>
          
          <div class="celebration-box">
            <div style="margin-bottom: 12px; font-weight: bold; color: #1a4d2a;">Total Repaid</div>
            <div class="total-value">R ${data.totalPaid.toLocaleString()}</div>
            <div style="margin-top: 12px;">${data.serviceTypeLabel} • ${data.carRegistration}</div>
            <div style="margin-top: 8px; font-size: 12px;">Completed on ${formatDate(data.completedDate)}</div>
          </div>
          
          <p>Thank you for being a responsible Kapuka customer. You can now request new services.</p>
          
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
      subject: `${data.serviceTypeLabel} Fully Paid - Kapuka`,
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
