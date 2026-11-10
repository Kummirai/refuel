// src/services/manager.ts

import { api } from "./api";

export interface ManagerRequest {
  id: string;
  _id: string;
  userId: string;
  type: string;
  amount: number;
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
  status: string;
  requestDate: string;
  approvedDate: string | null;
  otp: string;
  refueledByManager?: boolean;
}

export interface ManagerStats {
  totalRequests: number;
  pendingRequests: number;
  completedRequests: number;
  totalFuelAmount: number;
}

export const managerService = {
  async getRequests(status: string) {
    return api.get<ManagerRequest[]>("/api/manager/requests", {
      params: { status },
    });
  },

  async refuelRequest(requestId: string, otp: string) {
    return api.post<{ success: boolean; message: string }>("/api/manager/requests/refuel", {
      body: { requestId, otp },
    });
  },

  async getStats() {
    return api.get<ManagerStats>("/api/manager/stats");
  },

  async getCycle() {
    return api.get<{ startDate: string; endDate: string }>("/api/manager/cycle");
  },
};
