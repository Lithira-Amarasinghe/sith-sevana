using SithSevana.Application.Supply;
using SithSevana.Domain.Supply;

namespace SithSevana.Infrastructure.Supply;

public sealed class InMemoryApplicationFormStore : IApplicationFormStore
{
    private readonly List<ApplicationField> _fields = [];
    private readonly object _gate = new();

    public IReadOnlyList<ApplicationField> All()
    {
        lock (_gate)
            return _fields.ToList();
    }

    public ApplicationField? Find(Guid id)
    {
        lock (_gate)
            return _fields.FirstOrDefault(field => field.Id == id);
    }

    public void Add(ApplicationField field)
    {
        lock (_gate)
            _fields.Add(field);
    }

    public void Remove(Guid id)
    {
        lock (_gate)
            _fields.RemoveAll(field => field.Id == id);
    }
}