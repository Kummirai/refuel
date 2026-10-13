// src/app/api/admin/settings/route.ts
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";

// Default settings
const DEFAULT_SETTINGS = {
  general: {
    siteName: "Kapuka",
    siteDescription: "Driver Services Platform",
    contactEmail: "support@Kapuka.com",
    contactPhone: "+91 98765 43210",
    holdRegistration: false,
    adminPhoneNumbers: "+91 98765 43210, +91 98765 43211",
    address: "123, Tech Park, Bangalore - 560001",
    timezone: "Asia/Kolkata",
    currency: "INR",
    dateFormat: "DD/MM/YYYY",
  },
  services: {
    fuelEnabled: true,
    airtimeEnabled: true,
    cashLoanEnabled: true,
    carWashEnabled: true,
    fuelInterestRate: 13,
    airtimeInterestRate: 13,
    cashInterestRate: 13,
    carwashInterestRate: 13,
    minLoanAmount: 1000,
    maxLoanAmount: 50000,
    repaymentPeriods: [7, 14, 21, 30],
    defaultRepaymentPeriod: 7,
    lateFeePercentage: 2,
    airtimeNetworks: ["Jio", "Airtel", "VI", "BSNL"],
    fuelTypes: ["Petrol", "Diesel"],
  },
  notifications: {
    emailNotifications: true,
    whatsappNotifications: true,
    smsNotifications: false,
    adminEmail: "admin@Kapuka.com",
    adminPhone: "+91 98765 43210",
    whatsappBusinessNumber: "+91 98765 43210",
    notifyOnNewVerification: true,
    notifyOnNewRequest: true,
    notifyOnRequestApproval: true,
    notifyOnLoanDue: true,
  },
  security: {
    twoFactorAuth: false,
    sessionTimeout: 480,
    maxLoginAttempts: 5,
    lockoutDuration: 15,
    passwordExpiry: 90,
    allowMultipleSessions: false,
    ipWhitelisting: false,
    ipWhitelist: "",
  },
  business: {
    businessName: "Kapuka Tradings Pvt Ltd",
    businessEmail: "business@kapuka.com",
    businessPhone: "+27 782 677 436",
    gstNumber: "29ABCDE1234F1Z5",
    panNumber: "ABCDE1234F",
    bankName: "HDFC Bank",
    accountNumber: "XXXX1234",
    ifscCode: "HDFC0001234",
    upiId: "Kapuka@hdfcbank",
    termsAndConditions: "https://Kapuka.com/terms",
    privacyPolicy: "https://Kapuka.com/privacy",
  },
  fuelCredit: {
    defaultLimit: 2500,
    enabled: true,
  },
};

export async function GET() {
  try {
    const { db } = await connectToDatabase();
    const settingsCollection = db.collection("settings");

    // Try to find existing settings
    let settings = await settingsCollection.findOne({ type: "app_settings" });

    if (!settings) {
      // Create default settings if not exists
      await settingsCollection.insertOne({
        type: "app_settings",
        ...DEFAULT_SETTINGS,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      settings = { ...DEFAULT_SETTINGS };
    }

    // Remove MongoDB specific fields
    const { _id, type, createdAt, updatedAt, ...settingsData } = settings;

    return NextResponse.json(settingsData || DEFAULT_SETTINGS, {
      headers: { "Cache-Control": "no-cache, no-store, must-revalidate" },
    });
  } catch (error) {
    console.error("Error fetching settings:", error);
    return NextResponse.json(DEFAULT_SETTINGS, {
      headers: { "Cache-Control": "no-cache, no-store, must-revalidate" },
    });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { general, services, notifications, security, business, managerCycle, fuelCredit } = body;

    const { db } = await connectToDatabase();
    const settingsCollection = db.collection("settings");

    const $set: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    // Only set fields that were actually provided in the request body
    if ('general' in body) $set.general = general;
    if ('services' in body) $set.services = services;
    if ('notifications' in body) $set.notifications = notifications;
    if ('security' in body) $set.security = security;
    if ('business' in body) $set.business = business;
    if ('managerCycle' in body) {
      $set.managerCycle = managerCycle === undefined ? null : managerCycle;
    }
    if ('fuelCredit' in body) {
      $set.fuelCredit = {
        defaultLimit:
          typeof fuelCredit?.defaultLimit === "number" && fuelCredit.defaultLimit >= 0
            ? fuelCredit.defaultLimit
            : 2500,
        enabled: fuelCredit?.enabled !== false,
      };
    }

    // Update settings
    await settingsCollection.updateOne(
      { type: "app_settings" },
      {
        $set,
        $setOnInsert: {
          type: "app_settings",
          createdAt: new Date(),
        },
      },
      { upsert: true },
    );

    return NextResponse.json({
      success: true,
      message: "Settings saved successfully",
    });
  } catch (error) {
    console.error("Error saving settings:", error);
    return NextResponse.json(
      { error: "Failed to save settings" },
      { status: 500 },
    );
  }
}
