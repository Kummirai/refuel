using KapukaApp.ViewModels;

namespace KapukaApp.Views;

public partial class NewRequestPage : ContentPage
{
    public NewRequestPage(NewRequestViewModel vm)
    {
        InitializeComponent();
        BindingContext = vm;
    }
}
