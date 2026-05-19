using System.Text.Json.Serialization;

namespace KapukaApp.Models;

public class LoginRequest
{
    [JsonPropertyName("email")] public string Email { get; set; } = string.Empty;
    [JsonPropertyName("password")] public string Password { get; set; } = string.Empty;
}

public class SignUpRequest
{
    [JsonPropertyName("email")] public string Email { get; set; } = string.Empty;
    [JsonPropertyName("password")] public string Password { get; set; } = string.Empty;
    [JsonPropertyName("name")] public string Name { get; set; } = string.Empty;
    [JsonPropertyName("phone")] public string? Phone { get; set; }
}

public class AuthResponse
{
    [JsonPropertyName("user")] public AuthUser? User { get; set; }
    [JsonPropertyName("session")] public object? Session { get; set; }
}

public class AuthUser
{
    [JsonPropertyName("id")] public string Id { get; set; } = string.Empty;
    [JsonPropertyName("email")] public string Email { get; set; } = string.Empty;
    [JsonPropertyName("name")] public string Name { get; set; } = string.Empty;
    [JsonPropertyName("phone")] public string? Phone { get; set; }
    [JsonPropertyName("role")] public string Role { get; set; } = "driver";
    [JsonPropertyName("emailVerified")] public bool EmailVerified { get; set; }
}

public class SessionResponse
{
    [JsonPropertyName("user")] public AuthUser? User { get; set; }
    [JsonPropertyName("session")] public SessionData? Session { get; set; }
}

public class SessionData
{
    [JsonPropertyName("id")] public string Id { get; set; } = string.Empty;
    [JsonPropertyName("userId")] public string UserId { get; set; } = string.Empty;
    [JsonPropertyName("expiresAt")] public DateTime ExpiresAt { get; set; }
}

public class SignUpResponse
{
    [JsonPropertyName("user")] public AuthUser? User { get; set; }
    [JsonPropertyName("token")] public string? Token { get; set; }
}
