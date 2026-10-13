using SithSevana.Domain.Supply;

namespace SithSevana.Application.Supply;

public interface IApplicationStore
{
    CounsellorApplication? FindByAccountId(Guid accountId);
    CounsellorApplication? FindById(Guid id);
    void Add(CounsellorApplication application);
    IReadOnlyList<CounsellorApplication> All();
}

public sealed class SupplyException : Exception
{
    public SupplyException(string message) : base(message) { }
}

public sealed record ApprovedCounsellor(Guid AccountId, string Email);
