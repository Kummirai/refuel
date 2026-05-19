using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using KapukaApp.Models;
using KapukaApp.Services;

namespace KapukaApp.ViewModels;

public partial class ProfileViewModel : BaseViewModel
{
    private readonly KapukaApiService _api;

    [ObservableProperty]
    private DriverProfile? _profile;

    [ObservableProperty]
    private bool _isLoaded;

    [ObservableProperty]
    private bool _showChangePassword;

    [ObservableProperty]
    private string _currentPassword = string.Empty;

    [ObservableProperty]
    private string _newPassword = string.Empty;

    [ObservableProperty]
    private string _confirmPassword = string.Empty;

    [ObservableProperty]
    private string _errorMessage = string.Empty;

    [ObservableProperty]
    private string _successMessage = string.Empty;

    public ProfileViewModel(KapukaApiService api)
    {
        _api = api;
        Title = "Profile";
    }

    [RelayCommand]
    private async Task LoadProfileAsync()
    {
        if (_api.CurrentUser == null) return;
        IsBusy = true;
        ErrorMessage = string.Empty;

        try
        {
            Profile = await _api.GetProfileAsync(_api.CurrentUser.Id);
            IsLoaded = Profile != null;
        }
        catch
        {
            ErrorMessage = "Failed to load profile.";
        }
        finally
        {
            IsBusy = false;
        }
    }

    [RelayCommand]
    private void ToggleChangePassword()
    {
        ShowChangePassword = !ShowChangePassword;
        ErrorMessage = string.Empty;
        SuccessMessage = string.Empty;
        CurrentPassword = string.Empty;
        NewPassword = string.Empty;
        ConfirmPassword = string.Empty;
    }

    [RelayCommand]
    private async Task SavePasswordAsync()
    {
        if (string.IsNullOrWhiteSpace(CurrentPassword) ||
            string.IsNullOrWhiteSpace(NewPassword) ||
            string.IsNullOrWhiteSpace(ConfirmPassword))
        {
            ErrorMessage = "All fields are required.";
            return;
        }

        if (NewPassword != ConfirmPassword)
        {
            ErrorMessage = "New passwords do not match.";
            return;
        }

        if (NewPassword.Length < 6)
        {
            ErrorMessage = "Password must be at least 6 characters.";
            return;
        }

        IsBusy = true;
        ErrorMessage = string.Empty;
        SuccessMessage = string.Empty;

        try
        {
            var success = await _api.ChangePasswordAsync(CurrentPassword, NewPassword);
            if (success)
            {
                SuccessMessage = "Password changed successfully.";
                CurrentPassword = string.Empty;
                NewPassword = string.Empty;
                ConfirmPassword = string.Empty;
            }
            else
            {
                ErrorMessage = "Failed to change password. Check your current password.";
            }
        }
        catch
        {
            ErrorMessage = "Connection error. Try again.";
        }
        finally
        {
            IsBusy = false;
        }
    }

    [RelayCommand]
    private async Task LogoutAsync()
    {
        await _api.LogoutAsync();
        await Shell.Current.GoToAsync("//login");
    }
}
