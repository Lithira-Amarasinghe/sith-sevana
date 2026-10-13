namespace SithSevana.Domain.Identity;

public enum AppRole
{
    Client = 0,
    Counsellor = 1,
    Staff = 2
}

public sealed class Account
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public required string Email { get; init; }
    public required string PasswordHash { get; init; }
    public required DateOnly DateOfBirth { get; init; }
    public required AppRole Role { get; init; }
    public required DateTimeOffset ConsentAcceptedAt { get; init; }
    public required string ConsentVersion { get; init; }
}

public static class AdultCheck
{
    public static bool IsAdult(DateOnly dateOfBirth, int minimumAge, DateOnly today)
    {
        var age = today.Year - dateOfBirth.Year;
        if (dateOfBirth > today.AddYears(-age))
            age--;
        return age >= minimumAge;
    }
}
