using Microsoft.AspNetCore.Mvc;
using SithSevana.Application.Settings;
using SithSevana.Domain.Settings;

namespace SithSevana.Api.Controllers;

[ApiController]
[Route("api/v1/settings")]
public sealed class SettingsController : ControllerBase
{
    private readonly SettingsService _settings;

    public SettingsController(SettingsService settings) => _settings = settings;

    [HttpGet]
    public ActionResult<CompanySettings> Get() => _settings.Get();

    [HttpPut]
    public ActionResult<CompanySettings> Put([FromBody] CompanySettings next)
    {
        if (!Request.Headers.TryGetValue("X-Role", out var role) || role != "staff")
            return StatusCode(StatusCodes.Status403Forbidden);

        try
        {
            return _settings.Update(next);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }
}
