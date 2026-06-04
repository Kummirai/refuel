// src/services/driver.ts

import { api } from "./api";

export interface ServiceRequest {
  id: string;
  _id: string;
  userId: string;
  type: string;
  amount: number;
  fuelType: string | null;
  carNumber: string;
  carModel: string;
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
  repaidAmount: number;
  remainingBalance: number;
  isPaid: boolean;
  hasPendingRepayment: boolean;
  pendingRepaymentAmount: number;
  pendingRepaymentStatus: string | null;
  repayments: RepaymentRecord[];
}

export interface RepaymentRecord {
  id: string;
  _id: string;
  amount: number;
  status: "pending" | "approved" | "rejected";
  submittedAt: string;
  approvedAt?: string;
  proofUrl?: string;
  proofPublicId?: string;
  remainingBalance?: number;
  isFullyPaid?: boolean;
}

export interface DriverProfile {
  fullName: string;
  dateOfBirth: string;
  address: string;
  city: string;
  pincode: string;
  carRegistrationNumber: string;
  carModel: string;
  carYear: string;
  carColor: string;
  drivingLicenseUrl: string;
  carRegistrationUrl: string;
  profilePhotoUrl: string;
  ownershipStatus: "own" | "rent";
  referenceName: string;
  referencePhone: string;
  carOwnerName: string;
  carOwnerPhone: string;
  carOwnerAddress: string;
  agreeAccuracy: boolean;
  agreeRefTenure: boolean;
  agreeOwnerContact: boolean;
  agreeRepayment: boolean;
  agreeEscalation: boolean;
  verificationStatus: string;
  rejectionReason: string | null;
  rating: number;
  totalRequests: number;
  totalSpent: number;
  email: string;
  phone: string;
  name: string;
}

export const driverService = {
  async getProfile(userId: string) {
    return api.get<DriverProfile>("/api/driver/profile", { params: { userId } });
  },

  async getRequests(userId: string) {
    return api.get<ServiceRequest[]>("/api/driver/requests", { params: { userId } });
  },

  async createRequest(data: {
    userId: string;
    type: string;
    amount: number;
    fuelType?: string;
    repaymentDays?: number;
    package?: string;
    packageDescription?: string;
    contactPhone: string;
    carNumber: string;
    carModel?: string;
    driverName?: string;
    driverPhone?: string;
    driverEmail?: string;
    interest?: number;
    totalRepayable?: number;
    interestRate?: number;
    dailyPayment?: number;
    hasReceipt?: boolean;
  }) {
    return api.post<{ success: boolean; requestId: string }>("/api/driver/requests", { body: data });
  },

  async submitVerification(data: {
    userId: string;
    fullName: string;
    dateOfBirth: string;
    address: string;
    city: string;
    pincode: string;
    carRegistrationNumber: string;
    carModel: string;
    carYear: string;
    carColor: string;
    drivingLicenseUrl: string;
    carRegistrationUrl: string;
    profilePhotoUrl: string;
    ownershipStatus: "own" | "rent";
    referenceName?: string;
    referencePhone?: string;
    carOwnerName?: string;
    carOwnerPhone?: string;
    carOwnerAddress?: string;
    agreeAccuracy: boolean;
    agreeRefTenure: boolean;
    agreeOwnerContact: boolean;
    agreeRepayment: boolean;
    agreeEscalation: boolean;
  }) {
    return api.post<{ success: boolean; message: string }>("/api/driver/verify", { body: data });
  },

  async updateProfile(userId: string, data: Record<string, unknown>) {
    return api.patch<{ success: boolean }>("/api/driver/profile", { body: { userId, ...data } });
  },

  async changePassword(data: { currentPassword: string; newPassword: string; userId: string }) {
    return api.post<{ success: boolean }>("/api/driver/change-password", { body: data });
  },

  async updateCredentials(data: { userId: string; phone: string }) {
    return api.post<{ success: boolean }>("/api/driver/update-credentials", { body: data });
  },

  async updateVehicle(data: { userId: string; carRegistrationNumber: string; carModel: string; carYear: string; carColor: string }) {
    return api.post<{ success: boolean }>("/api/driver/update-vehicle", { body: data });
  },

  async submitRepaymentProof(data: {
    requestIds: string[];
    amount: number;
    remainingBalance: number;
    isFullyPaid: boolean;
    proofUrl: string;
    proofPublicId?: string;
  }) {
    return api.post<{ success: boolean; message: string }>("/api/driver/repayment-proof", { body: data as any });
  },

  async submitPOP(data: {
    requestId: string;
    actualAmount: number;
    popUrl: string;
    popPublicId?: string;
    interest: number;
    totalRepayable: number;
    dailyPayment: number;
    repaymentDays: number;
  }) {
    return api.post<{ success: boolean; message: string }>("/api/driver/requests/pop", { body: data as any });
  },

  async getRepayments(requestId: string) {
    return api.get<RepaymentRecord[]>("/api/driver/repayment-proof/getproof", { params: { requestId } });
  },

  async uploadFile(formData: FormData) {
    return api.upload<{ url: string; publicId: string }>("/api/driver/upload", formData);
  },
};
