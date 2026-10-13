using SithSevana.Domain.Supply;

namespace SithSevana.Application.Supply;

public interface IApplicationStore
{
    CounsellorApplication? FindByAccountId(Guid accountId);
    CounsellorApplication? FindById(Guid id);
    void Add(CounsellorApplication application);
    IReadOnlyList<CounsellorApplication> All();
}

public interface IApplicationFormStore
{
    IReadOnlyList<ApplicationField> All();
    ApplicationField? Find(Guid id);
    void Add(ApplicationField field);
    void Remove(Guid id);
}

public sealed class SupplyException : Exception
{
    public SupplyException(string message) : base(message) { }
}

public sealed record ApprovedCounsellor(Guid AccountId, string Email);
