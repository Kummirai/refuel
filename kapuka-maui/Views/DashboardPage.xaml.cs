using KapukaApp.ViewModels;

namespace KapukaApp.Views;

public partial class DashboardPage : ContentPage
{
    private readonly DashboardViewModel _vm;

    public DashboardPage(DashboardViewModel vm)
    {
        InitializeComponent();
        BindingContext = _vm = vm;
    }

    protected override void OnAppearing()
    {
        base.OnAppearing();
        if (_vm.RecentRequests.Count == 0)
            _vm.LoadDataCommand.Execute(null);
    }
}
