using KapukaApp.Services;

namespace KapukaApp;

public partial class MainPage : ContentPage
{
    private readonly AppUpdateService _updateService;

    public MainPage(AppUpdateService updateService)
    {
        InitializeComponent();
        _updateService = updateService;
        VersionLabel.Text = $"v{AppInfo.VersionString}";
    }

    protected override async void OnAppearing()
    {
        base.OnAppearing();
        await CheckForUpdateAsync();
    }

    private async Task CheckForUpdateAsync()
    {
        StatusLabel.Text = "Checking for updates...";
        UpdateBtn.IsVisible = false;
        RetryBtn.IsVisible = false;
        DownloadProgress.IsVisible = false;

        var result = await _updateService.CheckForUpdateAsync();

        if (result.UpdateAvailable)
        {
            StatusLabel.Text = $"Update v{result.LatestVersion} available";
            UpdateBtn.IsVisible = true;
        }
        else
        {
            StatusLabel.Text = "You're on the latest version";
        }
    }

    private async void OnUpdateClicked(object? sender, EventArgs e)
    {
        UpdateBtn.IsVisible = false;
        DownloadProgress.IsVisible = true;
        RetryBtn.IsVisible = false;
        StatusLabel.Text = "Downloading update...";

        try
        {
            var progress = new Progress<double>(p =>
            {
                MainThread.BeginInvokeOnMainThread(() =>
                {
                    DownloadProgress.Progress = p;
                    StatusLabel.Text = $"Downloading... {p * 100:F0}%";
                });
            });

            var apkPath = await _updateService.DownloadApkAsync(progress);

            StatusLabel.Text = "Installing...";
            AppUpdateService.InstallApk(apkPath);
        }
        catch (Exception ex)
        {
            StatusLabel.Text = $"Download failed: {ex.Message}";
            RetryBtn.IsVisible = true;
            DownloadProgress.IsVisible = false;
        }
    }

    private async void OnRetryClicked(object? sender, EventArgs e)
    {
        await CheckForUpdateAsync();
    }
}
