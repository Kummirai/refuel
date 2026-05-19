using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using KapukaApp.Services;

namespace KapukaApp.ViewModels;

public partial class NewRequestViewModel : BaseViewModel
{
    private readonly KapukaApiService _api;

    [ObservableProperty]
    private string _requestType = "fuel";

    [ObservableProperty]
    private double _amount = 500;

    [ObservableProperty]
    private string _carNumber = string.Empty;

    [ObservableProperty]
    private string _phoneNumber = string.Empty;

    [ObservableProperty]
    private string _fuelType = "unleaded";

    [ObservableProperty]
    private string _selectedPackage = string.Empty;

    [ObservableProperty]
    private string _location = string.Empty;

    [ObservableProperty]
    private string _errorMessage = string.Empty;

    [ObservableProperty]
    private bool _isFuel;

    [ObservableProperty]
    private bool _isCarWash;

    public List<double> FuelAmounts { get; } = [200, 300, 500, 750, 1000, 1500, 2000];
    public List<double> CarWashPackages { get; } = [200, 300, 500, 750, 1000, 1500, 2000];

    public NewRequestViewModel(KapukaApiService api)
    {
        _api = api;
        Title = "Request Fuel";
    }

    partial void OnRequestTypeChanged(string value)
    {
        IsFuel = value == "fuel";
        IsCarWash = value == "carwash";
        Title = IsFuel ? "Request Fuel" : "Car Wash";
    }

    [RelayCommand]
    private void SelectFuel()
    {
        RequestType = "fuel";
    }

    [RelayCommand]
    private void SelectCarWash()
    {
        RequestType = "carwash";
    }

    [RelayCommand]
    private void SelectAmount(double amount)
    {
        Amount = amount;
    }

    [RelayCommand]
    private void SelectFuelType(string type)
    {
        FuelType = type;
    }

    [RelayCommand]
    private void SelectPackage(string package)
    {
        SelectedPackage = package;
    }

    [RelayCommand]
    private async Task SubmitAsync()
    {
        if (_api.CurrentUser == null) return;

        if (string.IsNullOrWhiteSpace(CarNumber))
        {
            ErrorMessage = "Car number is required";
            return;
        }

        IsBusy = true;
        ErrorMessage = string.Empty;

        try
        {
            var result = await _api.CreateRequestAsync(
                _api.CurrentUser.Id,
                RequestType,
                Amount,
                CarNumber.Trim().ToUpper(),
                string.IsNullOrWhiteSpace(PhoneNumber) ? null : PhoneNumber.Trim(),
                IsFuel ? FuelType : null,
                IsCarWash ? SelectedPackage : null,
                string.IsNullOrWhiteSpace(Location) ? null : Location.Trim());

            if (result != null)
            {
                await Shell.Current.DisplayAlertAsync("Success",
                    $"{RequestType} request submitted!", "OK");
                await Shell.Current.GoToAsync("//history");
            }
            else
            {
                ErrorMessage = "Failed to submit request";
            }
        }
        catch
        {
            ErrorMessage = "Connection error";
        }
        finally
        {
            IsBusy = false;
        }
    }
}
