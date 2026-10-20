using SithSevana.Application.Identity;
using SithSevana.Domain.Identity;

namespace SithSevana.Api;

public static class CurrentAccount
{
    public static Account? From(HttpRequest request, AuthService auth)
    {
        var header = request.Headers.Authorization.ToString();
        const string prefix = "Bearer ";
        if (!header.StartsWith(prefix, StringComparison.Ordinal))
            return null;
        return auth.FindByToken(header[prefix.Length..]);
    }
}
