using System.Text.Json.Serialization;

namespace KapukaApp.Models;

public class ServiceRequest
{
    [JsonPropertyName("id")] public string Id { get; set; } = string.Empty;
    [JsonPropertyName("type")] public string Type { get; set; } = string.Empty;
    [JsonPropertyName("amount")] public double Amount { get; set; }
    [JsonPropertyName("status")] public string Status { get; set; } = string.Empty;
    [JsonPropertyName("otp")] public string? Otp { get; set; }
    [JsonPropertyName("driverName")] public string DriverName { get; set; } = string.Empty;
    [JsonPropertyName("carNumber")] public string CarNumber { get; set; } = string.Empty;
    [JsonPropertyName("location")] public string? Location { get; set; }
    [JsonPropertyName("fuelType")] public string? FuelType { get; set; }
    [JsonPropertyName("phoneNumber")] public string? PhoneNumber { get; set; }
    [JsonPropertyName("interest")] public double? Interest { get; set; }
    [JsonPropertyName("totalRepayable")] public double? TotalRepayable { get; set; }
    [JsonPropertyName("actualAmount")] public double? ActualAmount { get; set; }
    [JsonPropertyName("popUrl")] public string? PopUrl { get; set; }
    [JsonPropertyName("popUploadedAt")] public string? PopUploadedAt { get; set; }
    [JsonPropertyName("hasReceipt")] public bool HasReceipt { get; set; }
    [JsonPropertyName("dailyPayment")] public double? DailyPayment { get; set; }
    [JsonPropertyName("repaymentDays")] public int? RepaymentDays { get; set; }
    [JsonPropertyName("serviceCharge")] public double? ServiceCharge { get; set; }
    [JsonPropertyName("totalDue")] public double? TotalDue { get; set; }
    [JsonPropertyName("package")] public string? Package { get; set; }
    [JsonPropertyName("packageDescription")] public string? PackageDescription { get; set; }
    [JsonPropertyName("completedDate")] public string? CompletedDate { get; set; }
    [JsonPropertyName("approvedDate")] public string? ApprovedDate { get; set; }
    [JsonPropertyName("sentDate")] public string? SentDate { get; set; }
    [JsonPropertyName("repaidAmount")] public double? RepaidAmount { get; set; }
    [JsonPropertyName("remainingBalance")] public double? RemainingBalance { get; set; }
    [JsonPropertyName("isPaid")] public bool IsPaid { get; set; }
    [JsonPropertyName("hasPendingRepayment")] public bool HasPendingRepayment { get; set; }
    [JsonPropertyName("pendingRepaymentAmount")] public double? PendingRepaymentAmount { get; set; }
    [JsonPropertyName("requestDate")] public string RequestDate { get; set; } = string.Empty;
    [JsonPropertyName("rejectionReason")] public string? RejectionReason { get; set; }

    public string TypeIcon => Type switch
    {
        "fuel" => "\u26fd",
        "carwash" => "\ud83e\udddf",
        "airtime" => "\ud83d\udcf1",
        "cash" => "\ud83d\udcb5",
        _ => "\ud83d\udccb",
    };

    public Color StatusColor => Status switch
    {
        "pending" => Colors.Orange,
        "approved" => Color.FromArgb("#3A7717"),
        "sent" => Color.FromArgb("#bff202"),
        "completed" => Color.FromArgb("#3A7717"),
        "rejected" => Colors.Red,
        _ => Colors.Gray,
    };

    public double DisplayRepayable => TotalRepayable ?? Math.Round(Amount * 1.13, 2);
    public double DisplayRemaining => RemainingBalance ?? DisplayRepayable;
    public double DisplayRepaid => DisplayRepayable - DisplayRemaining;
    public double Progress => DisplayRepayable > 0 ? DisplayRepaid / DisplayRepayable : 0;
    public bool IsPayable => Status is "approved" or "sent" or "completed" && HasReceipt;
}
