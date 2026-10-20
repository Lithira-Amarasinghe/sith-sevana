using System.Security.Cryptography;
using SithSevana.Application.Identity;
using SithSevana.Domain.Identity;

namespace SithSevana.Infrastructure.Identity;

public sealed class InMemoryAccountStore : IAccountStore
{
    private readonly Dictionary<string, Account> _byEmail = new(StringComparer.Ordinal);
    private readonly Dictionary<Guid, Account> _byId = new();
    private readonly object _gate = new();

    public Account? FindByEmail(string email)
    {
        lock (_gate)
            return _byEmail.GetValueOrDefault(email);
    }

    public Account? FindById(Guid id)
    {
        lock (_gate)
            return _byId.GetValueOrDefault(id);
    }

    public void Add(Account account)
    {
        lock (_gate)
        {
            _byEmail[account.Email] = account;
            _byId[account.Id] = account;
        }
    }
}

public sealed class InMemorySessionStore : ISessionStore
{
    private readonly Dictionary<string, Guid> _tokens = new();
    private readonly object _gate = new();

    public string Issue(Guid accountId)
    {
        var token = Convert.ToHexString(RandomNumberGenerator.GetBytes(32));
        lock (_gate)
            _tokens[token] = accountId;
        return token;
    }

    public Guid? FindAccountId(string token)
    {
        lock (_gate)
            return _tokens.TryGetValue(token, out var id) ? id : null;
    }

    public void Revoke(string token)
    {
        lock (_gate)
            _tokens.Remove(token);
    }
}

public sealed class Pbkdf2PasswordHasher : IPasswordHasher
{
    public string Hash(string password)
    {
        var salt = RandomNumberGenerator.GetBytes(16);
        var hash = Rfc2898DeriveBytes.Pbkdf2(password, salt, 100_000, HashAlgorithmName.SHA256, 32);
        return $"{Convert.ToBase64String(salt)}.{Convert.ToBase64String(hash)}";
    }

    public bool Matches(string password, string stored)
    {
        var parts = stored.Split('.');
        if (parts.Length != 2)
            return false;
        var salt = Convert.FromBase64String(parts[0]);
        var expected = Convert.FromBase64String(parts[1]);
        var actual = Rfc2898DeriveBytes.Pbkdf2(password, salt, 100_000, HashAlgorithmName.SHA256, 32);
        return CryptographicOperations.FixedTimeEquals(actual, expected);
    }
}
