using SithSevana.Application.Settings;
using SithSevana.Domain.Settings;
using SithSevana.Infrastructure.Settings;

namespace SithSevana.Application.Tests;

public class SettingsAndBookingTermsTests
{
    [Fact]
    public void Starting_values_match_the_agreed_defaults()
    {
        var settings = new SettingsService(new InMemoryCompanySettingsStore()).Get();

        Assert.Equal(18, settings.MinimumAge);
        Assert.False(settings.FreeSessionEnabled);
        Assert.Equal(60, settings.SessionLengthMinutes);
        Assert.Equal(12, settings.CancellationHours);
        Assert.Equal(ChatAccess.AnytimeAfterPick, settings.ChatAccess);
        Assert.True(settings.CardPaymentsEnabled);
        Assert.True(settings.BankTransferEnabled);
        Assert.Equal(30, settings.DocumentGrantDays);
        Assert.False(settings.DocumentDownloadEnabled);
    }

    [Fact]
    public void Confirmed_booking_keeps_the_cancellation_window_it_was_quoted()
    {
        var store = new InMemoryCompanySettingsStore();
        var service = new SettingsService(store);
        var quoted = BookingRules.Capture(service.Get(), priceLkr: 5000, freeSessionApplied: false);

        var updated = service.Get();
        updated.CancellationHours = 2;
        service.Update(updated);

        var quotedAgain = BookingRules.Capture(service.Get(), priceLkr: 5000, freeSessionApplied: false);

        Assert.False(BookingRules.FullRefund(quoted, hoursBeforeStart: 10));
        Assert.True(BookingRules.FullRefund(quotedAgain, hoursBeforeStart: 10));
        Assert.Equal(12, quoted.CancellationHours);
    }

    [Fact]
    public void Both_payment_methods_cannot_be_turned_off()
    {
        var service = new SettingsService(new InMemoryCompanySettingsStore());
        var next = service.Get();
        next.CardPaymentsEnabled = false;
        next.BankTransferEnabled = false;

        Assert.Throws<ArgumentException>(() => service.Update(next));
    }
}
