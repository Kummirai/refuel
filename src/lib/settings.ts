// src/lib/settings.ts
import { connectToDatabase } from "./db";

export async function getSettings() {
  try {
    const { db } = await connectToDatabase();
    const settingsCollection = db.collection("settings");

    let settings = await settingsCollection.findOne({ type: "app_settings" });

    if (!settings) {
      // Return default settings if not found
      return {
        general: {
          siteName: "Kapuka",
          siteDescription: "Driver Services Platform",
          contactEmail: "support@Kapuka.com",
          contactPhone: "+91 98765 43210",
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
        fuelCredit: {
          defaultLimit: 2500,
          enabled: true,
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
          businessEmail: "business@Kapuka.com",
          businessPhone: "+91 98765 43210",
          gstNumber: "29ABCDE1234F1Z5",
          panNumber: "ABCDE1234F",
          bankName: "HDFC Bank",
          accountNumber: "XXXX1234",
          ifscCode: "HDFC0001234",
          upiId: "Kapuka@hdfcbank",
          termsAndConditions: "https://Kapuka.com/terms",
          privacyPolicy: "https://Kapuka.com/privacy",
        },
      };
    }

    return {
      general: settings.general,
      services: settings.services,
      notifications: settings.notifications,
      security: settings.security,
      business: settings.business,
      fuelCredit: settings.fuelCredit || { defaultLimit: 2500, enabled: true },
    };
  } catch (error) {
    console.error("Error getting settings:", error);
    return null;
  }
}

// Helper to get a specific service's interest rate
export async function getInterestRate(
  serviceType: "fuel" | "airtime" | "cash" | "carwash",
) {
  const settings = await getSettings();
  if (!settings) return 13; // Default 13%

  const rateMap = {
    fuel: settings.services.fuelInterestRate,
    airtime: settings.services.airtimeInterestRate,
    cash: settings.services.cashInterestRate,
    carwash: settings.services.carwashInterestRate,
  };

  return rateMap[serviceType] || 13;
}

// Helper to check if a service is enabled
export async function isServiceEnabled(
  serviceType: "fuel" | "airtime" | "cash" | "carwash",
) {
  const settings = await getSettings();
  if (!settings) return true;

  const enabledMap = {
    fuel: settings.services.fuelEnabled,
    airtime: settings.services.airtimeEnabled,
    cash: settings.services.cashLoanEnabled,
    carwash: settings.services.carWashEnabled,
  };

  return enabledMap[serviceType] || false;
}

// Helper to get loan limits
export async function getLoanLimits() {
  const settings = await getSettings();
  if (!settings) return { min: 1000, max: 50000 };

  return {
    min: settings.services.minLoanAmount,
    max: settings.services.maxLoanAmount,
  };
}
