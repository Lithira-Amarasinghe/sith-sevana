using SithSevana.Application.Identity;
using SithSevana.Application.Supply;
using SithSevana.Domain.Identity;
using SithSevana.Domain.Supply;
using SithSevana.Infrastructure.Identity;
using SithSevana.Infrastructure.Supply;

namespace SithSevana.Application.Tests;

public class SupplyServiceTests
{
    [Fact]
    public void Only_an_approved_counsellor_is_listed()
    {
        var (supply, counsellorId) = Start();
        supply.SaveDraft(counsellorId, "I am a counsellor.");
        supply.Submit(counsellorId);
        Assert.Empty(supply.Approved());

        var pending = Assert.Single(supply.Queue());
        supply.Decide(pending.Id, StaffDecision.Approve, null);

        Assert.Empty(supply.Queue());
        Assert.Equal(counsellorId, Assert.Single(supply.Approved()).AccountId);
    }

    [Fact]
    public void Request_for_information_lets_the_counsellor_submit_again()
    {
        var (supply, counsellorId) = Start();
        supply.SaveDraft(counsellorId, "Short note.");
        supply.Submit(counsellorId);
        var id = supply.Queue().Single().Id;

        var error = Assert.Throws<SupplyException>(() => supply.Decide(id, StaffDecision.RequestInformation, " "));
        Assert.Contains("missing", error.Message);

        supply.Decide(id, StaffDecision.RequestInformation, "Add your registration number.");
        supply.SaveDraft(counsellorId, "Registration ABC-1.");
        supply.Submit(counsellorId);
        Assert.Single(supply.Queue());
    }

    [Fact]
    public void A_client_cannot_apply()
    {
        var accounts = new InMemoryAccountStore();
        var passwords = new Pbkdf2PasswordHasher();
        DevAccountSeeder.Seed(accounts, passwords);
        var supply = new SupplyService(new InMemoryApplicationStore(), accounts);
        var clientId = accounts.FindByEmail("client@sithsevana.test")!.Id;

        Assert.Throws<SupplyException>(() => supply.SaveDraft(clientId, "No."));
    }

    private static (SupplyService Supply, Guid CounsellorId) Start()
    {
        var accounts = new InMemoryAccountStore();
        var passwords = new Pbkdf2PasswordHasher();
        DevAccountSeeder.Seed(accounts, passwords);
        var supply = new SupplyService(new InMemoryApplicationStore(), accounts);
        return (supply, accounts.FindByEmail("counsellor@sithsevana.test")!.Id);
    }
}
