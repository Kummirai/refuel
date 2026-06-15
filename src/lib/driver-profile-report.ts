const formatMoney = (value: number): string =>
  `R${value.toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const formatDate = (date: string | Date): string =>
  new Date(date).toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

const formatDateTime = (date: string | Date): string =>
  new Date(date).toLocaleString("en-ZA", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

interface Collateral {
  itemName?: string;
  category?: string;
  brand?: string;
  model?: string;
  serialNumber?: string;
  condition?: string;
  purchaseYear?: number;
  color?: string;
  images?: string[];
}

interface DebtRecord {
  id: string;
  type: string;
  amount: number;
  interest: number;
  totalRepayable: number;
  repaymentDays: number;
  dailyPayment: number;
  status: string;
  requestDate: string;
  approvalDate?: string;
  otp?: string;
  collateral?: Collateral;
}

interface ProfileData {
  fullName?: string;
  phone?: string;
  email?: string;
  dateOfBirth?: string;
  city?: string;
  pincode?: string;
  physicalAddress?: string;
  totalRequests?: number;
  totalSpent?: number;
  carRegistrationNumber?: string;
  carModel?: string;
  carYear?: string;
  carColor?: string;
  ownershipStatus?: string;
  carOwnerName?: string;
  carOwnerPhone?: string;
  carOwnerAddress?: string;
  verificationStatus?: string;
  verifiedAt?: string;
  referenceName?: string;
  referencePhone?: string;
  bankName?: string;
  accountHolder?: string;
  accountNumber?: string;
  branchCode?: string;
  profilePhotoUrl?: string;
  drivingLicenseUrl?: string;
  carRegistrationUrl?: string;
}

interface ReportData {
  profile: ProfileData | null;
  debts: DebtRecord[];
  totals: { totalOutstanding: number; totalInterest: number; count: number };
}

const globalStyles = `
  @page {
    size: A4;
    margin: 20mm 18mm 25mm 18mm;
  }

  * { margin: 0; padding: 0; box-sizing: border-box; }

  body {
    font-family: 'Georgia', 'Times New Roman', 'Palatino', serif;
    font-size: 11pt;
    line-height: 1.6;
    color: #1a1a1a;
    background: #ffffff;
    padding: 0;
    -webkit-font-smoothing: antialiased;
  }

  .page {
    max-width: 750px;
    margin: 0 auto;
    padding: 0;
  }

  /* ── Letterhead ── */
  .letterhead {
    text-align: center;
    padding-bottom: 18px;
    margin-bottom: 24px;
    border-bottom: 3px solid #1a3a2a;
  }
  .letterhead .company {
    font-family: 'Inter', -apple-system, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
    font-size: 22pt;
    font-weight: 700;
    color: #1a3a2a;
    letter-spacing: 1.5px;
    text-transform: uppercase;
  }
  .letterhead .divider {
    width: 80px;
    height: 2px;
    background: #bff202;
    margin: 8px auto 10px;
  }
  .letterhead .tagline {
    font-family: 'Inter', -apple-system, 'Segoe UI', Arial, sans-serif;
    font-size: 9pt;
    color: #5a6a5a;
    letter-spacing: 2px;
    text-transform: uppercase;
  }

  /* ── Document Header ── */
  .doc-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    margin-bottom: 28px;
    padding-bottom: 14px;
    border-bottom: 1px solid #d0d5d0;
  }
  .doc-header .doc-title {
    font-family: 'Inter', -apple-system, 'Segoe UI', Arial, sans-serif;
    font-size: 16pt;
    font-weight: 700;
    color: #1a3a2a;
    letter-spacing: 0.3px;
  }
  .doc-header .doc-meta {
    text-align: right;
    font-size: 8.5pt;
    color: #6b7a6b;
    line-height: 1.5;
    font-family: 'Inter', -apple-system, 'Segoe UI', Arial, sans-serif;
  }
  .doc-header .doc-meta strong {
    color: #1a3a2a;
  }

  /* ── Sections ── */
  .section {
    margin-bottom: 22px;
  }
  .section-heading {
    font-family: 'Inter', -apple-system, 'Segoe UI', Arial, sans-serif;
    font-size: 11pt;
    font-weight: 700;
    color: #1a3a2a;
    letter-spacing: 0.5px;
    text-transform: uppercase;
    padding-bottom: 6px;
    margin-bottom: 10px;
    border-bottom: 1.5px solid #d0d5d0;
  }

  /* ── Tables ── */
  .data-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 10pt;
  }
  .data-table td {
    padding: 4px 8px;
    vertical-align: top;
    font-size: 10.5pt;
    color: #1a1a1a;
    border: none;
  }
  .data-table td:first-child {
    font-weight: 600;
    color: #4a5a4a;
    width: 30%;
    font-size: 9pt;
    font-family: 'Inter', -apple-system, 'Segoe UI', Arial, sans-serif;
    padding-left: 0;
  }

  /* ── Attached Documents ── */
  .img-section {
    margin-bottom: 22px;
  }
  .img-item {
    margin-bottom: 24px;
    border: 1px solid #d0d5d0;
  }
  .img-item .img-header {
    font-family: 'Inter', -apple-system, 'Segoe UI', Arial, sans-serif;
    font-size: 8pt;
    font-weight: 700;
    color: #ffffff;
    background: #1a3a2a;
    padding: 6px 14px;
    text-transform: uppercase;
    letter-spacing: 0.8px;
  }
  .img-item .img-frame {
    padding: 10px;
    background: #f5f7f5;
    text-align: center;
  }
  .img-item .img-frame img {
    max-width: 100%;
    max-height: 320px;
    object-fit: contain;
    display: inline-block;
    border: 1px solid #d0d5d0;
    box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  }

  /* ── Financial Statement Table ── */
  .fs-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 9.5pt;
  }
  .fs-table thead th {
    font-family: 'Inter', -apple-system, 'Segoe UI', Arial, sans-serif;
    font-size: 7.5pt;
    font-weight: 700;
    color: #4a5a4a;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    padding: 7px 8px;
    border-bottom: 2px solid #1a3a2a;
    text-align: left;
  }
  .fs-table tbody td {
    padding: 7px 8px;
    border-bottom: 1px solid #e5e8e5;
    vertical-align: middle;
  }
  .fs-table tbody tr:nth-child(even) td {
    background: #f9faf9;
  }
  .fs-table tfoot td {
    padding: 8px;
    border-top: 2px solid #1a3a2a;
    font-size: 10pt;
  }

  /* ── Empty State ── */
  .empty-state {
    border: 1px solid #d0d5d0;
    padding: 20px;
    text-align: center;
    color: #8a9a8a;
    font-style: italic;
    font-size: 10pt;
  }

  /* ── Compilation Statement ── */
  .compilation-box {
    border: 1px solid #d0d5d0;
    background: #f9faf9;
    padding: 14px 18px;
    font-size: 9.5pt;
    line-height: 1.6;
    color: #2a3a2a;
  }

  /* ── Footer ── */
  .page-footer {
    margin-top: 30px;
    padding-top: 12px;
    border-top: 1px solid #d0d5d0;
    display: flex;
    justify-content: space-between;
    font-family: 'Inter', -apple-system, 'Segoe UI', Arial, sans-serif;
    font-size: 7.5pt;
    color: #8a9a8a;
  }
  .page-footer .confidential {
    color: #b91c1c;
    font-weight: 600;
    letter-spacing: 0.3px;
  }
