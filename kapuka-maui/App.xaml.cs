namespace KapukaApp;

public partial class App : Application
{
	public App()
	{
		InitializeComponent();
		System.Diagnostics.Debug.WriteLine("App initialized");
		File.WriteAllText(Path.Combine(FileSystem.CacheDirectory, "kapuka_debug.txt"), "App initialized\n");
	}

	protected override Window CreateWindow(IActivationState? activationState)
	{
		System.Diagnostics.Debug.WriteLine("Creating window");
		try
		{
			var shell = new AppShell();
			var window = new Window(shell);
			System.Diagnostics.Debug.WriteLine("Window created");
			return window;
		}
		catch (Exception ex)
		{
			System.Diagnostics.Debug.WriteLine($"ERROR: {ex}");
			File.WriteAllText(Path.Combine(FileSystem.CacheDirectory, "kapuka_error.txt"), ex.ToString());
			throw;
		}
	}
}
