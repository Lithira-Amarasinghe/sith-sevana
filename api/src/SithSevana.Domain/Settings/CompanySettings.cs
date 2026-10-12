namespace SithSevana.Domain.Settings;

public enum ChatAccess
{
    AnytimeAfterPick = 0,
    AroundSession = 1,
    FreeCapThenBlock = 2
}

public sealed class CompanySettings
{
    public int MinimumAge { get; set; } = 18;
    public bool FreeSessionEnabled { get; set; }
    public int SessionLengthMinutes { get; set; } = 60;
    public int BufferMinutes { get; set; } = 10;
    public int MinimumNoticeHours { get; set; } = 4;
    public int BookingHorizonDays { get; set; } = 30;
    public int SlotHoldMinutes { get; set; } = 15;
    public int JoinEarlyMinutes { get; set; } = 15;
    public int JoinLateMinutes { get; set; } = 15;
    public int CancellationHours { get; set; } = 12;
    public bool CancelFutureBookingsOnSuspension { get; set; } = true;
    public ChatAccess ChatAccess { get; set; } = ChatAccess.AnytimeAfterPick;
    public bool CardPaymentsEnabled { get; set; } = true;
    public bool BankTransferEnabled { get; set; } = true;
    public int DocumentGrantDays { get; set; } = 30;
    public bool DocumentDownloadEnabled { get; set; }
    public int MaxUploadMegabytes { get; set; } = 10;
    public bool ReviewsEnabled { get; set; } = true;
    public bool Reminder24Hours { get; set; } = true;
    public bool Reminder1Hour { get; set; } = true;
    public string CrisisPhone { get; set; } = "";

    public static CompanySettings Starting() => new();
}

public sealed record BookingTerms(decimal PriceLkr, int CancellationHours, bool FreeSession);

public static class BookingRules
{
    public static BookingTerms Capture(CompanySettings settings, decimal priceLkr, bool freeSessionApplied) =>
        new(freeSessionApplied ? 0 : priceLkr, settings.CancellationHours, freeSessionApplied);

    public static bool FullRefund(BookingTerms terms, double hoursBeforeStart) =>
        terms.FreeSession || hoursBeforeStart >= terms.CancellationHours;
}
