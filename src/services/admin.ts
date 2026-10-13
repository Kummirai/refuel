// src/services/admin.ts

import { api } from "./api";

export interface AdminDriver {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  carRegistration: string;
  carModel: string;
  carYear: string;
  carColor: string;
  verificationStatus: string;
  rating: number;
  totalRequests: number;
  totalSpent: number;
  activeLoan: unknown | null;
  joinedDate: string;
  lastActive: string;
}

export interface AdminDriverProfile {
  fullName: string;
  dateOfBirth: string;
  address: string;
  city: string;
  pincode: string;
  carRegistration: string;
  carRegistrationNumber: string;
  carModel: string;
  carYear: string;
  carColor: string;
  drivingLicenseUrl: string;
  carRegistrationUrl: string;
  profilePhotoUrl: string;
  verificationStatus: string;
  rejectionReason: string | null;
  submittedDate: string;
  verifiedAt: string | null;
  totalRequests: number;
  totalSpent: number;
  rating: number;
  email: string;
  phone: string;
  name: string;
  ownershipStatus: "rent" | "own";
  referenceName: string;
  referencePhone: string;
  carOwnerName: string;
  carOwnerPhone: string;
  carOwnerAddress: string;
  agreeAccuracy: boolean;
  agreeRefTenure: boolean;
  agreeRepayment: boolean;
  agreeEscalation: boolean;
  agreeOwnerContact: boolean;
}

export interface DriversResponse {
  drivers: AdminDriver[];
  recent: any[];
  total: number;
  verified: number;
  pending: number;
  rejected: number;
}

export interface AdminServiceRequest {
  id: string;
  _id: string;
  userId: string;
  type: string;
  amount: number;
  actualAmount: number | null;
  carNumber: string;
  carModel: string;
  fuelType: string | null;
  contactPhone: string;
  driverName: string;
  driverPhone: string;
  driverEmail: string;
  interest: number;
  totalRepayable: number;
  interestRate: number;
  repaymentDays: number;
  dailyPayment: number;
  package: string | null;
  packageDescription: string | null;
  status: string;
  otp: string | null;
  requestDate: string;
  createdAt: string;
  approvedDate: string | null;
  completedDate: string | null;
  popUrl: string | null;
  popPublicId: string | null;
  popUploadedAt: string | null;
  updatedAt: string;
  repaidAmount: number;
  remainingBalance: number;
  isPaid: boolean;
  refueledByManager?: boolean;
}

export interface RequestsResponse {
  requests: AdminServiceRequest[];
  recent: AdminServiceRequest[];
  total: number;
  pending: number;
  approved: number;
  sent: number;
  completed: number;
  rejected: number;
  refueled: number;
  totalRevenue: number;
  totalRepayable: number;
  totalRepaid: number;
}

export interface AdminStats {
  totalDrivers: number;
  pendingVerifications: number;
  verifiedDrivers: number;
  rejectedVerifications: number;
  totalRequests: number;
  pendingRequests: number;
  completedRequests: number;
  totalRevenue: number;
  averageRating: number;
  activeLoans: number;
  totalLoanAmount: number;
  revenueGrowth: number;
}

export interface NotificationCounts {
  verifications: number;
  requests: number;
  repayments: number;
  receipts: number;
}

export interface FuelBudget {
  total: number;
  used: number;
  remaining: number;
  lastReset: string | null;
}

export interface DriverFuelCreditRow {
  userId: string;
  name: string;
  email: string;
  carRegistration: string;
  limit: number;
  used: number;
  remaining: number;
  isDefault: boolean;
}

export interface FuelCreditsResponse {
  defaultLimit: number;
  enabled: boolean;
  weekStart: string;
  weekEnd: string;
  drivers: DriverFuelCreditRow[];
}

