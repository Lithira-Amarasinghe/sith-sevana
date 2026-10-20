using SithSevana.Application.Supply;
using SithSevana.Domain.Supply;

namespace SithSevana.Infrastructure.Supply;

public sealed class InMemoryApplicationStore : IApplicationStore
{
    private readonly List<CounsellorApplication> _items = [];
    private readonly object _gate = new();

    public CounsellorApplication? FindByAccountId(Guid accountId)
    {
        lock (_gate)
            return _items.FirstOrDefault(item => item.AccountId == accountId);
    }

    public CounsellorApplication? FindById(Guid id)
    {
        lock (_gate)
            return _items.FirstOrDefault(item => item.Id == id);
    }

    public void Add(CounsellorApplication application)
    {
        lock (_gate)
            _items.Add(application);
    }

    public IReadOnlyList<CounsellorApplication> All()
    {
        lock (_gate)
            return _items.ToList();
    }
}