`;

const getTypeLabel = (type: string): string => {
  const map: Record<string, string> = {
    fuel: "Fuel", airtime: "Airtime", cash: "Cash Loan", carwash: "Car Wash",
  };
  return map[type] || type;
};

const rows = (cells: string): string =>
  cells.split("\n").map(l => l.trim()).filter(Boolean).join("\n");

export function generateDriverProfileReportHtml(data: ReportData): string {
  const { profile, debts, totals } = data;
  const now = new Date();
  const refNumber = `KPT-DPR-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}-${String(debts.length > 0 ? debts[0].id.slice(-6).toUpperCase() : "000000")}`;

  const driverInfoRows = profile ? rows(`
    <tr><td>Full Name</td><td>${profile.fullName || "N/A"}</td></tr>
    ${profile.dateOfBirth ? `<tr><td>Date of Birth</td><td>${profile.dateOfBirth}</td></tr>` : ""}
    <tr><td>Phone Number</td><td>${profile.phone || "N/A"}</td></tr>
    <tr><td>Email Address</td><td>${profile.email || "N/A"}</td></tr>
    <tr><td>Physical Address</td><td>${profile.physicalAddress || "N/A"}</td></tr>
    ${profile.city ? `<tr><td>City / Suburb</td><td>${profile.city}${profile.pincode ? " (" + profile.pincode + ")" : ""}</td></tr>` : ""}
    <tr><td>Car Registration</td><td>${profile.carRegistrationNumber || "N/A"}</td></tr>
    ${profile.carModel ? `<tr><td>Car Model</td><td>${profile.carModel}</td></tr>` : ""}
    ${profile.carYear ? `<tr><td>Car Year</td><td>${profile.carYear}</td></tr>` : ""}
    ${profile.carColor ? `<tr><td>Car Color</td><td>${profile.carColor}</td></tr>` : ""}
    ${profile.ownershipStatus ? `<tr><td>Ownership</td><td>${profile.ownershipStatus === "own" ? "Own Vehicle" : "Rented"}</td></tr>` : ""}
    ${profile.ownershipStatus === "rent" && profile.carOwnerName ? `<tr><td>Car Owner</td><td>${profile.carOwnerName}${profile.carOwnerPhone ? " — " + profile.carOwnerPhone : ""}</td></tr>` : ""}
    ${profile.verificationStatus ? `<tr><td>Verification</td><td>${profile.verificationStatus.toUpperCase()}${profile.verifiedAt ? " on " + formatDate(profile.verifiedAt) : ""}</td></tr>` : ""}
    ${profile.totalRequests !== undefined ? `<tr><td>Total Requests</td><td>${profile.totalRequests}</td></tr>` : ""}
    ${profile.totalSpent !== undefined ? `<tr><td>Total Spent</td><td>${formatMoney(profile.totalSpent)}</td></tr>` : ""}
    ${profile.referenceName ? `<tr><td>Reference Contact</td><td>${profile.referenceName}${profile.referencePhone ? " — " + profile.referencePhone : ""}</td></tr>` : ""}
  `) : `<tr><td colspan="2" style="text-align:center;font-style:italic;color:#8a9a8a;">No driver information available</td></tr>`;

  const driverInfoHtml = `
    <table class="data-table">
      ${driverInfoRows}
    </table>`;

  const imagesHtml = (profile?.profilePhotoUrl || profile?.drivingLicenseUrl || profile?.carRegistrationUrl) ? `
    <div class="img-section">
      <div class="section-heading">2. Supporting Documents</div>
      ${profile.profilePhotoUrl ? `
      <div class="img-item">
        <div class="img-header">Profile Photograph</div>
        <div class="img-frame">
          <img src="${profile.profilePhotoUrl}" alt="Profile Photo"/>
        </div>
      </div>` : ""}
      ${profile.drivingLicenseUrl ? `
      <div class="img-item">
        <div class="img-header">Driving License</div>
        <div class="img-frame">
          <img src="${profile.drivingLicenseUrl}" alt="Driving License"/>
        </div>
      </div>` : ""}
      ${profile.carRegistrationUrl ? `
      <div class="img-item">
        <div class="img-header">Vehicle Registration</div>
        <div class="img-frame">
          <img src="${profile.carRegistrationUrl}" alt="Car Registration"/>
        </div>
      </div>` : ""}
    </div>` : "";

  const bankingRows = (profile?.bankName || profile?.accountNumber)
    ? rows(`
      ${profile.bankName ? `<tr><td>Bank Name</td><td>${profile.bankName}</td></tr>` : ""}
      ${profile.accountHolder ? `<tr><td>Account Holder</td><td>${profile.accountHolder}</td></tr>` : ""}
      ${profile.accountNumber ? `<tr><td>Account Number</td><td>${profile.accountNumber}</td></tr>` : ""}
      ${profile.branchCode ? `<tr><td>Branch Code</td><td>${profile.branchCode}</td></tr>` : ""}
    `) : "";

  const bankingHtml = bankingRows ? `
    <div class="section">
      <div class="section-heading">3. Banking Details</div>
      <table class="data-table">
        ${bankingRows}
      </table>
    </div>` : "";

  let sectionCounter = 1;
  const nextSection = () => sectionCounter++;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Driver Profile Report — ${profile?.fullName || "N/A"}</title>
  <style>${globalStyles}</style>
</head>
<body>
  <div class="page">

    <!-- Letterhead -->
    <div class="letterhead">
      <div class="company">Kapuka Tradings</div>
      <div class="divider"></div>
      <div class="tagline">Driver Profile Report</div>
    </div>

    <!-- Document Header -->
    <div class="doc-header">
      <div class="doc-title">Driver Profile Report</div>
      <div class="doc-meta">
        <div><strong>Reference:</strong> ${refNumber}</div>
        <div><strong>Date:</strong> ${formatDate(now)}</div>
        <div><strong>Status:</strong> Confidential</div>
      </div>
    </div>

    <!-- 1. Driver Information -->
    <div class="section">
      <div class="section-heading">${nextSection()}. Driver Information</div>
      ${driverInfoHtml}
    </div>

    <!-- Financial Statement -->
    <div class="section">
      <div class="section-heading">${nextSection()}. Financial Statement</div>

      <table class="fs-table">
        <thead>
          <tr>
            <th style="width:14%;">Date</th>
            <th style="width:22%;">Reference</th>
            <th style="width:12%;">Type</th>
            <th style="width:18%;text-align:right;">Principal</th>
            <th style="width:18%;text-align:right;">Interest</th>
            <th style="width:16%;text-align:right;">Total Due</th>
          </tr>
        </thead>
        <tbody>
          ${debts.length === 0 ? `
          <tr>
            <td colspan="6" style="text-align:center;font-style:italic;color:#8a9a8a;padding:20px;">No outstanding debts recorded for this driver.</td>
          </tr>` : debts.map((debt) => `
          <tr>
            <td>${debt.requestDate ? formatDate(debt.requestDate) : "—"}</td>
            <td><strong>${debt.id.slice(-8).toUpperCase()}</strong></td>
            <td>${getTypeLabel(debt.type)}</td>
            <td style="text-align:right;">${formatMoney(debt.amount)}</td>
            <td style="text-align:right;">${formatMoney(debt.interest)}</td>
            <td style="text-align:right;font-weight:700;">${formatMoney(debt.totalRepayable)}</td>
          </tr>`).join("")}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="3" style="font-weight:700;text-transform:uppercase;letter-spacing:0.3px;">Total Outstanding</td>
            <td style="text-align:right;font-weight:600;">${formatMoney(totals.totalOutstanding)}</td>
            <td style="text-align:right;font-weight:600;">${formatMoney(totals.totalInterest)}</td>
            <td style="text-align:right;font-weight:700;font-size:11pt;">${formatMoney(totals.totalOutstanding)}</td>
          </tr>
        </tfoot>
      </table>

      <div style="margin-top:8px;font-size:8pt;color:#8a9a8a;font-style:italic;">
        Active accounts: ${totals.count} &mdash; This statement reflects all outstanding balances as of ${formatDate(now)}.
      </div>
    </div>

    ${imagesHtml ? imagesHtml.replace('<div class="img-section">',
      '<div class="img-section" style="page-break-before:always;padding-top:20px;">' +
      '<div style="margin-bottom:24px;padding-bottom:14px;border-bottom:3px solid #1a3a2a;">' +
      '<div style="font-family:\'Inter\',sans-serif;font-size:16pt;font-weight:700;color:#1a3a2a;letter-spacing:1.5px;text-transform:uppercase;">Kapuka Tradings</div>' +
      '<div style="border-bottom:2px solid #bff202;width:60px;margin-top:6px;margin-bottom:8px;"></div>' +
      '<div style="font-size:9pt;color:#5a6a5a;letter-spacing:1px;text-transform:uppercase;">Driver Profile Report — Supporting Documents</div>' +
      '</div>'
    ).replace('<div class="section-heading">2. Attached Documents</div>', `<div class="section-heading" style="font-size:10pt;">${nextSection()}. Supporting Documents</div>`) : ""}

    ${bankingHtml ? bankingHtml.replace('<div class="section-heading">3. Banking Details</div>', `<div class="section-heading">${nextSection()}. Banking Details</div>`) : ""}

    <!-- Compilation Statement -->
    <div class="section">
      <div class="section-heading">${nextSection()}. Compilation Statement</div>
      <div class="compilation-box">
        <p>This report has been compiled by Kapuka Tradings (Pty) Ltd from information provided by the driver and from internal records maintained in the ordinary course of business. The financial figures reflected herein accurately represent the balances recorded in the company&rsquo;s systems as at the date of generation.</p>
      </div>
    </div>

    <!-- Footer -->
    <div class="page-footer">
      <span class="confidential">CONFIDENTIAL</span>
      <span>Page 1 of 1</span>
      <span>Generated ${formatDateTime(now)}</span>
    </div>

  </div>
</body>
</html>`;
}
