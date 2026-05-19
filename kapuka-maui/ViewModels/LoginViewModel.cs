using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using KapukaApp.Services;

namespace KapukaApp.ViewModels;

public partial class LoginViewModel : BaseViewModel
{
    private readonly KapukaApiService _api;

    [ObservableProperty]
    private string _email = string.Empty;

    [ObservableProperty]
    private string _password = string.Empty;

    [ObservableProperty]
    private string _name = string.Empty;

    [ObservableProperty]
    private string _phone = string.Empty;

    [ObservableProperty]
    private bool _isRegistering;

    [ObservableProperty]
    private string _errorMessage = string.Empty;

    public LoginViewModel(KapukaApiService api)
    {
        _api = api;
        Title = "Kapuka";
    }

    partial void OnIsRegisteringChanged(bool value)
    {
        Title = value ? "Create Account" : "Kapuka";
    }

    [RelayCommand]
    private async Task LoginAsync()
    {
        if (string.IsNullOrWhiteSpace(Email) || string.IsNullOrWhiteSpace(Password))
        {
            ErrorMessage = "Email and password are required";
            return;
        }

        IsBusy = true;
        ErrorMessage = string.Empty;

        try
        {
            var success = await _api.LoginAsync(Email.Trim(), Password);
            if (success)
            {
                await Shell.Current.GoToAsync("//dashboard");
            }
            else
            {
                ErrorMessage = "Invalid email or password";
            }
        }
        catch
        {
            ErrorMessage = "Connection error. Check your server.";
        }
        finally
        {
            IsBusy = false;
        }
    }

    [RelayCommand]
    private async Task SignUpAsync()
    {
        IsRegistering = true;
        IsBusy = true;
        ErrorMessage = string.Empty;

        try
        {
            var success = await _api.SignUpAsync(Name, Email.Trim(), Password,
                string.IsNullOrWhiteSpace(Phone) ? null : Phone.Trim());
            if (success)
            {
                await Shell.Current.GoToAsync("//dashboard");
            }
            else
            {
                ErrorMessage = "Registration failed. Email may already be in use.";
            }
        }
        catch
        {
            ErrorMessage = "Connection error. Check your server.";
        }
        finally
        {
            IsBusy = false;
            IsRegistering = false;
        }
    }

    [RelayCommand]
    private void ToggleMode()
    {
        IsRegistering = !IsRegistering;
        ErrorMessage = string.Empty;
    }
}
