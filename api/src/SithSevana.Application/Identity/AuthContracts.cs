using SithSevana.Domain.Identity;

namespace SithSevana.Application.Identity;

public interface IAccountStore
{
    Account? FindByEmail(string email);
    Account? FindById(Guid id);
    void Add(Account account);
}

public interface ISessionStore
{
    string Issue(Guid accountId);
    Guid? FindAccountId(string token);
    void Revoke(string token);
}

public interface IPasswordHasher
{
    string Hash(string password);
    bool Matches(string password, string hash);
}

public sealed record RegisterRequest(string Email, string Password, DateOnly DateOfBirth, bool AcceptedTerms);

public sealed record LoginRequest(string Email, string Password);

public sealed record AuthSession(string Token, string Email, AppRole Role);

public sealed class AuthException : Exception
{
    public AuthException(string message) : base(message) { }
}
