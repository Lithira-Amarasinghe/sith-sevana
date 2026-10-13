using SithSevana.Domain.Settings;

namespace SithSevana.Application.Settings;

public sealed class SettingsService
{
    private readonly ICompanySettingsStore _store;

    public SettingsService(ICompanySettingsStore store) => _store = store;

    public CompanySettings Get() => _store.Get();

    public CompanySettings Update(CompanySettings next)
    {
        Validate(next);
        _store.Save(next);
        return _store.Get();
    }

    public static void Validate(CompanySettings settings)
    {
        if (settings.MinimumAge < 18)
            throw new ArgumentException("Minimum age cannot be under 18 in this version.");
        if (settings.SessionLengthMinutes is < 15 or > 180)
            throw new ArgumentException("Session length must be between 15 and 180 minutes.");
        if (settings.CancellationHours < 0)
            throw new ArgumentException("Cancellation window cannot be negative.");
        if (settings.SlotHoldMinutes is < 5 or > 60)
            throw new ArgumentException("Slot hold must be between 5 and 60 minutes.");
        if (!settings.CardPaymentsEnabled && !settings.BankTransferEnabled)
            throw new ArgumentException("At least one payment method must stay on.");
        if (settings.DocumentGrantDays is < 1 or > 365)
            throw new ArgumentException("Document share length must be between 1 and 365 days.");
        if (!Enum.IsDefined(settings.ChatAccess))
            throw new ArgumentException("Unknown chat rule.");
    }
}
