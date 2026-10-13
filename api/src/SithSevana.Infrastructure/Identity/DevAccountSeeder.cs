using SithSevana.Application.Identity;
using SithSevana.Domain.Identity;

namespace SithSevana.Infrastructure.Identity;

public static class DevAccountSeeder
{
    public const string Password = "Password1";

    public static void Seed(IAccountStore accounts, IPasswordHasher passwords)
    {
        Add(accounts, passwords, "client@sithsevana.test", AppRole.Client);
        Add(accounts, passwords, "counsellor@sithsevana.test", AppRole.Counsellor);
        Add(accounts, passwords, "staff@sithsevana.test", AppRole.Staff);
    }

    private static void Add(IAccountStore accounts, IPasswordHasher passwords, string email, AppRole role)
    {
        accounts.Add(new Account
        {
            Email = email,
            PasswordHash = passwords.Hash(Password),
            DateOfBirth = new DateOnly(1990, 1, 1),
            Role = role,
            ConsentAcceptedAt = DateTimeOffset.UnixEpoch,
            ConsentVersion = AuthService.ConsentVersion
        });
    }
}
