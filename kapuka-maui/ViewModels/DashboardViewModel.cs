using System.Collections.ObjectModel;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using KapukaApp.Models;
using KapukaApp.Services;

namespace KapukaApp.ViewModels;

public partial class DashboardViewModel : BaseViewModel
{
    private readonly KapukaApiService _api;

    [ObservableProperty]
    private DriverProfile? _profile;

    [ObservableProperty]
    private DriverStats? _stats;

    [ObservableProperty]
    private ActiveLoan? _activeLoan;

    [ObservableProperty]
    private ObservableCollection<ServiceRequest> _recentRequests = [];

    [ObservableProperty]
    private bool _hasActiveLoan;

    public DashboardViewModel(KapukaApiService api)
    {
        _api = api;
        Title = "Dashboard";
    }

    [RelayCommand]
    private async Task LoadDataAsync()
    {
        if (_api.CurrentUser == null) return;
        IsBusy = true;

        try
        {
            var userId = _api.CurrentUser.Id;

            var profileTask = _api.GetProfileAsync(userId);
            var requestsTask = _api.GetRequestsAsync(userId);
            var loansTask = _api.GetActiveLoansAsync(userId);

            await Task.WhenAll(profileTask, requestsTask, loansTask);

            Profile = profileTask.Result;
            var requests = requestsTask.Result;
            RecentRequests = new ObservableCollection<ServiceRequest>(
                requests.OrderByDescending(r => r.RequestDate).Take(5));

            var loans = loansTask.Result;
            ActiveLoan = loans.FirstOrDefault();
            HasActiveLoan = ActiveLoan != null;

            Stats = new DriverStats
            {
                TotalRequests = requests.Count,
                TotalSpent = requests.Where(r => r.Status == "completed").Sum(r => r.DisplayRepayable),
                ActiveLoans = loans.Count,
                Rating = Profile?.Rating ?? 0,
            };
        }
        finally
        {
            IsBusy = false;
        }
    }

    [RelayCommand]
    private async Task RequestFuelAsync()
    {
        await Shell.Current.GoToAsync("//new-request?type=fuel");
    }

    [RelayCommand]
    private async Task RequestCarWashAsync()
    {
        await Shell.Current.GoToAsync("//new-request?type=carwash");
    }

    [RelayCommand]
    private async Task ViewHistoryAsync()
    {
        await Shell.Current.GoToAsync("//history");
    }
}