export interface Repayment {
  id: string;
  loanId: string;
  driverId: string;
  driverName: string;
  driverEmail: string;
  driverPhone: string;
  carRegistration: string;
  serviceType: string;
  requestedAmount: number;
  actualAmount: number | null;
  amount: number;
  interestRate: number;
  interest: number;
  totalRepayable: number;
  repaidAmount: number;
  remainingAmount: number;
  dueDate: string;
  status: string;
  isPaid: boolean;
  repayments: any[];
  payments: any[];
}

export interface ReceiptRequest {
  id: string;
  userId: string;
  type: string;
  amount: number;
  driverName: string;
  carNumber: string;
  status: string;
  popUrl: string | null;
  totalRepayable: number;
  remainingBalance: number;
}

export interface InvoicesResponse {
  drivers: any[];
  totalDrivers: number;
  totalOutstanding: number;
}

export interface ManagerUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  createdAt: string;
}

export interface AdminSettings {
  general?: Record<string, unknown>;
  services?: Record<string, unknown>;
  notifications?: Record<string, unknown>;
  security?: Record<string, unknown>;
  business?: Record<string, unknown>;
  managerCycle?: Record<string, unknown>;
  fuelCredit?: { defaultLimit?: number; enabled?: boolean };
}

export const adminService = {
  // Drivers
  async getDrivers() {
    return api.get<DriversResponse>("/api/admin/drivers");
  },

  async getDriverProfile(userId: string) {
    return api.get<{ success: boolean; profile: AdminDriverProfile }>(
      "/api/admin/drivers/profile",
      { params: { userId } },
    );
  },

  async deleteDriver(userId: string) {
    return api.post<{ success: boolean }>("/api/admin/drivers/delete", { body: { userId } });
  },

  async verifyDriver(verificationId: string, action: "approve" | "reject", reason?: string) {
    return api.post<{ success: boolean; message: string }>("/api/admin/verify", {
      body: { verificationId, action, reason },
    });
  },

  // Service Requests
  async getRequests(from?: string, to?: string) {
    return api.get<RequestsResponse>("/api/admin/requests", {
      params: { ...(from ? { from } : {}), ...(to ? { to } : {}) },
    });
  },

  async approveRequest(requestId: string, otp: string) {
    return api.post<{ success: boolean; otp: string }>("/api/admin/requests/approve", {
      body: { requestId, otp },
    });
  },

  async rejectRequest(requestId: string, reason?: string) {
    return api.post<{ success: boolean }>("/api/admin/requests/reject", {
      body: { requestId, reason },
    });
  },

  async markRequestSent(requestId: string) {
    return api.post<{ success: boolean }>("/api/admin/requests/sent", { body: { requestId } });
  },

  async completeRequest(requestId: string) {
    return api.post<{ success: boolean }>("/api/admin/requests/complete", { body: { requestId } });
  },

  async deleteRequest(requestId: string) {
    return api.post<{ success: boolean }>("/api/admin/requests/delete", { body: { requestId } });
  },

  // Stats & Notifications
  async getStats() {
    return api.get<AdminStats>("/api/admin/stats");
  },

  async getNotificationCounts() {
    return api.get<NotificationCounts>("/api/admin/notifications/count");
  },

  // Fuel Budget
  async getFuelBudget(from?: string, to?: string) {
    return api.get<FuelBudget>("/api/admin/dashboard/fuel-budget", {
      params: { ...(from ? { from } : {}), ...(to ? { to } : {}) },
    });
  },

  async setFuelBudget(total: number) {
    return api.post<{ success: boolean; total: number }>("/api/admin/dashboard/fuel-budget", {
      body: { total },
    });
  },

  // Fuel Credits (per-driver weekly limit)
  async getFuelCredits() {
    return api.get<FuelCreditsResponse>("/api/admin/fuel-credits");
  },

  async setDriverFuelCredit(userId: string, limit: number | null) {
    return api.put<{ success: boolean; userId: string; limit: number | null }>(
      "/api/admin/fuel-credits",
      { body: { userId, limit } },
    );
  },

  async setDefaultFuelCredit(limit: number) {
    return api.put<{ success: boolean; defaultLimit: number }>("/api/admin/fuel-credits", {
      body: { limit, isDefaultLimit: true },
    });
  },

  // Repayments
  async getRepayments() {
    return api.get<Repayment[]>("/api/admin/repayments");
  },

  async recordPayment(data: { repaymentId: string; amount: number; method?: string; reference?: string }) {
    return api.post<{ success: boolean }>("/api/admin/repayments/pay", { body: data });
  },

  async completeRepayment(repaymentId: string) {
    return api.post<{ success: boolean }>("/api/admin/repayments/complete", { body: { repaymentId } });
  },

  async addInterest(data: { loanId: string; interestAmount?: number; interestRate?: number }) {
    return api.post<{
      success: boolean; interestAmount: number; interestRate: number;
      previousRemainingBalance: number; newRemainingBalance: number; newTotalRepayable: number;
    }>("/api/admin/repayments/add-interest", { body: data });
  },

  async approveBulkProof(proofId: string, amount: number) {
    return api.post<{
      totalAllocated?: number; unallocated?: number; fullyPaidCount?: number; pendingCount?: number;
    }>("/api/admin/repayment-proofs/approve-bulk", { body: { proofId, amount } });
  },

  async correctRepayment(actions: Array<{ type: string; loanId: string; paymentId?: string; data?: Record<string, unknown> }>) {
    return api.post<{ results?: Array<{ repaidAmount?: number; remainingBalance?: number }> }>(
      "/api/admin/repayments/correct",
      { body: { actions } },
    );
  },

  async getAllDiscounts() {
    return api.get<{ discounts?: Record<string, number> }>("/api/admin/invoices/discount");
  },

  async getRepaymentHistory(driverId?: string, date?: string) {
    return api.get<any[]>("/api/admin/repayments/history", {
      params: { ...(driverId ? { driverId } : {}), ...(date ? { date } : {}) },
    });
  },

  // Receipts
  async getReceipts(status?: string) {
    return api.get<ReceiptRequest[]>("/api/admin/receipts", {
      params: { ...(status ? { status } : {}) },
    });
  },

  async verifyReceipt(requestId: string) {
    return api.post<{ success: boolean }>("/api/admin/receipts/verify", {
      body: { requestId, action: "verify" },
    });
  },

  async rejectReceipt(requestId: string, reason: string) {
    return api.post<{ success: boolean }>("/api/admin/receipts/reject", { body: { requestId, reason } });
  },

  async correctReceipt(requestId: string, updates: Record<string, unknown>) {
    return api.post<{ success: boolean }>("/api/admin/receipts/correct", { body: { requestId, updates } });
  },

  // Invoices
  async getInvoices(params?: Record<string, string>) {
    return api.get<InvoicesResponse>("/api/admin/invoices", { params });
  },

  async sendInvoices(data?: Record<string, string>) {
    return api.post<{ success: boolean; sent: number }>("/api/admin/invoices/send", { body: data });
  },

  async sendSingleInvoice(email: string, data?: Record<string, string>) {
    return api.post<{ success: boolean }>("/api/admin/invoices/send-single", {
      body: { ...data, email },
    });
  },

  async getInvoiceHistory() {
    return api.get<any[]>("/api/admin/invoices/history");
  },

  // Settings
  async getSettings() {
    return api.get<AdminSettings>("/api/admin/settings");
  },

  async updateSettings(settings: Partial<AdminSettings>) {
    return api.put<{ success: boolean }>("/api/admin/settings", { body: settings });
  },

  // Managers
  async getManagers() {
    return api.get<ManagerUser[]>("/api/admin/managers");
  },

  async updateManagerRole(userId: string, role: "manager" | "driver") {
    return api.put<{ success: boolean }>("/api/admin/managers", { body: { userId, role } });
  },

  // Driver View
  async getDriverView() {
    return api.get<{ drivers: any[] }>("/api/admin/driver-view");
  },

  // Upload
  async uploadFile(formData: FormData) {
    return api.upload<{ url: string; publicId: string }>("/api/driver/upload", formData);
  },
};
