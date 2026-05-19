using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using KapukaApp.Models;

namespace KapukaApp.Services;

public class KapukaApiService
{
    private static readonly string BaseUrl = "http://localhost:3000";

    private readonly HttpClient _http;
    private AuthUser? _currentUser;

    public AuthUser? CurrentUser => _currentUser;
    public bool IsLoggedIn => _currentUser != null;

    public KapukaApiService()
    {
        var handler = new HttpClientHandler
        {
            AllowAutoRedirect = true,
            UseCookies = true,
            CookieContainer = new CookieContainer(),
        };
        _http = new HttpClient(handler)
        {
            BaseAddress = new Uri(BaseUrl),
            Timeout = TimeSpan.FromSeconds(30),
        };
    }

    // ─── Auth ────────────────────────────────────────────────

    public async Task<bool> LoginAsync(string email, string password)
    {
        var payload = new { email, password };
        var res = await _http.PostAsJsonAsync("/api/auth/sign-in/email", payload);
        if (!res.IsSuccessStatusCode) return false;

        var data = await res.Content.ReadFromJsonAsync<AuthResponse>();
        _currentUser = data?.User;
        return _currentUser != null;
    }

    public async Task<bool> SignUpAsync(string name, string email, string password, string? phone)
    {
        var payload = new { name, email, password, phone };
        var res = await _http.PostAsJsonAsync("/api/auth/sign-up/email", payload);
        if (!res.IsSuccessStatusCode) return false;

        var data = await res.Content.ReadFromJsonAsync<SignUpResponse>();
        if (data?.User != null)
        {
            _currentUser = data.User;
            return true;
        }
        return false;
    }

    public async Task LogoutAsync()
    {
        await _http.PostAsync("/api/auth/sign-out", null);
        _currentUser = null;
    }

    public async Task<bool> RestoreSessionAsync()
    {
        try
        {
            var res = await _http.GetAsync("/api/auth/session");
            if (!res.IsSuccessStatusCode) return false;
            var data = await res.Content.ReadFromJsonAsync<SessionResponse>();
            _currentUser = data?.User;
            return _currentUser != null;
        }
        catch
        {
            return false;
        }
    }

    // ─── Requests ────────────────────────────────────────────

    public async Task<List<ServiceRequest>> GetRequestsAsync(string userId)
    {
        try
        {
            var res = await _http.GetAsync($"/api/driver/requests?userId={userId}");
            if (!res.IsSuccessStatusCode) return [];
            return await res.Content.ReadFromJsonAsync<List<ServiceRequest>>() ?? [];
        }
        catch
        {
            return [];
        }
    }

    public async Task<ServiceRequest?> CreateRequestAsync(
        string userId, string type, double amount, string carNumber,
        string? phoneNumber, string? fuelType, string? package, string? location)
    {
        var payload = new
        {
            userId,
            type,
            amount,
            carNumber,
            contactPhone = phoneNumber,
            fuelType,
            package,
            location,
        };
        var res = await _http.PostAsJsonAsync("/api/driver/requests", payload);
        if (!res.IsSuccessStatusCode) return null;
        return await res.Content.ReadFromJsonAsync<ServiceRequest>();
    }

    // ─── Profile ─────────────────────────────────────────────

    public async Task<DriverProfile?> GetProfileAsync(string userId)
    {
        try
        {
            var res = await _http.GetAsync($"/api/driver/profile?userId={userId}");
            if (!res.IsSuccessStatusCode) return null;
            return await res.Content.ReadFromJsonAsync<DriverProfile>();
        }
        catch
        {
            return null;
        }
    }

    // ─── Active Loans ────────────────────────────────────────

    public async Task<List<ActiveLoan>> GetActiveLoansAsync(string userId)
    {
        try
        {
            var res = await _http.GetAsync($"/api/driver/loans/active?userId={userId}");
            if (!res.IsSuccessStatusCode) return [];
            return await res.Content.ReadFromJsonAsync<List<ActiveLoan>>() ?? [];
        }
        catch
        {
            return [];
        }
    }

    // ─── Repayment ───────────────────────────────────────────

    public async Task<bool> SubmitRepaymentProofAsync(
        string requestId, string userId, double amount, string proofUrl)
    {
        var payload = new { requestId, userId, amount, proofUrl };
        var res = await _http.PostAsJsonAsync("/api/driver/repayment-proof", payload);
        return res.IsSuccessStatusCode;
    }

    // ─── Settings ────────────────────────────────────────────

    public async Task<bool> ChangePasswordAsync(string currentPassword, string newPassword)
    {
        try
        {
            var payload = new { currentPassword, newPassword };
            var res = await _http.PostAsJsonAsync("/api/auth/change-password", payload);
            return res.IsSuccessStatusCode;
        }
        catch
        {
            return false;
        }
    }

    public async Task<JsonElement?> GetSettingsAsync()
    {
        try
        {
            var res = await _http.GetAsync("/api/admin/settings");
            if (!res.IsSuccessStatusCode) return null;
            return await res.Content.ReadFromJsonAsync<JsonElement>();
        }
        catch
        {
            return null;
        }
    }
}
