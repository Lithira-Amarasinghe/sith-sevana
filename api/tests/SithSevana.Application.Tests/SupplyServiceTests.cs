using SithSevana.Application.Identity;
using SithSevana.Application.Supply;
using SithSevana.Domain.Supply;
using SithSevana.Infrastructure.Identity;
using SithSevana.Infrastructure.Supply;

namespace SithSevana.Application.Tests;

public class SupplyServiceTests
{
    [Fact]
    public void Required_answers_follow_the_questions_staff_set()
    {
        var (supply, counsellorId) = Start();
        supply.SaveIdentity(counsellorId, "Nimal Perera", "0771234567");
        var name = supply.AddField("Full name", required: true);
        supply.AddField("Registration number", required: false);

        supply.SaveDraft(counsellorId, [Answer(name.Id, "")]);
        var missing = Assert.Throws<SupplyException>(() => supply.Submit(counsellorId));
        Assert.Contains("Full name", missing.Message);

        supply.SaveDraft(counsellorId, [Answer(name.Id, "Nimal")]);
        supply.Submit(counsellorId);
        Assert.Single(supply.Queue());
    }

    [Fact]
    public void A_submitted_application_keeps_the_question_wording()
    {
        var (supply, counsellorId) = Start();
        supply.SaveIdentity(counsellorId, "Nimal Perera", "0771234567");
        var name = supply.AddField("Full name", required: true);
        supply.SaveDraft(counsellorId, [Answer(name.Id, "Nimal")]);
        supply.Submit(counsellorId);

        supply.UpdateField(name.Id, "Legal name", required: true);

        Assert.Equal("Full name", supply.Queue().Single().Answers.Single().Label);
        Assert.Equal("Nimal", supply.Queue().Single().Answers.Single().Value);
    }

    [Fact]
    public void Only_an_approved_counsellor_is_listed()
    {
        var (supply, counsellorId) = Start();
        supply.SaveIdentity(counsellorId, "Nimal Perera", "0771234567");
        var name = supply.AddField("Full name", required: true);
        supply.SaveDraft(counsellorId, [Answer(name.Id, "Nimal")]);
        supply.Submit(counsellorId);
        var review = supply.Queue().Single();
        Assert.Equal("Nimal Perera", review.DisplayName);
        Assert.Equal("0771234567", review.PhoneNumber);
        Assert.Equal(new DateOnly(1990, 1, 1), review.DateOfBirth);
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
        supply.SaveIdentity(counsellorId, "Nimal Perera", "0771234567");
        var name = supply.AddField("Full name", required: true);
        supply.SaveDraft(counsellorId, [Answer(name.Id, "Nimal")]);
        supply.Submit(counsellorId);
        var id = supply.Queue().Single().Id;

        var error = Assert.Throws<SupplyException>(() => supply.Decide(id, StaffDecision.RequestInformation, " "));
        Assert.Contains("missing", error.Message);

        supply.Decide(id, StaffDecision.RequestInformation, "Add your registration number.");
        supply.AddField("Registration number", required: true);
        var registration = supply.Fields().Single(field => field.Label == "Registration number");
        supply.SaveDraft(counsellorId, [Answer(name.Id, "Nimal"), Answer(registration.Id, "ABC-1")]);
        supply.Submit(counsellorId);
        Assert.Single(supply.Queue());
    }

    [Fact]
    public void A_client_cannot_apply()
    {
        var accounts = new InMemoryAccountStore();
        var passwords = new Pbkdf2PasswordHasher();
        DevAccountSeeder.Seed(accounts, passwords);
        var supply = new SupplyService(new InMemoryApplicationStore(), new InMemoryApplicationFormStore(), accounts);
        var clientId = accounts.FindByEmail("client@sithsevana.test")!.Id;

        Assert.Throws<SupplyException>(() => supply.SaveDraft(clientId, []));
    }

    private static ApplicationAnswer Answer(Guid fieldId, string value) => new() { FieldId = fieldId, Value = value };

    private static (SupplyService Supply, Guid CounsellorId) Start()
    {
        var accounts = new InMemoryAccountStore();
        var passwords = new Pbkdf2PasswordHasher();
        DevAccountSeeder.Seed(accounts, passwords);
        var supply = new SupplyService(new InMemoryApplicationStore(), new InMemoryApplicationFormStore(), accounts);
        return (supply, accounts.FindByEmail("counsellor@sithsevana.test")!.Id);
    }
}
