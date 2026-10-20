using SithSevana.Application.Identity;
using SithSevana.Application.Settings;
using SithSevana.Domain.Identity;
using SithSevana.Infrastructure.Identity;
using SithSevana.Infrastructure.Settings;

namespace SithSevana.Application.Tests;

public class AuthServiceTests
{
    [Fact]
    public void Register_rejects_a_minor()
    {
        var auth = Create();
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var request = new RegisterRequest("young@sithsevana.test", "Password1", today.AddYears(-17), true);

        var error = Assert.Throws<AuthException>(() => auth.Register(request));
        Assert.Contains("18", error.Message);
    }

    [Fact]
    public void Register_requires_consent_and_creates_a_client()
    {
        var auth = Create();
        Assert.Throws<AuthException>(() => auth.Register(new RegisterRequest("a@sithsevana.test", "Password1", new DateOnly(1990, 1, 1), false)));

        var session = auth.Register(new RegisterRequest("a@sithsevana.test", "Password1", new DateOnly(1990, 1, 1), true));
        Assert.Equal(AppRole.Client, session.Role);
    }

    [Fact]
    public void Seeded_staff_sign_in_opens_the_staff_role()
    {
        var accounts = new InMemoryAccountStore();
        var passwords = new Pbkdf2PasswordHasher();
        DevAccountSeeder.Seed(accounts, passwords);
        var auth = Create(accounts, passwords);

        var session = auth.Login(new LoginRequest("staff@sithsevana.test", DevAccountSeeder.Password));
        Assert.Equal(AppRole.Staff, session.Role);
    }

    private static AuthService Create(IAccountStore? accounts = null, IPasswordHasher? passwords = null)
    {
        passwords ??= new Pbkdf2PasswordHasher();
        return new AuthService(
            accounts ?? new InMemoryAccountStore(),
            new InMemorySessionStore(),
            passwords,
            new SettingsService(new InMemoryCompanySettingsStore()),
            TimeProvider.System);
    }
}
