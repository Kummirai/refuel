// src/app/admin/settings/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useBodyScrollLock } from "@/lib/hooks/useBodyScrollLock";
import {
  Settings,
  Bell,
  Shield,
  DollarSign,
  MessageCircle,
  Mail,
  Smartphone,
  Car,
  Clock,
  Percent,
  Wallet,
  Lock,
  Save,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  FileText,
  CreditCard,
  Building,
  MapPin,
  Phone,
  AtSign,
  Fuel,
  Loader2,
  Plus,
  Trash2,
  Edit2,
  Tag,
} from "lucide-react";

// Car wash package interface
interface CarWashPackage {
  id: string;
  name: string;
  description: string;
  price: number;
  isActive: boolean;
}

// Package Modal — defined OUTSIDE AdminSettingsPage to prevent re-mount on every render
function PackageModal({
  editingPackage,
  onSave,
  onClose,
}: {
  editingPackage: CarWashPackage | null;
  onSave: (pkg: Omit<CarWashPackage, "id">) => void;
  onClose: () => void;
}) {
  useBodyScrollLock(true);
  const [name, setName] = useState(editingPackage?.name || "");
  const [description, setDescription] = useState(
    editingPackage?.description || "",
  );
  const [price, setPrice] = useState<number | "">(editingPackage?.price ?? 50);
  const [isActive, setIsActive] = useState(editingPackage?.isActive ?? true);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose}></div>
      <div className="relative bg-white rounded-2xl max-w-md w-full shadow-2xl">
        <div className="bg-[#3A7717] rounded-t-2xl p-5">
          <h2 className="text-xl font-bold text-white">
            {editingPackage ? "Edit Package" : "Add New Package"}
          </h2>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-[#01312D] font-semibold mb-2 text-sm">
              Package Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:border-[#3A7717]"
              placeholder="e.g., Basic Wash"
            />
          </div>
          <div>
            <label className="block text-[#01312D] font-semibold mb-2 text-sm">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:border-[#3A7717]"
              placeholder="Package description"
            />
          </div>
          <div>
            <label className="block text-[#01312D] font-semibold mb-2 text-sm">
              Price (R)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-semibold">
                R
              </span>
              <input
                type="number"
                value={price}
                onChange={(e) =>
                  setPrice(e.target.value === "" ? "" : Number(e.target.value))
                }
                className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:border-[#3A7717]"
                placeholder="e.g., 50"
                min="0"
                step="1"
              />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <label className="text-[#01312D] font-semibold text-sm">
              Active
            </label>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-10 h-5 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#3A7717]"></div>
            </label>
          </div>
        </div>
        <div className="border-t border-gray-100 p-5 flex gap-3">
          <button
            onClick={() =>
              onSave({
                name,
                description,
                price: price === "" ? 0 : price,
                isActive,
              })
            }
            className="flex-1 bg-[#3A7717] text-white py-2 rounded-xl font-semibold hover:bg-[#2d5a12]"
          >
            Save Package
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-gray-200 text-[#01312D] py-2 rounded-xl font-semibold hover:bg-gray-300"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

const TabButton = ({
  id,
  label,
  icon: Icon,
  activeTab,
  setActiveTab,
}: {
  id: string;
  label: string;
  icon: any;
  activeTab: string;
  setActiveTab: (id: any) => void;
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

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState<
    "general" | "services" | "notifications" | "security" | "business"
  >("general");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState("");
  const [editingPackage, setEditingPackage] = useState<CarWashPackage | null>(
    null,
  );
  const [showPackageModal, setShowPackageModal] = useState(false);

  // General Settings
  const [generalSettings, setGeneralSettings] = useState({
    siteName: "Kapuka",
    siteDescription: "Driver Services Platform",
    contactEmail: "support@Kapuka.com",
    contactPhone: "+27 12 345 6789",
    address: "123, Tech Park, Johannesburg - 2000",
    timezone: "Africa/Johannesburg",
    currency: "ZAR",
    dateFormat: "DD/MM/YYYY",
  });

  // Service Settings
  const [serviceSettings, setServiceSettings] = useState({
    fuelEnabled: true,
    airtimeEnabled: true,
    cashLoanEnabled: true,
    carWashEnabled: true,
    fuelInterestRate: 13,
    airtimeInterestRate: 13,
    cashInterestRate: 13,
    carWashIsFixedPrice: true,
    carWashServiceCharge: 0,
    carWashPackages: [] as CarWashPackage[],
    minLoanAmount: 100,
    maxLoanAmount: 5000,
    repaymentPeriods: [7, 14, 21, 30],
    defaultRepaymentPeriod: 7,
    lateFeePercentage: 2,
    airtimeNetworks: ["Vodacom", "MTN", "Telkom", "Cell C"],
    fuelTypes: ["Petrol 93", "Petrol 95", "Diesel 500ppm", "Diesel 50ppm"],
  });

  // Notification Settings
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    whatsappNotifications: true,
    smsNotifications: false,
    adminEmail: "admin@Kapuka.com",
    adminPhone: "+27 12 345 6789",
    whatsappBusinessNumber: "+27 12 345 6789",
    notifyOnNewVerification: true,
    notifyOnNewRequest: true,
    notifyOnRequestApproval: true,
    notifyOnLoanDue: true,
  });

  // Security Settings
  const [securitySettings, setSecuritySettings] = useState({
    twoFactorAuth: false,
    sessionTimeout: 480,
    maxLoginAttempts: 5,
    lockoutDuration: 15,
    passwordExpiry: 90,
    allowMultipleSessions: false,
    ipWhitelisting: false,
    ipWhitelist: "",
  });

  // Business Settings
  const [businessSettings, setBusinessSettings] = useState({
    businessName: "Kapuka Tradings Pty Ltd",
    businessEmail: "business@Kapuka.com",
    businessPhone: "+27 12 345 6789",
    registrationNumber: "2020/123456/07",
    vatNumber: "1234567890",
    bankName: "Standard Bank",
    accountNumber: "XXXX1234",
    branchCode: "051001",
    upiId: "Kapuka@standardbank",
    termsAndConditions: "https://Kapuka.com/terms",
    privacyPolicy: "https://Kapuka.com/privacy",
  });

  // Fetch settings on load
  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch("/api/admin/settings");
      if (response.ok) {
        const data = await response.json();
        if (data.general) setGeneralSettings(data.general);
        if (data.services) {
          setServiceSettings(data.services);
          if (!data.services.carWashPackages) {
            setServiceSettings((prev) => ({
              ...prev,
              carWashPackages: [
                {
                  id: "1",
                  name: "Basic Wash",
                  description: "Exterior wash and dry",
                  price: 50,
                  isActive: true,
                },
                {
                  id: "2",
                  name: "Full Service",
                  description: "Interior and exterior cleaning",
                  price: 100,
                  isActive: true,
                },
                {
                  id: "3",
                  name: "Premium Detail",
                  description: "Complete detailing service",
                  price: 200,
                  isActive: true,
                },
              ],
            }));
          }
        }
        if (data.notifications) setNotificationSettings(data.notifications);
        if (data.security) setSecuritySettings(data.security);
        if (data.business) setBusinessSettings(data.business);
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    } finally {
      setLoading(false);
    }
  };

  // Generic input change handlers
  const handleGeneralChange =
    (field: string) =>
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >,
    ) => {
      setGeneralSettings((prev) => ({ ...prev, [field]: e.target.value }));
    };

  const handleNotificationChange =
    (field: string) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const value =
        e.target.type === "checkbox"
          ? (e.target as HTMLInputElement).checked
          : e.target.value;
      setNotificationSettings((prev) => ({ ...prev, [field]: value }));
    };

  const handleSecurityChange =
    (field: string) =>
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >,
    ) => {
      const value =
        e.target.type === "checkbox"
          ? (e.target as HTMLInputElement).checked
          : e.target.value;
      setSecuritySettings((prev) => ({ ...prev, [field]: value }));
    };

  const handleBusinessChange =
    (field: string) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setBusinessSettings((prev) => ({ ...prev, [field]: e.target.value }));
    };

  // Fix for numeric inputs: allows empty string for typing and converts to number on state update
  const handleServiceNumericChange =
    (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setServiceSettings((prev) => ({
        ...prev,
        [field]: val === "" ? 0 : Number(val),
      }));
    };

  // Car wash package handlers
  const handleAddPackage = () => {
    setEditingPackage(null);
    setShowPackageModal(true);
  };

  const handleEditPackage = (pkg: CarWashPackage) => {
    setEditingPackage(pkg);
    setShowPackageModal(true);
  };

  const handleDeletePackage = (packageId: string) => {
    setServiceSettings((prev) => ({
      ...prev,
      carWashPackages: prev.carWashPackages.filter((p) => p.id !== packageId),
    }));
  };

  const handleSavePackage = (pkgData: Omit<CarWashPackage, "id">) => {
    if (editingPackage) {
      setServiceSettings((prev) => ({
        ...prev,
        carWashPackages: prev.carWashPackages.map((p) =>
          p.id === editingPackage.id ? { ...pkgData, id: p.id } : p,
        ),
      }));
    } else {
      const newId = Date.now().toString();
      setServiceSettings((prev) => ({
        ...prev,
        carWashPackages: [...prev.carWashPackages, { ...pkgData, id: newId }],
      }));
    }
    setShowPackageModal(false);
    setEditingPackage(null);
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          general: generalSettings,
          services: serviceSettings,
          notifications: notificationSettings,
          security: securitySettings,
          business: businessSettings,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save settings");
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error: any) {
      console.error("Error saving settings:", error);
      setError(error.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-[#3A7717] animate-spin mx-auto mb-4" />
          <p className="text-[#01312D]">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl  font-bold text-[#01312D]">Settings</h1>
          <p className="text-gray-500 text-sm mt-1 w-5/6">
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
          {error && (
            <div className="flex items-center gap-2 px-3 py-2 bg-red-100 text-red-700 rounded-lg text-sm">
              <AlertTriangle className="w-4 h-4" />
              {error}
            </div>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-[#3A7717] text-white rounded-xl hover:bg-[#2d5e12] text-sm transition-all disabled:opacity-50"
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
      <div className="flex gap-3 text-sm flex-wrap pb-2 no-scrollbar">
        <TabButton id="general" label="General" icon={Settings} activeTab={activeTab} setActiveTab={setActiveTab} />
        <TabButton id="services" label="Services" icon={DollarSign} activeTab={activeTab} setActiveTab={setActiveTab} />
        <TabButton id="notifications" label="Notifications" icon={Bell} activeTab={activeTab} setActiveTab={setActiveTab} />
        <TabButton id="security" label="Security" icon={Shield} activeTab={activeTab} setActiveTab={setActiveTab} />
        <TabButton id="business" label="Business" icon={Building} activeTab={activeTab} setActiveTab={setActiveTab} />
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
                  onChange={handleGeneralChange("siteName")}
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
                  onChange={handleGeneralChange("siteDescription")}
                  className="w-full px-4 py-2 bg-white border border-[#bff202]/20 rounded-xl"
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
                    onChange={handleGeneralChange("contactEmail")}
                    className="w-full pl-10 pr-4 py-2 bg-white border border-[#bff202]/20 rounded-xl"
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
                    onChange={handleGeneralChange("contactPhone")}
                    className="w-full pl-10 pr-4 py-2 bg-white border border-[#bff202]/20 rounded-xl"
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
                    onChange={handleGeneralChange("address")}
                    rows={2}
                    className="w-full pl-10 pr-4 py-2 bg-white border border-[#bff202]/20 rounded-xl"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[#01312D] font-semibold mb-2 text-sm">
                  Timezone
                </label>
                <select
                  value={generalSettings.timezone}
                  onChange={handleGeneralChange("timezone")}
                  className="w-full px-4 py-2 bg-white border border-[#bff202]/20 rounded-xl"
                >
                  <option value="Africa/Johannesburg">SAST (UTC+2)</option>
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
                  onChange={handleGeneralChange("dateFormat")}
                  className="w-full px-4 py-2 bg-white border border-[#bff202]/20 rounded-xl"
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
                      setServiceSettings((prev) => ({
                        ...prev,
                        fuelEnabled: e.target.checked,
                      }))
                    }
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#3A7717]"></div>
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
                      setServiceSettings((prev) => ({
                        ...prev,
                        airtimeEnabled: e.target.checked,
                      }))
                    }
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#3A7717]"></div>
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
                      setServiceSettings((prev) => ({
                        ...prev,
                        cashLoanEnabled: e.target.checked,
                      }))
                    }
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#3A7717]"></div>
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
                      setServiceSettings((prev) => ({
                        ...prev,
                        carWashEnabled: e.target.checked,
                      }))
                    }
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#3A7717]"></div>
                </label>
              </div>
            </div>
          </SettingSection>

          {/* Interest Rates (%) */}
          <SettingSection title="Interest Rates (%)">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[#01312D] font-semibold mb-2 text-sm">
                  Fuel Interest Rate
                </label>
                <div className="relative">
                  <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="number"
                    value={serviceSettings.fuelInterestRate || ""}
                    onChange={handleServiceNumericChange("fuelInterestRate")}
                    className="w-full pl-10 pr-4 py-2 bg-white border border-[#bff202]/20 rounded-xl focus:outline-none focus:border-[#72bf00]"
                    step="1"
                    min="0"
                    max="100"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[#01312D] font-semibold mb-2 text-sm">
                  Airtime Interest Rate
                </label>
                <div className="relative">
                  <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="number"
                    value={serviceSettings.airtimeInterestRate || ""}
                    onChange={handleServiceNumericChange("airtimeInterestRate")}
                    className="w-full pl-10 pr-4 py-2 bg-white border border-[#bff202]/20 rounded-xl focus:outline-none focus:border-[#72bf00]"
                    step="1"
                    min="0"
                    max="100"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[#01312D] font-semibold mb-2 text-sm">
                  Cash Loan Interest Rate
                </label>
                <div className="relative">
                  <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="number"
                    value={serviceSettings.cashInterestRate || ""}
                    onChange={handleServiceNumericChange("cashInterestRate")}
                    className="w-full pl-10 pr-4 py-2 bg-white border border-[#bff202]/20 rounded-xl focus:outline-none focus:border-[#72bf00]"
                    step="1"
                    min="0"
                    max="100"
                  />
                </div>
              </div>
            </div>
            <div className="mt-3 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> Car wash uses fixed price packages (not
                interest rates). Configure packages below.
              </p>
            </div>
          </SettingSection>

          {/* Car Wash Packages Section */}
          {serviceSettings.carWashEnabled && (
            <SettingSection title="Car Wash Packages">
              <div className="space-y-3">
                {/* Service Charge Amount */}
                <div className="p-4 bg-[#eafde7] rounded-xl border border-[#bff202]/30">
                  <label className="block text-[#01312D] font-semibold mb-2 text-sm">
                    Service Charge (R)
                  </label>
                  <div className="relative max-w-xs">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-semibold">
                      R
                    </span>
                    <input
                      type="number"
                      value={serviceSettings.carWashServiceCharge || ""}
                      onChange={handleServiceNumericChange(
                        "carWashServiceCharge",
                      )}
                      className="w-full pl-8 pr-4 py-2 bg-white border border-[#bff202]/20 rounded-xl focus:outline-none focus:border-[#72bf00]"
                      placeholder="e.g., 20"
                      min="0"
                      step="1"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Fixed amount charged per car wash transaction (in addition
                    to the package price).
                  </p>
                </div>
                <button
                  onClick={handleAddPackage}
                  className="flex items-center gap-2 px-4 py-2 bg-[#3A7717] text-white rounded-xl text-sm font-semibold hover:bg-[#2d5e12]"
                >
                  <Plus className="w-4 h-4" />
                  Add Package
                </button>
                <div className="grid grid-cols-1 gap-3">
                  {serviceSettings.carWashPackages.map((pkg) => (
                    <div
                      key={pkg.id}
                      className={`flex items-center justify-between p-4 rounded-xl border ${
                        pkg.isActive
                          ? "bg-white border-[#bff202]/30"
                          : "bg-gray-50 border-gray-200 opacity-70"
                      }`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Car className="w-5 h-5 text-[#3A7717]" />
                          <h4 className="font-bold text-[#01312D]">
                            {pkg.name}
                          </h4>
                          {!pkg.isActive && (
                            <span className="text-xs text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full">
                              Inactive
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          {pkg.description}
                        </p>
                        <p className="text-lg font-bold text-[#3A7717] mt-2">
                          R{pkg.price.toLocaleString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditPackage(pkg)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeletePackage(pkg.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {serviceSettings.carWashPackages.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <Tag className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>No packages configured yet.</p>
                      <p className="text-sm">
                        Click "Add Package" to create car wash services.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </SettingSection>
          )}

          {/* Loan Configuration */}
          <SettingSection title="Loan Configuration">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[#01312D] font-semibold mb-2 text-sm">
                  Minimum Loan Amount (R)
                </label>
                <input
                  type="number"
                  value={serviceSettings.minLoanAmount || ""}
                  onChange={handleServiceNumericChange("minLoanAmount")}
                  className="w-full px-4 py-2 bg-white border border-[#bff202]/20 rounded-xl focus:outline-none focus:border-[#72bf00]"
                  step="10"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-[#01312D] font-semibold mb-2 text-sm">
                  Maximum Loan Amount (R)
                </label>
                <input
                  type="number"
                  value={serviceSettings.maxLoanAmount || ""}
                  onChange={handleServiceNumericChange("maxLoanAmount")}
                  className="w-full px-4 py-2 bg-white border border-[#bff202]/20 rounded-xl focus:outline-none focus:border-[#72bf00]"
                  step="10"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-[#01312D] font-semibold mb-2 text-sm">
                  Default Repayment Period (days)
                </label>
                <select
                  value={serviceSettings.defaultRepaymentPeriod}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setServiceSettings((prev) => ({
                      ...prev,
                      defaultRepaymentPeriod: val,
                    }));
                  }}
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
                    value={serviceSettings.lateFeePercentage || ""}
                    onChange={handleServiceNumericChange("lateFeePercentage")}
                    className="w-full pl-10 pr-4 py-2 bg-white border border-[#bff202]/20 rounded-xl focus:outline-none focus:border-[#72bf00]"
                    step="0.5"
                    min="0"
                    max="100"
                  />
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
                    onChange={handleNotificationChange("emailNotifications")}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#3A7717]"></div>
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
                    onChange={handleNotificationChange("whatsappNotifications")}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#3A7717]"></div>
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
                    onChange={handleNotificationChange("smsNotifications")}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#3A7717]"></div>
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
                    onChange={handleNotificationChange("adminEmail")}
                    className="w-full pl-10 pr-4 py-2 bg-white border border-[#bff202]/20 rounded-xl"
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
                    onChange={handleNotificationChange("adminPhone")}
                    className="w-full pl-10 pr-4 py-2 bg-white border border-[#bff202]/20 rounded-xl"
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
                    onChange={handleNotificationChange(
                      "whatsappBusinessNumber",
                    )}
                    className="w-full pl-10 pr-4 py-2 bg-white border border-[#bff202]/20 rounded-xl"
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
                    onChange={handleNotificationChange(
                      "notifyOnNewVerification",
                    )}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#3A7717]"></div>
                </label>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#01312D]">New Service Request</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notificationSettings.notifyOnNewRequest}
                    onChange={handleNotificationChange("notifyOnNewRequest")}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#3A7717]"></div>
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
                    onChange={handleNotificationChange(
                      "notifyOnRequestApproval",
                    )}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#3A7717]"></div>
                </label>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#01312D]">Loan Due Date Reminder</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notificationSettings.notifyOnLoanDue}
                    onChange={handleNotificationChange("notifyOnLoanDue")}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#3A7717]"></div>
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
                    onChange={handleSecurityChange("twoFactorAuth")}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#3A7717]"></div>
                </label>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#01312D] font-semibold mb-2 text-sm">
                    Session Timeout (minutes)
                  </label>
                  <input
                    type="number"
                    value={securitySettings.sessionTimeout || ""}
                    onChange={handleSecurityChange("sessionTimeout")}
                    className="w-full px-4 py-2 bg-white border border-[#bff202]/20 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-[#01312D] font-semibold mb-2 text-sm">
                    Max Login Attempts
                  </label>
                  <input
                    type="number"
                    value={securitySettings.maxLoginAttempts || ""}
                    onChange={handleSecurityChange("maxLoginAttempts")}
                    className="w-full px-4 py-2 bg-white border border-[#bff202]/20 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-[#01312D] font-semibold mb-2 text-sm">
                    Lockout Duration (minutes)
                  </label>
                  <input
                    type="number"
                    value={securitySettings.lockoutDuration || ""}
                    onChange={handleSecurityChange("lockoutDuration")}
                    className="w-full px-4 py-2 bg-white border border-[#bff202]/20 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-[#01312D] font-semibold mb-2 text-sm">
                    Password Expiry (days)
                  </label>
                  <input
                    type="number"
                    value={securitySettings.passwordExpiry || ""}
                    onChange={handleSecurityChange("passwordExpiry")}
                    className="w-full px-4 py-2 bg-white border border-[#bff202]/20 rounded-xl"
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
                    onChange={handleSecurityChange("allowMultipleSessions")}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#3A7717]"></div>
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
                    onChange={handleSecurityChange("ipWhitelisting")}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#3A7717]"></div>
                </label>
              </div>
              {securitySettings.ipWhitelisting && (
                <div>
                  <label className="block text-[#01312D] font-semibold mb-2 text-sm">
                    Whitelisted IPs (one per line)
                  </label>
                  <textarea
                    value={securitySettings.ipWhitelist}
                    onChange={handleSecurityChange("ipWhitelist")}
                    rows={3}
                    placeholder="192.168.1.1&#10;10.0.0.1"
                    className="w-full px-4 py-2 bg-white border border-[#bff202]/20 rounded-xl"
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
                  onChange={handleBusinessChange("businessName")}
                  className="w-full px-4 py-2 bg-white border border-[#bff202]/20 rounded-xl"
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
                    onChange={handleBusinessChange("businessEmail")}
                    className="w-full pl-10 pr-4 py-2 bg-white border border-[#bff202]/20 rounded-xl"
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
                    onChange={handleBusinessChange("businessPhone")}
                    className="w-full pl-10 pr-4 py-2 bg-white border border-[#bff202]/20 rounded-xl"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[#01312D] font-semibold mb-2 text-sm">
                  Registration Number
                </label>
                <input
                  type="text"
                  value={businessSettings.registrationNumber}
                  onChange={handleBusinessChange("registrationNumber")}
                  className="w-full px-4 py-2 bg-white border border-[#bff202]/20 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-[#01312D] font-semibold mb-2 text-sm">
                  VAT Number
                </label>
                <input
                  type="text"
                  value={businessSettings.vatNumber}
                  onChange={handleBusinessChange("vatNumber")}
                  className="w-full px-4 py-2 bg-white border border-[#bff202]/20 rounded-xl"
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
                  onChange={handleBusinessChange("bankName")}
                  className="w-full px-4 py-2 bg-white border border-[#bff202]/20 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-[#01312D] font-semibold mb-2 text-sm">
                  Account Number
                </label>
                <input
                  type="text"
                  value={businessSettings.accountNumber}
                  onChange={handleBusinessChange("accountNumber")}
                  className="w-full px-4 py-2 bg-white border border-[#bff202]/20 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-[#01312D] font-semibold mb-2 text-sm">
                  Branch Code
                </label>
                <input
                  type="text"
                  value={businessSettings.branchCode}
                  onChange={handleBusinessChange("branchCode")}
                  className="w-full px-4 py-2 bg-white border border-[#bff202]/20 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-[#01312D] font-semibold mb-2 text-sm">
                  UPI ID / Payable To
                </label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={businessSettings.upiId}
                    onChange={handleBusinessChange("upiId")}
                    className="w-full pl-10 pr-4 py-2 bg-white border border-[#bff202]/20 rounded-xl"
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
                    onChange={handleBusinessChange("termsAndConditions")}
                    className="w-full pl-10 pr-4 py-2 bg-white border border-[#bff202]/20 rounded-xl"
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
                    onChange={handleBusinessChange("privacyPolicy")}
                    className="w-full pl-10 pr-4 py-2 bg-white border border-[#bff202]/20 rounded-xl"
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

      {/* Package Modal */}
      {showPackageModal && (
        <PackageModal
          editingPackage={editingPackage}
          onSave={handleSavePackage}
          onClose={() => {
            setShowPackageModal(false);
            setEditingPackage(null);
          }}
        />
      )}
    </div>
  );
}
