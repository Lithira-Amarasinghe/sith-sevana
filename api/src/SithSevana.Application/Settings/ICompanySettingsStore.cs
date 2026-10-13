using SithSevana.Domain.Settings;

namespace SithSevana.Application.Settings;

public interface ICompanySettingsStore
{
    CompanySettings Get();
    void Save(CompanySettings settings);
}
