using System.Text.Json.Serialization;

namespace KapukaApp.Models;

public class DriverProfile
{
    [JsonPropertyName("id")] public string Id { get; set; } = string.Empty;
    [JsonPropertyName("name")] public string Name { get; set; } = string.Empty;
    [JsonPropertyName("email")] public string Email { get; set; } = string.Empty;
    [JsonPropertyName("phone")] public string? Phone { get; set; }
    [JsonPropertyName("carNumber")] public string? CarNumber { get; set; }
    [JsonPropertyName("carModel")] public string? CarModel { get; set; }
    [JsonPropertyName("carYear")] public string? CarYear { get; set; }
    [JsonPropertyName("carColor")] public string? CarColor { get; set; }
    [JsonPropertyName("photoUrl")] public string? PhotoUrl { get; set; }
    [JsonPropertyName("rating")] public double Rating { get; set; }
    [JsonPropertyName("totalRequests")] public int TotalRequests { get; set; }
    [JsonPropertyName("totalSpent")] public double TotalSpent { get; set; }
    [JsonPropertyName("verificationStatus")] public string VerificationStatus { get; set; } = "unverified";
}

public class ActiveLoan
{
    [JsonPropertyName("id")] public string Id { get; set; } = string.Empty;
    [JsonPropertyName("amount")] public double Amount { get; set; }
    [JsonPropertyName("totalRepayable")] public double TotalRepayable { get; set; }
    [JsonPropertyName("repaidAmount")] public double RepaidAmount { get; set; }
    [JsonPropertyName("remainingBalance")] public double RemainingBalance { get; set; }
    [JsonPropertyName("dailyPayment")] public double DailyPayment { get; set; }
    [JsonPropertyName("type")] public string Type { get; set; } = string.Empty;
    [JsonPropertyName("status")] public string Status { get; set; } = string.Empty;

    public double Progress => TotalRepayable > 0 ? RepaidAmount / TotalRepayable : 0;
}

public class DriverStats
{
    public int TotalRequests { get; set; }
    public double TotalSpent { get; set; }
    public int ActiveLoans { get; set; }
    public double Rating { get; set; }
    public double OutstandingBalance => ActiveLoans > 0 ? 0 : 0;
}
