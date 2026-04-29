// src/app/admin/settings/page.tsx - Fixed with all imports

"use client";

import { useState } from "react";
import {
  Settings,
  Bell,
  Shield,
  DollarSign,
  MessageCircle,
  Mail,
  Smartphone,
  Users,
  Car,
  Clock,
  Percent,
  Wallet,
  Globe,
  Database,
  Lock,
  Eye,
  EyeOff,
  Save,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle,
  HelpCircle,
  FileText,
  CreditCard,
  Building,
  MapPin,
  Phone,
  AtSign,
  Fuel, // Added Fuel import
} from "lucide-react";

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState<
    "general" | "services" | "notifications" | "security" | "business"
  >("general");
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  // General Settings
  const [generalSettings, setGeneralSettings] = useState({
    siteName: "DriveHub",
    siteDescription: "Driver Services Platform",
    contactEmail: "support@drivehub.com",
    contactPhone: "+91 98765 43210",
    address: "123, Tech Park, Bangalore - 560001",
    timezone: "Asia/Kolkata",
    currency: "INR",
    dateFormat: "DD/MM/YYYY",
  });

  // Service Settings
  const [serviceSettings, setServiceSettings] = useState({
    fuelEnabled: true,
    airtimeEnabled: true,
    cashLoanEnabled: true,
    carWashEnabled: true,
    loanInterestRate: 13,
    minLoanAmount: 1000,
    maxLoanAmount: 50000,
    repaymentPeriods: [7, 14, 21, 30],
    defaultRepaymentPeriod: 14,
    lateFeePercentage: 2,
    airtimeNetworks: ["Jio", "Airtel", "VI", "BSNL"],
    fuelTypes: ["Petrol", "Diesel"],
  });

  // Notification Settings
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    whatsappNotifications: true,
    smsNotifications: false,
    adminEmail: "admin@drivehub.com",
    adminPhone: "+91 98765 43210",
    whatsappBusinessNumber: "+91 98765 43210",
    notifyOnNewVerification: true,
    notifyOnNewRequest: true,
    notifyOnRequestApproval: true,
    notifyOnLoanDue: true,
  });

  // Security Settings
  const [securitySettings, setSecuritySettings] = useState({
    twoFactorAuth: false,
    sessionTimeout: 480, // minutes
    maxLoginAttempts: 5,
    lockoutDuration: 15, // minutes
    passwordExpiry: 90, // days
    allowMultipleSessions: false,
    ipWhitelisting: false,
    ipWhitelist: "",
  });

  // Business Settings
  const [businessSettings, setBusinessSettings] = useState({
    businessName: "DriveHub Services Pvt Ltd",
    businessEmail: "business@drivehub.com",
    businessPhone: "+91 98765 43210",
    gstNumber: "29ABCDE1234F1Z5",
    panNumber: "ABCDE1234F",
    bankName: "HDFC Bank",
    accountNumber: "XXXX1234",
    ifscCode: "HDFC0001234",
    upiId: "drivehub@hdfcbank",
    termsAndConditions: "https://drivehub.com/terms",
    privacyPolicy: "https://drivehub.com/privacy",
  });

  const handleSave = async () => {
    setSaving(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
    setSaving(false);
  };

  const handleInterestChange = (value: number) => {
    setServiceSettings({ ...serviceSettings, loanInterestRate: value });
  };

  const TabButton = ({
    id,
    label,
    icon: Icon,
  }: {
    id: string;
    label: string;
    icon: any;
  }) => (
    <button
      onClick={() => setActiveTab(id as any)}
      className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold transition-all whitespace-nowrap ${
        activeTab === id
          ? "bg-[#3A7717] text-white shadow-md"
          : "bg-white text-[#01312D] border border-[#bff202]/20 hover:bg-[#eafde7]"
      }`}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );

  const SettingSection = ({
    title,
    children,
  }: {
    title: string;
    children: React.ReactNode;
  }) => (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#bff202]/20">
      <h2 className="text-lg font-bold text-[#01312D] mb-4">{title}</h2>
      {children}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-[#01312D]">Settings</h1>
          <p className="text-gray-500 text-sm mt-1">
            Manage system configuration and preferences
          </p>
        </div>
        <div className="flex gap-3">
          {saveSuccess && (
            <div className="flex items-center gap-2 px-3 py-2 bg-green-100 text-green-700 rounded-lg text-sm">
              <CheckCircle className="w-4 h-4" />
              Settings saved successfully!
            </div>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-[#3A7717] text-white rounded-xl font-semibold hover:bg-[#2d5e12] transition-all disabled:opacity-50"
          >
            {saving ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
        <TabButton id="general" label="General" icon={Settings} />
        <TabButton id="services" label="Services" icon={DollarSign} />
        <TabButton id="notifications" label="Notifications" icon={Bell} />
        <TabButton id="security" label="Security" icon={Shield} />
        <TabButton id="business" label="Business" icon={Building} />
      </div>

      {/* General Settings Tab */}
      {activeTab === "general" && (
        <div className="space-y-4">
          <SettingSection title="Site Information">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[#01312D] font-semibold mb-2 text-sm">
                  Site Name
                </label>
                <input
                  type="text"
                  value={generalSettings.siteName}
                  onChange={(e) =>
                    setGeneralSettings({
                      ...generalSettings,
                      siteName: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 bg-white border border-[#bff202]/20 rounded-xl focus:outline-none focus:border-[#72bf00]"
                />
              </div>
              <div>
                <label className="block text-[#01312D] font-semibold mb-2 text-sm">
                  Site Description
                </label>
                <input
                  type="text"
                  value={generalSettings.siteDescription}
                  onChange={(e) =>
                    setGeneralSettings({
                      ...generalSettings,
                      siteDescription: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 bg-white border border-[#bff202]/20 rounded-xl focus:outline-none focus:border-[#72bf00]"
                />
              </div>
              <div>
                <label className="block text-[#01312D] font-semibold mb-2 text-sm">
                  Contact Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    value={generalSettings.contactEmail}
                    onChange={(e) =>
                      setGeneralSettings({
                        ...generalSettings,
                        contactEmail: e.target.value,
                      })
                    }
                    className="w-full pl-10 pr-4 py-2 bg-white border border-[#bff202]/20 rounded-xl focus:outline-none focus:border-[#72bf00]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[#01312D] font-semibold mb-2 text-sm">
                  Contact Phone
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="tel"
                    value={generalSettings.contactPhone}
                    onChange={(e) =>
                      setGeneralSettings({
                        ...generalSettings,
                        contactPhone: e.target.value,
                      })
                    }
                    className="w-full pl-10 pr-4 py-2 bg-white border border-[#bff202]/20 rounded-xl focus:outline-none focus:border-[#72bf00]"
                  />
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="block text-[#01312D] font-semibold mb-2 text-sm">
                  Address
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <textarea
                    value={generalSettings.address}
                    onChange={(e) =>
                      setGeneralSettings({
                        ...generalSettings,
                        address: e.target.value,
                      })
                    }
                    rows={2}
                    className="w-full pl-10 pr-4 py-2 bg-white border border-[#bff202]/20 rounded-xl focus:outline-none focus:border-[#72bf00]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[#01312D] font-semibold mb-2 text-sm">
                  Timezone
                </label>
                <select
                  value={generalSettings.timezone}
                  onChange={(e) =>
                    setGeneralSettings({
                      ...generalSettings,
                      timezone: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 bg-white border border-[#bff202]/20 rounded-xl focus:outline-none focus:border-[#72bf00]"
                >
                  <option value="Asia/Kolkata">IST (UTC+5:30)</option>
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">EST (UTC-5)</option>
                  <option value="Europe/London">GMT (UTC+0)</option>
                </select>
              </div>
              <div>
                <label className="block text-[#01312D] font-semibold mb-2 text-sm">
                  Date Format
                </label>
                <select
                  value={generalSettings.dateFormat}
                  onChange={(e) =>
                    setGeneralSettings({
                      ...generalSettings,
                      dateFormat: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 bg-white border border-[#bff202]/20 rounded-xl focus:outline-none focus:border-[#72bf00]"
                >
                  <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                  <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                </select>
              </div>
            </div>
          </SettingSection>
        </div>
      )}

      {/* Services Settings Tab */}
      {activeTab === "services" && (
        <div className="space-y-4">
          <SettingSection title="Service Toggles">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center justify-between p-3 bg-[#eafde7] rounded-xl">
                <div className="flex items-center gap-2">
                  <Fuel className="w-5 h-5 text-[#3A7717]" />
                  <span className="font-semibold text-[#01312D]">Fuel</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={serviceSettings.fuelEnabled}
                    onChange={(e) =>
                      setServiceSettings({
                        ...serviceSettings,
                        fuelEnabled: e.target.checked,
                      })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#3A7717]"></div>
                </label>
              </div>
              <div className="flex items-center justify-between p-3 bg-[#eafde7] rounded-xl">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-[#3A7717]" />
                  <span className="font-semibold text-[#01312D]">Airtime</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={serviceSettings.airtimeEnabled}
                    onChange={(e) =>
                      setServiceSettings({
                        ...serviceSettings,
                        airtimeEnabled: e.target.checked,
                      })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#3A7717]"></div>
                </label>
              </div>
              <div className="flex items-center justify-between p-3 bg-[#eafde7] rounded-xl">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-[#3A7717]" />
                  <span className="font-semibold text-[#01312D]">
                    Cash Loan
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={serviceSettings.cashLoanEnabled}
                    onChange={(e) =>
                      setServiceSettings({
                        ...serviceSettings,
                        cashLoanEnabled: e.target.checked,
                      })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#3A7717]"></div>
                </label>
              </div>
              <div className="flex items-center justify-between p-3 bg-[#eafde7] rounded-xl">
                <div className="flex items-center gap-2">
                  <Car className="w-5 h-5 text-[#3A7717]" />
                  <span className="font-semibold text-[#01312D]">Car Wash</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={serviceSettings.carWashEnabled}
                    onChange={(e) =>
                      setServiceSettings({
                        ...serviceSettings,
                        carWashEnabled: e.target.checked,
                      })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#3A7717]"></div>
                </label>
              </div>
            </div>
          </SettingSection>

          <SettingSection title="Loan Configuration">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[#01312D] font-semibold mb-2 text-sm">
                  Interest Rate (%)
                </label>
                <div className="relative">
                  <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="number"
                    value={serviceSettings.loanInterestRate}
                    onChange={(e) =>
                      handleInterestChange(Number(e.target.value))
                    }
                    className="w-full pl-10 pr-4 py-2 bg-white border border-[#bff202]/20 rounded-xl focus:outline-none focus:border-[#72bf00]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[#01312D] font-semibold mb-2 text-sm">
                  Minimum Loan Amount (R)
                </label>
                <input
                  type="number"
                  value={serviceSettings.minLoanAmount}
                  onChange={(e) =>
                    setServiceSettings({
                      ...serviceSettings,
                      minLoanAmount: Number(e.target.value),
                    })
                  }
                  className="w-full px-4 py-2 bg-white border border-[#bff202]/20 rounded-xl focus:outline-none focus:border-[#72bf00]"
                />
              </div>
              <div>
                <label className="block text-[#01312D] font-semibold mb-2 text-sm">
                  Maximum Loan Amount (R)
                </label>
                <input
                  type="number"
                  value={serviceSettings.maxLoanAmount}
                  onChange={(e) =>
                    setServiceSettings({
                      ...serviceSettings,
                      maxLoanAmount: Number(e.target.value),
                    })
                  }
                  className="w-full px-4 py-2 bg-white border border-[#bff202]/20 rounded-xl focus:outline-none focus:border-[#72bf00]"
                />
              </div>
              <div>
                <label className="block text-[#01312D] font-semibold mb-2 text-sm">
                  Default Repayment Period (days)
                </label>
                <select
                  value={serviceSettings.defaultRepaymentPeriod}
                  onChange={(e) =>
                    setServiceSettings({
                      ...serviceSettings,
                      defaultRepaymentPeriod: Number(e.target.value),
                    })
                  }
                  className="w-full px-4 py-2 bg-white border border-[#bff202]/20 rounded-xl focus:outline-none focus:border-[#72bf00]"
                >
                  {serviceSettings.repaymentPeriods.map((days) => (
                    <option key={days} value={days}>
                      {days} days
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[#01312D] font-semibold mb-2 text-sm">
                  Late Fee (% per day)
                </label>
                <div className="relative">
                  <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="number"
                    value={serviceSettings.lateFeePercentage}
                    onChange={(e) =>
                      setServiceSettings({
                        ...serviceSettings,
                        lateFeePercentage: Number(e.target.value),
                      })
                    }
                    className="w-full pl-10 pr-4 py-2 bg-white border border-[#bff202]/20 rounded-xl focus:outline-none focus:border-[#72bf00]"
                  />
                </div>
              </div>
            </div>
          </SettingSection>

          <SettingSection title="Available Networks & Fuel Types">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[#01312D] font-semibold mb-2 text-sm">
                  Airtime Networks
                </label>
                <div className="flex flex-wrap gap-2">
                  {serviceSettings.airtimeNetworks.map((network) => (
                    <span
                      key={network}
                      className="px-3 py-1 bg-[#eafde7] rounded-lg text-sm text-[#01312D]"
                    >
                      {network}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-[#01312D] font-semibold mb-2 text-sm">
                  Fuel Types
                </label>
                <div className="flex flex-wrap gap-2">
                  {serviceSettings.fuelTypes.map((type) => (
                    <span
                      key={type}
                      className="px-3 py-1 bg-[#eafde7] rounded-lg text-sm text-[#01312D]"
                    >
                      {type}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </SettingSection>
        </div>
      )}

      {/* Notifications Settings Tab */}
      {activeTab === "notifications" && (
        <div className="space-y-4">
          <SettingSection title="Notification Channels">
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-[#eafde7] rounded-xl">
                <div className="flex items-center gap-2">
                  <Mail className="w-5 h-5 text-[#3A7717]" />
                  <span className="font-semibold text-[#01312D]">
                    Email Notifications
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notificationSettings.emailNotifications}
                    onChange={(e) =>
                      setNotificationSettings({
                        ...notificationSettings,
                        emailNotifications: e.target.checked,
                      })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#3A7717]"></div>
                </label>
              </div>
              <div className="flex items-center justify-between p-3 bg-[#eafde7] rounded-xl">
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-[#3A7717]" />
                  <span className="font-semibold text-[#01312D]">
                    WhatsApp Notifications
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notificationSettings.whatsappNotifications}
                    onChange={(e) =>
                      setNotificationSettings({
                        ...notificationSettings,
                        whatsappNotifications: e.target.checked,
                      })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#3A7717]"></div>
                </label>
              </div>
              <div className="flex items-center justify-between p-3 bg-[#eafde7] rounded-xl">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-[#3A7717]" />
                  <span className="font-semibold text-[#01312D]">
                    SMS Notifications
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notificationSettings.smsNotifications}
                    onChange={(e) =>
                      setNotificationSettings({
                        ...notificationSettings,
                        smsNotifications: e.target.checked,
                      })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#3A7717]"></div>
                </label>
              </div>
            </div>
          </SettingSection>

          <SettingSection title="Admin Contact">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[#01312D] font-semibold mb-2 text-sm">
                  Admin Email
                </label>
                <div className="relative">
                  <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    value={notificationSettings.adminEmail}
                    onChange={(e) =>
                      setNotificationSettings({
                        ...notificationSettings,
                        adminEmail: e.target.value,
                      })
                    }
                    className="w-full pl-10 pr-4 py-2 bg-white border border-[#bff202]/20 rounded-xl focus:outline-none focus:border-[#72bf00]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[#01312D] font-semibold mb-2 text-sm">
                  Admin Phone
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="tel"
                    value={notificationSettings.adminPhone}
                    onChange={(e) =>
                      setNotificationSettings({
                        ...notificationSettings,
                        adminPhone: e.target.value,
                      })
                    }
                    className="w-full pl-10 pr-4 py-2 bg-white border border-[#bff202]/20 rounded-xl focus:outline-none focus:border-[#72bf00]"
                  />
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="block text-[#01312D] font-semibold mb-2 text-sm">
                  WhatsApp Business Number
                </label>
                <div className="relative">
                  <MessageCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="tel"
                    value={notificationSettings.whatsappBusinessNumber}
                    onChange={(e) =>
                      setNotificationSettings({
                        ...notificationSettings,
                        whatsappBusinessNumber: e.target.value,
                      })
                    }
                    className="w-full pl-10 pr-4 py-2 bg-white border border-[#bff202]/20 rounded-xl focus:outline-none focus:border-[#72bf00]"
                  />
                </div>
              </div>
            </div>
          </SettingSection>

          <SettingSection title="Notify On">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[#01312D]">New Driver Verification</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notificationSettings.notifyOnNewVerification}
                    onChange={(e) =>
                      setNotificationSettings({
                        ...notificationSettings,
                        notifyOnNewVerification: e.target.checked,
                      })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#3A7717]"></div>
                </label>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#01312D]">New Service Request</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notificationSettings.notifyOnNewRequest}
                    onChange={(e) =>
                      setNotificationSettings({
                        ...notificationSettings,
                        notifyOnNewRequest: e.target.checked,
                      })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#3A7717]"></div>
                </label>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#01312D]">
                  Request Approval Confirmation
                </span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notificationSettings.notifyOnRequestApproval}
                    onChange={(e) =>
                      setNotificationSettings({
                        ...notificationSettings,
                        notifyOnRequestApproval: e.target.checked,
                      })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#3A7717]"></div>
                </label>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#01312D]">Loan Due Date Reminder</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notificationSettings.notifyOnLoanDue}
                    onChange={(e) =>
                      setNotificationSettings({
                        ...notificationSettings,
                        notifyOnLoanDue: e.target.checked,
                      })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#3A7717]"></div>
                </label>
              </div>
            </div>
          </SettingSection>
        </div>
      )}

      {/* Security Settings Tab */}
      {activeTab === "security" && (
        <div className="space-y-4">
          <SettingSection title="Authentication">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-[#eafde7] rounded-xl">
                <div className="flex items-center gap-2">
                  <Lock className="w-5 h-5 text-[#3A7717]" />
                  <span className="font-semibold text-[#01312D]">
                    Two-Factor Authentication (2FA)
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={securitySettings.twoFactorAuth}
                    onChange={(e) =>
                      setSecuritySettings({
                        ...securitySettings,
                        twoFactorAuth: e.target.checked,
                      })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#3A7717]"></div>
                </label>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#01312D] font-semibold mb-2 text-sm">
                    Session Timeout (minutes)
                  </label>
                  <input
                    type="number"
                    value={securitySettings.sessionTimeout}
                    onChange={(e) =>
                      setSecuritySettings({
                        ...securitySettings,
                        sessionTimeout: Number(e.target.value),
                      })
                    }
                    className="w-full px-4 py-2 bg-white border border-[#bff202]/20 rounded-xl focus:outline-none focus:border-[#72bf00]"
                  />
                </div>
                <div>
                  <label className="block text-[#01312D] font-semibold mb-2 text-sm">
                    Max Login Attempts
                  </label>
                  <input
                    type="number"
                    value={securitySettings.maxLoginAttempts}
                    onChange={(e) =>
                      setSecuritySettings({
                        ...securitySettings,
                        maxLoginAttempts: Number(e.target.value),
                      })
                    }
                    className="w-full px-4 py-2 bg-white border border-[#bff202]/20 rounded-xl focus:outline-none focus:border-[#72bf00]"
                  />
                </div>
                <div>
                  <label className="block text-[#01312D] font-semibold mb-2 text-sm">
                    Lockout Duration (minutes)
                  </label>
                  <input
                    type="number"
                    value={securitySettings.lockoutDuration}
                    onChange={(e) =>
                      setSecuritySettings({
                        ...securitySettings,
                        lockoutDuration: Number(e.target.value),
                      })
                    }
                    className="w-full px-4 py-2 bg-white border border-[#bff202]/20 rounded-xl focus:outline-none focus:border-[#72bf00]"
                  />
                </div>
                <div>
                  <label className="block text-[#01312D] font-semibold mb-2 text-sm">
                    Password Expiry (days)
                  </label>
                  <input
                    type="number"
                    value={securitySettings.passwordExpiry}
                    onChange={(e) =>
                      setSecuritySettings({
                        ...securitySettings,
                        passwordExpiry: Number(e.target.value),
                      })
                    }
                    className="w-full px-4 py-2 bg-white border border-[#bff202]/20 rounded-xl focus:outline-none focus:border-[#72bf00]"
                  />
                </div>
              </div>
            </div>
          </SettingSection>

          <SettingSection title="Access Control">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-semibold text-[#01312D]">
                    Allow Multiple Sessions
                  </span>
                  <p className="text-xs text-gray-500">
                    Allow admin to be logged in from multiple devices
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={securitySettings.allowMultipleSessions}
                    onChange={(e) =>
                      setSecuritySettings({
                        ...securitySettings,
                        allowMultipleSessions: e.target.checked,
                      })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#3A7717]"></div>
                </label>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-semibold text-[#01312D]">
                    IP Whitelisting
                  </span>
                  <p className="text-xs text-gray-500">
                    Restrict access to specific IP addresses
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={securitySettings.ipWhitelisting}
                    onChange={(e) =>
                      setSecuritySettings({
                        ...securitySettings,
                        ipWhitelisting: e.target.checked,
                      })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#3A7717]"></div>
                </label>
              </div>
              {securitySettings.ipWhitelisting && (
                <div>
                  <label className="block text-[#01312D] font-semibold mb-2 text-sm">
                    Whitelisted IPs (one per line)
                  </label>
                  <textarea
                    value={securitySettings.ipWhitelist}
                    onChange={(e) =>
                      setSecuritySettings({
                        ...securitySettings,
                        ipWhitelist: e.target.value,
                      })
                    }
                    rows={3}
                    placeholder="192.168.1.1&#10;10.0.0.1"
                    className="w-full px-4 py-2 bg-white border border-[#bff202]/20 rounded-xl focus:outline-none focus:border-[#72bf00]"
                  />
                </div>
              )}
            </div>
          </SettingSection>
        </div>
      )}

      {/* Business Settings Tab */}
      {activeTab === "business" && (
        <div className="space-y-4">
          <SettingSection title="Business Information">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-[#01312D] font-semibold mb-2 text-sm">
                  Business Name
                </label>
                <input
                  type="text"
                  value={businessSettings.businessName}
                  onChange={(e) =>
                    setBusinessSettings({
                      ...businessSettings,
                      businessName: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 bg-white border border-[#bff202]/20 rounded-xl focus:outline-none focus:border-[#72bf00]"
                />
              </div>
              <div>
                <label className="block text-[#01312D] font-semibold mb-2 text-sm">
                  Business Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    value={businessSettings.businessEmail}
                    onChange={(e) =>
                      setBusinessSettings({
                        ...businessSettings,
                        businessEmail: e.target.value,
                      })
                    }
                    className="w-full pl-10 pr-4 py-2 bg-white border border-[#bff202]/20 rounded-xl focus:outline-none focus:border-[#72bf00]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[#01312D] font-semibold mb-2 text-sm">
                  Business Phone
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="tel"
                    value={businessSettings.businessPhone}
                    onChange={(e) =>
                      setBusinessSettings({
                        ...businessSettings,
                        businessPhone: e.target.value,
                      })
                    }
                    className="w-full pl-10 pr-4 py-2 bg-white border border-[#bff202]/20 rounded-xl focus:outline-none focus:border-[#72bf00]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[#01312D] font-semibold mb-2 text-sm">
                  GST Number
                </label>
                <input
                  type="text"
                  value={businessSettings.gstNumber}
                  onChange={(e) =>
                    setBusinessSettings({
                      ...businessSettings,
                      gstNumber: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 bg-white border border-[#bff202]/20 rounded-xl focus:outline-none focus:border-[#72bf00]"
                />
              </div>
              <div>
                <label className="block text-[#01312D] font-semibold mb-2 text-sm">
                  PAN Number
                </label>
                <input
                  type="text"
                  value={businessSettings.panNumber}
                  onChange={(e) =>
                    setBusinessSettings({
                      ...businessSettings,
                      panNumber: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 bg-white border border-[#bff202]/20 rounded-xl focus:outline-none focus:border-[#72bf00]"
                />
              </div>
            </div>
          </SettingSection>

          <SettingSection title="Bank Details">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[#01312D] font-semibold mb-2 text-sm">
                  Bank Name
                </label>
                <input
                  type="text"
                  value={businessSettings.bankName}
                  onChange={(e) =>
                    setBusinessSettings({
                      ...businessSettings,
                      bankName: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 bg-white border border-[#bff202]/20 rounded-xl focus:outline-none focus:border-[#72bf00]"
                />
              </div>
              <div>
                <label className="block text-[#01312D] font-semibold mb-2 text-sm">
                  Account Number
                </label>
                <input
                  type="text"
                  value={businessSettings.accountNumber}
                  onChange={(e) =>
                    setBusinessSettings({
                      ...businessSettings,
                      accountNumber: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 bg-white border border-[#bff202]/20 rounded-xl focus:outline-none focus:border-[#72bf00]"
                />
              </div>
              <div>
                <label className="block text-[#01312D] font-semibold mb-2 text-sm">
                  IFSC Code
                </label>
                <input
                  type="text"
                  value={businessSettings.ifscCode}
                  onChange={(e) =>
                    setBusinessSettings({
                      ...businessSettings,
                      ifscCode: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 bg-white border border-[#bff202]/20 rounded-xl focus:outline-none focus:border-[#72bf00]"
                />
              </div>
              <div>
                <label className="block text-[#01312D] font-semibold mb-2 text-sm">
                  UPI ID
                </label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={businessSettings.upiId}
                    onChange={(e) =>
                      setBusinessSettings({
                        ...businessSettings,
                        upiId: e.target.value,
                      })
                    }
                    className="w-full pl-10 pr-4 py-2 bg-white border border-[#bff202]/20 rounded-xl focus:outline-none focus:border-[#72bf00]"
                  />
                </div>
              </div>
            </div>
          </SettingSection>

          <SettingSection title="Legal Documents">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[#01312D] font-semibold mb-2 text-sm">
                  Terms & Conditions URL
                </label>
                <div className="relative">
                  <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="url"
                    value={businessSettings.termsAndConditions}
                    onChange={(e) =>
                      setBusinessSettings({
                        ...businessSettings,
                        termsAndConditions: e.target.value,
                      })
                    }
                    className="w-full pl-10 pr-4 py-2 bg-white border border-[#bff202]/20 rounded-xl focus:outline-none focus:border-[#72bf00]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[#01312D] font-semibold mb-2 text-sm">
                  Privacy Policy URL
                </label>
                <div className="relative">
                  <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="url"
                    value={businessSettings.privacyPolicy}
                    onChange={(e) =>
                      setBusinessSettings({
                        ...businessSettings,
                        privacyPolicy: e.target.value,
                      })
                    }
                    className="w-full pl-10 pr-4 py-2 bg-white border border-[#bff202]/20 rounded-xl focus:outline-none focus:border-[#72bf00]"
                  />
                </div>
              </div>
            </div>
          </SettingSection>

          <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-yellow-800">
                  Important Note
                </p>
                <p className="text-xs text-yellow-700 mt-1">
                  Changes to business settings will affect all financial
                  transactions and legal documents. Please ensure all
                  information is accurate before saving.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
