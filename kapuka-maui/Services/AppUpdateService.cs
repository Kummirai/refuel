using System.Net.Http.Json;
using System.Text.Json.Serialization;

namespace KapukaApp.Services;

public class AppUpdateService
{
    private readonly HttpClient _http;

    // ── Change this to your server ──
    // Local test (real device on same WiFi): http://192.168.x.x:3000
    // Local test (emulator):               http://10.0.2.2:3000
    // Production:                          https://your-domain.com
    private static readonly string BaseUrl = "http://localhost:3000";
    private const string ApkFileName = "kapuka-update.apk";

    public AppUpdateService(HttpClient http)
    {
        _http = http;
    }

    public async Task<UpdateCheckResult> CheckForUpdateAsync(CancellationToken ct = default)
    {
        try
        {
            var currentVersion = AppInfo.VersionString;
            var response = await _http.GetFromJsonAsync<VersionResponse>(
                $"{BaseUrl}/api/app-version?currentVersion={currentVersion}",
                ct
            );

            if (response is null)
                return new UpdateCheckResult(false, null, null);

            return new UpdateCheckResult(
                response.UpdateAvailable,
                response.ApkUrl,
                response.LatestVersion
            );
        }
        catch
        {
            return new UpdateCheckResult(false, null, null);
        }
    }

    public async Task<string> DownloadApkAsync(IProgress<double>? progress = null, CancellationToken ct = default)
    {
        var check = await CheckForUpdateAsync(ct);
        if (!check.UpdateAvailable || check.ApkUrl is null)
            throw new InvalidOperationException("No update available");

        var cacheDir = FileSystem.CacheDirectory;
        var filePath = Path.Combine(cacheDir, ApkFileName);

        using var response = await _http.GetAsync(check.ApkUrl, HttpCompletionOption.ResponseHeadersRead, ct);
        response.EnsureSuccessStatusCode();

        var totalBytes = response.Content.Headers.ContentLength ?? -1;
        await using var contentStream = await response.Content.ReadAsStreamAsync(ct);
        await using var fileStream = new FileStream(filePath, FileMode.Create, FileAccess.Write, FileShare.None);

        if (totalBytes > 0)
        {
            var buffer = new byte[81920];
            long readSoFar = 0;
            int bytesRead;
            while ((bytesRead = await contentStream.ReadAsync(buffer, ct)) > 0)
            {
                await fileStream.WriteAsync(buffer.AsMemory(0, bytesRead), ct);
                readSoFar += bytesRead;
                progress?.Report((double)readSoFar / totalBytes);
            }
        }
        else
        {
            await contentStream.CopyToAsync(fileStream, ct);
        }

        return filePath;
    }

    public static void InstallApk(string filePath)
    {
#if ANDROID
        var context = Android.App.Application.Context;
        var javaFile = new Java.IO.File(filePath);
        var uri = AndroidX.Core.Content.FileProvider.GetUriForFile(
            context,
            $"{context.PackageName}.fileprovider",
            javaFile
        );

        var intent = new Android.Content.Intent(Android.Content.Intent.ActionView);
        intent.SetDataAndType(uri, "application/vnd.android.package-archive");
        intent.AddFlags(Android.Content.ActivityFlags.GrantReadUriPermission);
        intent.AddFlags(Android.Content.ActivityFlags.NewTask);

        context.StartActivity(intent);
#else
        System.Diagnostics.Process.Start(new System.Diagnostics.ProcessStartInfo
        {
            FileName = filePath,
            UseShellExecute = true,
        });
#endif
    }
}

public record UpdateCheckResult(
    bool UpdateAvailable,
    string? ApkUrl,
    string? LatestVersion
);

internal class VersionResponse
{
    [JsonPropertyName("updateAvailable")]
    public bool UpdateAvailable { get; set; }

    [JsonPropertyName("apkUrl")]
    public string? ApkUrl { get; set; }

    [JsonPropertyName("latestVersion")]
    public string? LatestVersion { get; set; }
}
