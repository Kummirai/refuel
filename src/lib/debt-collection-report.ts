export interface CollateralRecord {
  itemName?: string;
  category?: string;
  brand?: string;
  model?: string;
  purchaseYear?: number;
  color?: string;
  condition?: string;
  serialNumber?: string;
  images?: string[];
}

export interface DebtRecord {
  requestId: string;
  type: "fuel" | "carwash" | "cash";
  amount: number;
  interest: number;
  totalRepayable: number;
  repaymentDays: number;
  dailyPayment: number;
  requestDate: string;
  approvalDate?: string;
  status: string;
  collateral?: CollateralRecord;
  otp?: string;
}

export interface DebtCollectionReport {
  reportGenerated: string;
  driver: {
    fullName: string;
    idNumber?: string;
    dateOfBirth?: string;
    phone: string;
    email: string;
    physicalAddress?: string;
    carRegistrationNumber: string;
    carModel: string;
  };
  banking: {
    bankName?: string;
    accountHolder?: string;
    accountNumber?: string;
    branchCode?: string;
  };
  debts: DebtRecord[];
  totalOutstanding: number;
  totalInterestAccrued: number;
  totalCollateralValue?: number;
}

export function generateDebtCollectionReport(
  driverProfile: {
    fullName: string;
    idNumber?: string;
    dateOfBirth?: string;
    phone: string;
    email: string;
    physicalAddress?: string;
    carRegistrationNumber: string;
    carModel: string;
    bankName?: string;
    accountHolder?: string;
    accountNumber?: string;
    branchCode?: string;
  },
  debts: DebtRecord[],
): DebtCollectionReport {
  const totalOutstanding = debts.reduce(
    (sum, d) => sum + (d.status === "approved" || d.status === "sent" ? d.totalRepayable : 0),
    0,
  );
  const totalInterestAccrued = debts.reduce(
    (sum, d) => sum + (d.status === "approved" || d.status === "sent" ? d.interest : 0),
    0,
  );

  return {
    reportGenerated: new Date().toISOString(),
    driver: {
      fullName: driverProfile.fullName,
      idNumber: driverProfile.idNumber,
      dateOfBirth: driverProfile.dateOfBirth,
      phone: driverProfile.phone,
      email: driverProfile.email,
      physicalAddress: driverProfile.physicalAddress,
      carRegistrationNumber: driverProfile.carRegistrationNumber,
      carModel: driverProfile.carModel,
    },
    banking: {
      bankName: driverProfile.bankName,
      accountHolder: driverProfile.accountHolder,
      accountNumber: driverProfile.accountNumber,
      branchCode: driverProfile.branchCode,
    },
    debts,
    totalOutstanding,
    totalInterestAccrued,
  };
}

export function formatDebtCollectionReport(report: DebtCollectionReport): string {
  const lines: string[] = [];

  lines.push("=".repeat(60));
  lines.push("           DEBT COLLECTION REPORT");
  lines.push("=".repeat(60));
  lines.push(`Generated: ${report.reportGenerated}`);
  lines.push("");

  lines.push("-".repeat(60));
  lines.push("DRIVER INFORMATION");
  lines.push("-".repeat(60));
  lines.push(`  Full Name:         ${report.driver.fullName}`);
  if (report.driver.idNumber) lines.push(`  ID/Passport:       ${report.driver.idNumber}`);
  if (report.driver.dateOfBirth) lines.push(`  Date of Birth:     ${report.driver.dateOfBirth}`);
  lines.push(`  Phone:             ${report.driver.phone}`);
  lines.push(`  Email:             ${report.driver.email}`);
  if (report.driver.physicalAddress) lines.push(`  Address:           ${report.driver.physicalAddress}`);
  lines.push(`  Car Registration:  ${report.driver.carRegistrationNumber}`);
  lines.push(`  Car Model:         ${report.driver.carModel}`);
  lines.push("");

  lines.push("-".repeat(60));
  lines.push("BANKING DETAILS");
  lines.push("-".repeat(60));
  if (report.banking.bankName) {
    lines.push(`  Bank:              ${report.banking.bankName}`);
    lines.push(`  Account Holder:    ${report.banking.accountHolder || "N/A"}`);
    lines.push(`  Account Number:    ${report.banking.accountNumber || "N/A"}`);
    lines.push(`  Branch Code:       ${report.banking.branchCode || "N/A"}`);
  } else {
    lines.push("  No banking details on file");
  }
  lines.push("");

  lines.push("-".repeat(60));
  lines.push("OUTSTANDING DEBTS");
  lines.push("-".repeat(60));
  lines.push(`  Total Outstanding:  R${report.totalOutstanding.toFixed(2)}`);
  lines.push(`  Total Interest:     R${report.totalInterestAccrued.toFixed(2)}`);
  lines.push("");

  lines.push("-".repeat(60));
  lines.push("DEBT BREAKDOWN");
  lines.push("-".repeat(60));

  for (const debt of report.debts) {
    if (debt.status !== "approved" && debt.status !== "sent") continue;

    lines.push(`  Request ID:      ${debt.requestId}`);
    lines.push(`  Type:            ${debt.type.toUpperCase()}`);
    lines.push(`  Amount:          R${debt.amount.toFixed(2)}`);
    lines.push(`  Interest:        R${debt.interest.toFixed(2)}`);
    lines.push(`  Total Repayable: R${debt.totalRepayable.toFixed(2)}`);
    lines.push(`  Daily Payment:   R${debt.dailyPayment.toFixed(2)}/day`);
    lines.push(`  Repayment Days:  ${debt.repaymentDays} days`);
    lines.push(`  Request Date:    ${debt.requestDate}`);
    if (debt.approvalDate) lines.push(`  Approval Date:   ${debt.approvalDate}`);
    lines.push(`  Status:          ${debt.status}`);

    if (debt.collateral) {
      lines.push(`  Collateral:`);
      lines.push(`    Item:        ${debt.collateral.itemName || "N/A"}`);
      lines.push(`    Category:    ${debt.collateral.category || "N/A"}`);
      if (debt.collateral.brand) lines.push(`    Brand:       ${debt.collateral.brand}`);
      if (debt.collateral.model) lines.push(`    Model:       ${debt.collateral.model}`);
      if (debt.collateral.serialNumber) lines.push(`    Serial/IMEI: ${debt.collateral.serialNumber}`);
      if (debt.collateral.condition) lines.push(`    Condition:   ${debt.collateral.condition}`);
      if (debt.collateral.images?.length) lines.push(`    Photos:      ${debt.collateral.images.length} image(s) on file`);
    }
    lines.push("");
  }

  lines.push("=".repeat(60));
  lines.push("END OF REPORT");
  lines.push("=".repeat(60));

  return lines.join("\n");
}
