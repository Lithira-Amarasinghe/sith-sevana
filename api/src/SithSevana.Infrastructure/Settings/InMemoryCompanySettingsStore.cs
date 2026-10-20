using SithSevana.Application.Settings;
using SithSevana.Domain.Settings;

namespace SithSevana.Infrastructure.Settings;

public sealed class InMemoryCompanySettingsStore : ICompanySettingsStore
{
    private CompanySettings _current = CompanySettings.Starting();
    private readonly object _gate = new();

    public CompanySettings Get()
    {
        lock (_gate)
        {
            return Copy(_current);
        }
    }

    public void Save(CompanySettings settings)
    {
        lock (_gate)
        {
            _current = Copy(settings);
        }
    }

    private static CompanySettings Copy(CompanySettings source) => new()
    {
        MinimumAge = source.MinimumAge,
        FreeSessionEnabled = source.FreeSessionEnabled,
        SessionLengthMinutes = source.SessionLengthMinutes,
        BufferMinutes = source.BufferMinutes,
        MinimumNoticeHours = source.MinimumNoticeHours,
        BookingHorizonDays = source.BookingHorizonDays,
        SlotHoldMinutes = source.SlotHoldMinutes,
        JoinEarlyMinutes = source.JoinEarlyMinutes,
        JoinLateMinutes = source.JoinLateMinutes,
        CancellationHours = source.CancellationHours,
        CancelFutureBookingsOnSuspension = source.CancelFutureBookingsOnSuspension,
        ChatAccess = source.ChatAccess,
        CardPaymentsEnabled = source.CardPaymentsEnabled,
        BankTransferEnabled = source.BankTransferEnabled,
        DocumentGrantDays = source.DocumentGrantDays,
        DocumentDownloadEnabled = source.DocumentDownloadEnabled,
        MaxUploadMegabytes = source.MaxUploadMegabytes,
        ReviewsEnabled = source.ReviewsEnabled,
        Reminder24Hours = source.Reminder24Hours,
        Reminder1Hour = source.Reminder1Hour,
        CrisisPhone = source.CrisisPhone
    };
}
