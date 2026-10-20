using SithSevana.Application.Settings;
using SithSevana.Domain.Identity;

namespace SithSevana.Application.Identity;

public sealed class AuthService
{
    public const string ConsentVersion = "2026-10-13";

    private readonly IAccountStore _accounts;
    private readonly ISessionStore _sessions;
    private readonly IPasswordHasher _passwords;
    private readonly SettingsService _settings;
    private readonly TimeProvider _clock;

    public AuthService(
        IAccountStore accounts,
        ISessionStore sessions,
        IPasswordHasher passwords,
        SettingsService settings,
        TimeProvider clock)
    {
        _accounts = accounts;
        _sessions = sessions;
        _passwords = passwords;
        _settings = settings;
        _clock = clock;
    }

    public AuthSession Register(RegisterRequest request)
    {
        var email = Normalize(request.Email);
        if (string.IsNullOrWhiteSpace(email) || !email.Contains('@'))
            throw new AuthException("Enter a valid email.");
        if (request.Password.Length < 8)
            throw new AuthException("Password must be at least 8 characters.");
        if (!request.AcceptedTerms)
            throw new AuthException("Accept the terms to create an account.");
        if (_accounts.FindByEmail(email) is not null)
            throw new AuthException("An account with this email already exists.");

        var today = DateOnly.FromDateTime(_clock.GetUtcNow().UtcDateTime);
        var minimumAge = _settings.Get().MinimumAge;
        if (!AdultCheck.IsAdult(request.DateOfBirth, minimumAge, today))
            throw new AuthException($"You must be {minimumAge} or older.");

        var account = new Account
        {
            Email = email,
            PasswordHash = _passwords.Hash(request.Password),
            DateOfBirth = request.DateOfBirth,
            Role = AppRole.Client,
            ConsentAcceptedAt = _clock.GetUtcNow(),
            ConsentVersion = ConsentVersion
        };
        _accounts.Add(account);
        return Issue(account);
    }

    public AuthSession Login(LoginRequest request)
    {
        var email = Normalize(request.Email);
        var account = _accounts.FindByEmail(email);
        if (account is null || !_passwords.Matches(request.Password, account.PasswordHash))
            throw new AuthException("Email or password is incorrect.");
        return Issue(account);
    }

    public void SignOut(string token) => _sessions.Revoke(token);

    public Account? FindByToken(string token)
    {
        var id = _sessions.FindAccountId(token);
        return id is null ? null : _accounts.FindById(id.Value);
    }

    private AuthSession Issue(Account account) =>
        new(_sessions.Issue(account.Id), account.Email, account.Role);

    private static string Normalize(string email) => email.Trim().ToLowerInvariant();
}
