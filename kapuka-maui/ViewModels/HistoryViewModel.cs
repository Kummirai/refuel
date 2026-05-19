using System.Collections.ObjectModel;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using KapukaApp.Models;
using KapukaApp.Services;

namespace KapukaApp.ViewModels;

public partial class HistoryViewModel : BaseViewModel
{
    private readonly KapukaApiService _api;
    private List<ServiceRequest> _allRequests = [];

    [ObservableProperty]
    private ObservableCollection<RequestGroup> _filteredRequests = [];

    [ObservableProperty]
    private string _selectedFilter = "All";

    [ObservableProperty]
    private bool _hasRequests;

    [ObservableProperty]
    private ServiceRequest? _selectedRequest;

    [ObservableProperty]
    private bool _showDetail;

    public List<string> Filters { get; } = ["All", "Pending", "Approved", "Completed", "Rejected"];

    public HistoryViewModel(KapukaApiService api)
    {
        _api = api;
        Title = "History";
    }

    partial void OnSelectedFilterChanged(string value)
    {
        ApplyFilter();
    }

    [RelayCommand]
    private async Task LoadDataAsync()
    {
        if (_api.CurrentUser == null) return;
        IsBusy = true;

        try
        {
            var requests = await _api.GetRequestsAsync(_api.CurrentUser.Id);
            _allRequests = requests.OrderByDescending(r => r.RequestDate).ToList();
            HasRequests = _allRequests.Count > 0;
            ApplyFilter();
        }
        finally
        {
            IsBusy = false;
        }
    }

    private void ApplyFilter()
    {
        var filtered = SelectedFilter == "All"
            ? _allRequests
            : _allRequests.Where(r =>
                r.Status.Equals(SelectedFilter, StringComparison.OrdinalIgnoreCase)).ToList();

        FilteredRequests = new ObservableCollection<RequestGroup>(
            filtered.GroupBy(r => r.Status)
                .Select(g => new RequestGroup { Status = g.Key, Requests = new ObservableCollection<ServiceRequest>(g) }));
    }

    [RelayCommand]
    private void ShowDetailAsync(ServiceRequest request)
    {
        SelectedRequest = request;
        ShowDetail = true;
    }

    [RelayCommand]
    private void CloseDetail()
    {
        ShowDetail = false;
        SelectedRequest = null;
    }
}

public class RequestGroup
{
    public string Status { get; set; } = string.Empty;
    public ObservableCollection<ServiceRequest> Requests { get; set; } = [];
    public int Count => Requests.Count;
    public string StatusIcon => Status switch
    {
        "pending" => "\u23f3",
        "approved" => "\u2705",
        "sent" => "\ud83d\udce8",
        "completed" => "\u2705",
        "rejected" => "\u274c",
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
}
