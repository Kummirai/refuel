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
      `⚠️ Warning: ${envVar} environment variable is not set. Email sending will fail.`,
    );
  }
}

// Configure email transporter for Brevo
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || "smtp-relay.brevo.com",
  port: parseInt(process.env.EMAIL_PORT || "587"),
  secure: process.env.EMAIL_SECURE === "true",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
  // Brevo specific optimizations
  tls: {
    rejectUnauthorized: false,
  },
  connectionTimeout: 10000,
  socketTimeout: 10000,
  pool: true, // Use connection pooling for better performance
  maxConnections: 5,
  rateDelta: 1000,
  rateLimit: 10,
});

// Verify transporter connection (only in development)
if (process.env.NODE_ENV === "development") {
  transporter.verify((error, success) => {
    if (error) {
      console.error("❌ Email transporter error:", error);
      console.error("Please check your Brevo credentials in .env.local");
    } else {
      console.log("✅ Email server is ready to send messages");
      console.log(`📧 Using Brevo SMTP: ${process.env.EMAIL_HOST}`);
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

// Generate HTML email template for admin
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
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #eafde7; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1); }
        .header { background: linear-gradient(135deg, #01312D 0%, #3A7717 100%); padding: 30px 20px; text-align: center; }
        .header h1 { color: #ffffff; margin: 0; font-size: 28px; font-weight: bold; }
        .header p { color: #bff202; margin: 10px 0 0; font-size: 14px; }
        .content { padding: 30px; }
        .badge { display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #ea580c 100%); color: white; padding: 5px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; margin-bottom: 20px; }
        .section { background-color: #eafde7; border-radius: 12px; padding: 15px; margin-bottom: 20px; }
        .section h3 { color: #01312D; font-size: 16px; font-weight: bold; margin: 0 0 15px 0; padding-bottom: 10px; border-bottom: 2px solid #bff202; }
        .row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 14px; border-bottom: 1px solid #bff20240; }
        .row:last-child { border-bottom: none; }
        .label { color: #666; font-weight: 500; }
        .value { color: #01312D; font-weight: 600; }
        .amount { font-size: 18px; color: #3A7717; font-weight: bold; }
        .button { display: inline-block; background: linear-gradient(135deg, #3A7717 0%, #72bf00 100%); color: white; text-decoration: none; padding: 12px 24px; border-radius: 12px; font-weight: 600; margin-top: 20px; }
        .footer { background-color: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #999; }
        .status-pending { background-color: #fef3c7; color: #92400e; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 600; display: inline-block; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🚗 DriveHub</h1>
          <p>New Service Request Received</p>
        </div>
        <div class="content">
          <div style="text-align: center;">
            <span class="badge">🆕 PENDING APPROVAL</span>
          </div>
          <div class="section">
            <h3>👤 Driver Information</h3>
            <div class="row"><span class="label">Driver Name:</span><span class="value">${data.driverName}</span></div>
            <div class="row"><span class="label">Email:</span><span class="value">${data.driverEmail}</span></div>
            <div class="row"><span class="label">Phone:</span><span class="value">${data.driverPhone}</span></div>
            <div class="row"><span class="label">Car Registration:</span><span class="value">${data.carRegistration}</span></div>
            ${data.carModel ? `<div class="row"><span class="label">Car Model:</span><span class="value">${data.carModel}</span></div>` : ""}
          </div>
          <div class="section">
            <h3>📋 Request Details</h3>
            <div class="row"><span class="label">Service Type:</span><span class="value">${serviceTypeMap[data.serviceType] || data.serviceType}</span></div>
            <div class="row"><span class="label">Request ID:</span><span class="value">${data.requestId.slice(-6).toUpperCase()}</span></div>
            <div class="row"><span class="label">Amount:</span><span class="value amount">₹${data.amount.toLocaleString()}</span></div>
            ${data.phoneNumber ? `<div class="row"><span class="label">Contact Number:</span><span class="value">${data.phoneNumber}</span></div>` : ""}
            <div class="row"><span class="label">Request Date:</span><span class="value">${new Date(data.requestDate).toLocaleString()}</span></div>
          </div>
          <div style="text-align: center;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/service-requests" class="button">📋 Go to Admin Dashboard</a>
          </div>
        </div>
        <div class="footer">
          <p>DriveHub Services • This is an automated notification</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

export async function sendAdminNotificationEmail(
  data: ServiceRequestEmailData,
) {
  const adminEmail = process.env.ADMIN_EMAIL || "admin@drivehub.com";

  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || '"DriveHub" <noreply@drivehub.com>',
      to: adminEmail,
      subject: `🔔 New Service Request: ${data.requestId.slice(-6).toUpperCase()}`,
      html: generateAdminEmailHtml(data),
      text: `New service request from ${data.driverName} for ₹${data.amount}`,
    });

    console.log("✅ Admin notification email sent:", info.messageId);
    return info;
  } catch (error) {
    console.error("❌ Error sending admin notification email:", error);
    // Don't throw - email failure shouldn't block the request
    return null;
  }
}

// Generate driver approval email
const generateDriverApprovalHtml = (data: {
  driverName: string;
  requestId: string;
  serviceType: string;
  amount: number;
  otp: string;
}) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Your Service Request is Approved!</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #eafde7; margin: 0; padding: 20px; }
        .container { max-width: 500px; margin: 0 auto; background: white; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #25D366 0%, #128C7E 100%); padding: 30px; text-align: center; }
        .header h1 { color: white; margin: 0; }
        .content { padding: 30px; }
        .otp { background: linear-gradient(135deg, #f59e0b 0%, #ea580c 100%); border-radius: 12px; padding: 20px; text-align: center; margin: 20px 0; }
        .otp-code { background: white; border-radius: 10px; padding: 15px; font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #01312D; font-family: monospace; }
        .button { background: #3A7717; color: white; text-decoration: none; padding: 12px 24px; border-radius: 12px; display: inline-block; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header"><h1>🎉 Request Approved!</h1></div>
        <div class="content">
          <p>Hello ${data.driverName},</p>
          <p>Your service request has been <strong>APPROVED</strong>! ✅</p>
          <div class="otp">
            <p style="color: white;">Your OTP Code</p>
            <div class="otp-code">${data.otp}</div>
            <p style="color: white; font-size: 12px;">Show this code at the service center</p>
          </div>
          <p><strong>Request ID:</strong> ${data.requestId.slice(-6).toUpperCase()}</p>
          <p><strong>Service:</strong> ${data.serviceType}</p>
          <p><strong>Amount:</strong> ₹${data.amount.toLocaleString()}</p>
          <div style="text-align: center;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/requests/history" class="button">View My Requests</a>
          </div>
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
      from: process.env.EMAIL_FROM || '"DriveHub" <noreply@drivehub.com>',
      to: data.driverEmail,
      subject: `✅ Service Request Approved - ${data.requestId.slice(-6).toUpperCase()}`,
      html: generateDriverApprovalHtml(data),
      text: `Your request for ₹${data.amount} has been approved. OTP: ${data.otp}`,
    });

    console.log("✅ Driver approval email sent:", info.messageId);
    return info;
  } catch (error) {
    console.error("❌ Error sending driver approval email:", error);
    return null;
  }
}

// Add this function to your existing email.ts file

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
      from: process.env.EMAIL_FROM || '"DriveHub" <noreply@drivehub.com>',
      to: data.driverEmail,
      subject: `❌ Service Request Rejected - ${data.requestId.slice(-6).toUpperCase()}`,
      html: generateDriverRejectionHtml(data),
      text: `Your request for ₹${data.amount} has been rejected. Reason: ${data.reason}`,
    });

    console.log("✅ Driver rejection email sent:", info.messageId);
    return info;
  } catch (error) {
    console.error("❌ Error sending driver rejection email:", error);
    return null;
  }
}

const generateDriverRejectionHtml = (data: {
  driverName: string;
  requestId: string;
  serviceType: string;
  amount: number;
  reason: string;
}) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Service Request Rejected</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #eafde7; margin: 0; padding: 20px; }
        .container { max-width: 500px; margin: 0 auto; background: white; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1); }
        .header { background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); padding: 30px; text-align: center; }
        .header h1 { color: white; margin: 0; }
        .content { padding: 30px; }
        .reason-box { background: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; border-radius: 12px; margin: 20px 0; }
        .button { background: #dc2626; color: white; text-decoration: none; padding: 12px 24px; border-radius: 12px; display: inline-block; }
        .button-secondary { background: #3A7717; color: white; text-decoration: none; padding: 12px 24px; border-radius: 12px; display: inline-block; margin-left: 10px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>❌ Request Rejected</h1>
        </div>
        <div class="content">
          <p>Hello ${data.driverName},</p>
          <p>We regret to inform you that your service request has been <strong>REJECTED</strong>.</p>
          
          <div class="reason-box">
            <p style="margin: 0 0 5px 0; font-weight: bold; color: #991b1b;">Reason for rejection:</p>
            <p style="margin: 0; color: #7f1d1d;">${data.reason}</p>
          </div>
          
          <p><strong>Request Details:</strong></p>
          <p>📋 Request ID: ${data.requestId.slice(-6).toUpperCase()}<br>
          🚗 Service: ${data.serviceType}<br>
          💰 Amount: ₹${data.amount.toLocaleString()}</p>
          
          <p>If you have any questions, please contact our support team.</p>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/requests/new" class="button-secondary">Submit New Request</a>
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/requests/history" class="button">View History</a>
          </div>
          
          <hr style="margin: 30px 0 20px; border: none; border-top: 1px solid #e5e7eb;">
          <p style="font-size: 12px; color: #6b7280; text-align: center;">DriveHub Services • This is an automated notification</p>
        </div>
      </div>
    </body>
    </html>
  `;
};
