// src/app/admin/layout.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import useSWR from "swr";
import { fetcher } from "@/lib/fetch";
import {
  LayoutDashboard,
  Users,
  DollarSign,
  ClipboardList,
  Settings,
  LogOut,
  Menu,
  X,
  Loader2,
  Bell,
  Shield,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  FileText,
  Receipt,
  Send,
} from "lucide-react";
import { formatMoney } from "@/lib/money";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, isPending } = authClient.useSession();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // SWR: batch all notification counts into one request, refresh every 60s
  const { data: counts, mutate: refreshCounts } = useSWR(
    isAuthorized ? "/api/admin/notifications/count" : null,
    fetcher,
    { refreshInterval: 30_000, dedupingInterval: 15_000 },
  );

  const pendingVerificationsCount = counts?.verifications ?? 0;
  const pendingRequestsCount = counts?.requests ?? 0;
  const pendingRepaymentsCount = counts?.repayments ?? 0;
  const pendingReceiptsCount = counts?.receipts ?? 0;

  // Store full data for detailed view
  const [pendingVerifications, setPendingVerifications] = useState<any[]>([]);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [pendingRepayments, setPendingRepayments] = useState<any[]>([]);
  const [pendingReceipts, setPendingReceipts] = useState<any[]>([]);
  const pendingDetailsFetched = useRef(false);

  const fetchPendingDetails = async () => {
    try {
      const [verificationsRes, requestsRes, repaymentsRes, receiptsRes] =
        await Promise.all([
          fetch("/api/admin/verifications/pending?limit=5"),
          fetch("/api/admin/requests?status=pending&limit=5"),
          fetch("/api/admin/repayments?status=pending&limit=5"),
          fetch("/api/admin/receipts?status=pending&limit=5"),
        ]);

      const verifications = await verificationsRes.json();
      const requests = await requestsRes.json();
      const repayments = await repaymentsRes.json();
      const receipts = await receiptsRes.json();

      setPendingVerifications(verifications.data || verifications || []);
      setPendingRequests(requests.data || requests || []);
      setPendingRepayments(repayments.data || repayments || []);
      setPendingReceipts(receipts.data || receipts || []);
    } catch (error) {
      console.error("Error fetching pending details:", error);
    }
  };

  // Fetch details only when notification modal opens
  useEffect(() => {
    if (isAuthorized && showNotifications && !pendingDetailsFetched.current) {
      pendingDetailsFetched.current = true;
      fetchPendingDetails();
    } else if (!showNotifications) {
      pendingDetailsFetched.current = false;
    }
  }, [isAuthorized, showNotifications]);

  // Listen for manual refresh events (e.g. after approve/reject)
  useEffect(() => {
    if (!isAuthorized) return;
    const handleRefresh = () => {
      refreshCounts();
      if (showNotifications) fetchPendingDetails();
    };
    window.addEventListener("refreshAdminCounts", handleRefresh);
    return () => window.removeEventListener("refreshAdminCounts", handleRefresh);
  }, [isAuthorized, showNotifications, refreshCounts]);

  useEffect(() => {
    if (!isPending) {
      checkAuth();
    }
  }, [session, isPending]);

  const checkAuth = () => {
    if (!session) {
      router.push("/auth/sign-in");
      return;
    }

    const user = session.user as any;
    if (user?.role !== "admin") {
      router.push("/");
      return;
    }

    setIsAuthorized(true);
  };

  const handleLogout = async () => {
    await authClient.signOut();
    router.push("/");
  };

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-[#eafde7] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-[#3A7717] animate-spin mx-auto" />
          <p className="mt-4 text-[#01312D] font-medium">Verifying access...</p>
        </div>
      </div>
    );
  }

  const user = session?.user as any;
  const totalNotifications =
    pendingVerificationsCount +
    pendingRequestsCount +
    pendingRepaymentsCount +
    pendingReceiptsCount;

  const navItems = [
    {
      icon: LayoutDashboard,
      label: "Dashboard",
      path: "/admin/dashboard",
      active: pathname === "/admin/dashboard",
      badge: null,
    },
    {
      icon: Users,
      label: "Verifications",
      path: "/admin/verifications",
      active: pathname === "/admin/verifications",
      badge: pendingVerificationsCount,
      badgeColor: "bg-yellow-500",
    },
    {
      icon: ClipboardList,
      label: "Requests",
      path: "/admin/service-requests",
      active: pathname === "/admin/service-requests",
      badge: pendingRequestsCount,
      badgeColor: "bg-blue-500",
    },
    {
      icon: Receipt,
      label: "Receipts",
      path: "/admin/receipts",
      active: pathname === "/admin/receipts",
      badge: pendingReceiptsCount,
      badgeColor: "bg-purple-500",
    },
    {
      icon: DollarSign,
      label: "Repayments",
      path: "/admin/repayments",
      active: pathname === "/admin/repayments",
      badge: pendingRepaymentsCount,
      badgeColor: "bg-green-500",
    },
    {
      icon: Send,
      label: "Invoices",
      path: "/admin/invoices",
      active: pathname === "/admin/invoices",
      badge: null,
    },
    {
      icon: Settings,
      label: "Settings",
      path: "/admin/settings",
      active: pathname === "/admin/settings",
      badge: null,
    },
  ];

  // Notification Modal Component
  const NotificationModal = () => {
    if (!showNotifications) return null;

    const handleNavigate = (path: string) => {
      setShowNotifications(false);
      router.push(path);
    };

    return (
      <>
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          onClick={() => setShowNotifications(false)}
        />
        <div className="fixed top-16 right-4 z-50 w-96 max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-2xl border border-[#bff202]/20 overflow-hidden animate-in slide-in-from-top-2 duration-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#01312D] to-[#3A7717] p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-white" />
                <h2 className="text-white font-bold">Notifications</h2>
              </div>
              <button
                onClick={() => setShowNotifications(false)}
                className="text-white/70 hover:text-white transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <p className="text-white/70 text-sm mt-1">
              You have {totalNotifications} pending{" "}
              {totalNotifications === 1 ? "item" : "items"} to review
            </p>
          </div>

          {/* Content */}
          <div className="max-h-[70vh] overflow-y-auto divide-y divide-gray-100">
            {totalNotifications === 0 ? (
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <p className="text-gray-500 font-medium">All caught up!</p>
                <p className="text-xs text-gray-400 mt-1">
                  No pending items to review
                </p>
              </div>
            ) : (
              <>
                {/* Verifications Section */}
                {pendingVerificationsCount > 0 && (
                  <div className="p-4 hover:bg-yellow-50/50 transition-colors">
                    <button
                      onClick={() => handleNavigate("/admin/verifications")}
                      className="w-full text-left"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center flex-shrink-0">
                          <Users className="w-5 h-5 text-yellow-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-[#01312D]">
                              Verifications
                            </span>
                            <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">
                              {pendingVerificationsCount} pending
                            </span>
                          </div>
                          <p className="text-sm text-gray-500 mt-1">
                            {pendingVerificationsCount} driver
                            {pendingVerificationsCount !== 1 ? "s" : ""} need
                            {pendingVerificationsCount === 1 ? "s" : ""}{" "}
                            document verification
                          </p>
                          {pendingVerifications
                            .slice(0, 2)
                            .map((v: any, idx) => (
                              <div
                                key={idx}
                                className="mt-2 text-xs text-gray-400 flex items-center gap-2"
                              >
                                <Clock className="w-3 h-3" />
                                <span>
                                  {v.driverName || v.name || "Driver"} -
                                  Submitted{" "}
                                  {v.submittedAt
                                    ? new Date(
                                        v.submittedAt,
                                      ).toLocaleDateString()
                                    : "recently"}
                                </span>
                              </div>
                            ))}
                          {pendingVerificationsCount > 2 && (
                            <p className="text-xs text-yellow-600 mt-1">
                              +{pendingVerificationsCount - 2} more
                            </p>
                          )}
                        </div>
                      </div>
                    </button>
                  </div>
                )}

                {/* Service Requests Section */}
                {pendingRequestsCount > 0 && (
                  <div className="p-4 hover:bg-blue-50/50 transition-colors">
                    <button
                      onClick={() => handleNavigate("/admin/service-requests")}
                      className="w-full text-left"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                          <ClipboardList className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-[#01312D]">
                              Service Requests
                            </span>
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                              {pendingRequestsCount} pending
                            </span>
                          </div>
                          <p className="text-sm text-gray-500 mt-1">
                            {pendingRequestsCount} service request
                            {pendingRequestsCount !== 1 ? "s" : ""} awaiting
                            approval
                          </p>
                          {Array.isArray(pendingRequests) &&
                            pendingRequests.slice(0, 2).map((req: any, idx) => (
                              <div
                                key={idx}
                                className="mt-2 text-xs text-gray-400 flex items-center gap-2"
                              >
                                <Clock className="w-3 h-3" />
                                <span>
                                  {req.serviceType || "Service"} -{" "}
                                  {req.driverName || "Driver"} •{" "}
                                  {formatMoney(req.amount)}
                                </span>
                              </div>
                            ))}
                          {pendingRequestsCount > 2 && (
                            <p className="text-xs text-blue-600 mt-1">
                              +{pendingRequestsCount - 2} more
                            </p>
                          )}
                        </div>
                      </div>
                    </button>
                  </div>
                )}

                {/* Repayments Section */}
                {pendingRepaymentsCount > 0 && (
                  <div className="p-4 hover:bg-green-50/50 transition-colors">
                    <button
                      onClick={() => handleNavigate("/admin/repayments")}
                      className="w-full text-left"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                          <DollarSign className="w-5 h-5 text-green-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-[#01312D]">
                              Repayments
                            </span>
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                              {pendingRepaymentsCount} pending
                            </span>
                          </div>
                          <p className="text-sm text-gray-500 mt-1">
                            {pendingRepaymentsCount} repayment
                            {pendingRepaymentsCount !== 1 ? "s" : ""} with
                            outstanding balances
                          </p>
                          {pendingRepayments
                            .slice(0, 2)
                            .map((rep: any, idx) => (
                              <div
                                key={idx}
                                className="mt-2 text-xs text-gray-400 flex items-center gap-2"
                              >
                                <AlertCircle className="w-3 h-3" />
                                <span>
                                  {rep.driverName || "Driver"} -{" "}
                                  {formatMoney(rep.remainingAmount)} remaining •
                                  Due{" "}
                                  {rep.dueDate
                                    ? new Date(rep.dueDate).toLocaleDateString()
                                    : "N/A"}
                                </span>
                              </div>
                            ))}
                          {pendingRepaymentsCount > 2 && (
                            <p className="text-xs text-green-600 mt-1">
                              +{pendingRepaymentsCount - 2} more
                            </p>
                          )}
                        </div>
                      </div>
                    </button>
                  </div>
                )}

                {/* Receipts Section */}
                {pendingReceiptsCount > 0 && (
                  <div className="p-4 hover:bg-purple-50/50 transition-colors">
                    <button
                      onClick={() => handleNavigate("/admin/receipts")}
                      className="w-full text-left"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                          <FileText className="w-5 h-5 text-purple-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-[#01312D]">
                              Receipts
                            </span>
                            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                              {pendingReceiptsCount} pending
                            </span>
                          </div>
                          <p className="text-sm text-gray-500 mt-1">
                            {pendingReceiptsCount} receipt
                            {pendingReceiptsCount !== 1 ? "s" : ""} to approve
                          </p>
                          {pendingReceipts
                            .slice(0, 2)
                            .map((receipt: any, idx) => (
                              <div
                                key={idx}
                                className="mt-2 text-xs text-gray-400 flex items-center gap-2"
                              >
                                <AlertCircle className="w-3 h-3" />
                                <span>
                                  {receipt.driverName || "Driver"} -{" "}
                                  {formatMoney(receipt.amount)} • Due{" "}
                                  {receipt.dueDate
                                    ? new Date(
                                        receipt.dueDate,
                                      ).toLocaleDateString()
                                    : "N/A"}
                                </span>
                              </div>
                            ))}
                          {pendingReceiptsCount > 2 && (
                            <p className="text-xs text-purple-600 mt-1">
                              +{pendingReceiptsCount - 2} more
                            </p>
                          )}
                        </div>
                      </div>
                    </button>
                  </div>
                )}

                {/* Footer */}
                <div className="p-3 bg-gray-50 border-t border-gray-100">
                  <div className="grid grid-cols-3 gap-2">
                    {pendingVerificationsCount > 0 && (
                      <button
                        onClick={() => handleNavigate("/admin/verifications")}
                        className="text-center p-2 rounded-lg hover:bg-yellow-100 transition-colors"
                      >
                        <Users className="w-4 h-4 text-yellow-600 mx-auto" />
                        <span className="text-xs text-gray-600 mt-1 block">
                          Verifications
                        </span>
                      </button>
                    )}
                    {pendingRequestsCount > 0 && (
                      <button
                        onClick={() =>
                          handleNavigate("/admin/service-requests")
                        }
                        className="text-center p-2 rounded-lg hover:bg-blue-100 transition-colors"
                      >
                        <ClipboardList className="w-4 h-4 text-blue-600 mx-auto" />
                        <span className="text-xs text-gray-600 mt-1 block">
                          Requests
                        </span>
                      </button>
                    )}
                    {pendingRepaymentsCount > 0 && (
                      <button
                        onClick={() => handleNavigate("/admin/repayments")}
                        className="text-center p-2 rounded-lg hover:bg-green-100 transition-colors"
                      >
                        <DollarSign className="w-4 h-4 text-green-600 mx-auto" />
                        <span className="text-xs text-gray-600 mt-1 block">
                          Repayments
                        </span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Close button for mobile */}
                <div className="p-3 border-t border-gray-100 lg:hidden">
                  <button
                    onClick={() => setShowNotifications(false)}
                    className="w-full py-2 bg-gray-100 text-gray-600 rounded-lg font-semibold text-sm"
                  >
                    Close
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </>
    );
  };

  return (
    <div className="min-h-screen bg-[#eafde7]">
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-3 bg-[#01312D] rounded-lg text-white shadow-lg active:scale-95 transition-all duration-200"
      >
        {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 left-0 h-full w-72 bg-[#01312D] z-40 transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        } lg:translate-x-0`}
      >
        <div className="p-5 h-full flex flex-col">
          <div className="flex items-center gap-2 mb-8 pt-10 lg:pt-5">
            <div className="w-10 h-10 bg-[#bff202] rounded-xl flex items-center justify-center">
              <Shield className="w-5 h-5 text-[#01312D]" />
            </div>
            <div>
              <h1 className="text-white font-bold text-xl">Kapuka</h1>
              <p className="text-[#72bf00] text-xs">Admin Panel</p>
            </div>
          </div>

          <nav className="space-y-2 sm:space-y-1 flex-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.path}
                  onClick={() => {
                    router.push(item.path);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                    item.active
                      ? "bg-[#bff202] text-[#01312D] shadow-md"
                      : "text-white/70 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium flex-1 text-left">
                    {item.label}
                  </span>
                  {item.badge !== null && item.badge > 0 && (
                    <span
                      className={`${item.badgeColor} text-white text-xs font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center`}
                    >
                      {item.badge > 99 ? "99+" : item.badge}
                    </span>
                  )}
                  {item.active && (
                    <div className="w-1.5 h-1.5 rounded-full bg-[#01312D]" />
                  )}
                </button>
              );
            })}
          </nav>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white/70 hover:bg-red-500/20 hover:text-red-500 transition-all duration-200 mt-4"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      <div className="lg:ml-72">
        <header className="bg-white border-b border-[#bff202]/20 sticky top-0 z-30 shadow-sm">
          <div className="px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center">
            <h2 className="text-xl font-bold text-[#01312D] hidden lg:block">
              {navItems.find((i) => i.active)?.label || "Dashboard"}
            </h2>
            <div className="flex items-center gap-2 sm:gap-4 ml-auto">
              <button
                className="relative p-2 rounded-full hover:bg-[#eafde7] transition-all duration-200"
                onClick={() => setShowNotifications(!showNotifications)}
              >
                <Bell className="w-5 h-5 text-[#3A7717]" />
                {totalNotifications > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 animate-pulse">
                    {totalNotifications > 99 ? "99+" : totalNotifications}
                  </span>
                )}
              </button>

              <button
                className="flex items-center gap-2 sm:gap-3 p-1.5 rounded-lg hover:bg-[#eafde7] transition-all duration-200"
                onClick={() => router.push("#")}
              >
                <div className="w-8 h-8 bg-gradient-to-r from-[#01312D] to-[#3A7717] rounded-full flex items-center justify-center shadow-md">
                  <span className="text-white font-bold text-sm">
                    {user?.name?.charAt(0) || "A"}
                  </span>
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-semibold text-[#01312D]">
                    {user?.name || "Admin"}
                  </p>
                  <p className="text-xs text-gray-500">Administrator</p>
                </div>
              </button>
            </div>
          </div>
        </header>

        <main className="p-4 sm:p-6">{children}</main>
      </div>

      {/* Notification Modal */}
      <NotificationModal />
    </div>
  );
}
