using Microsoft.AspNetCore.Mvc;
using SithSevana.Application.Identity;
using SithSevana.Application.Supply;
using SithSevana.Domain.Identity;
using SithSevana.Domain.Supply;

namespace SithSevana.Api.Controllers;

[ApiController]
[Route("api/v1")]
public sealed class SupplyController : ControllerBase
{
    private readonly AuthService _auth;
    private readonly SupplyService _supply;

    public SupplyController(AuthService auth, SupplyService supply)
    {
        _auth = auth;
        _supply = supply;
    }

    [HttpGet("applications/mine")]
    public ActionResult<CounsellorApplication> Mine()
    {
        var denied = Only(AppRole.Counsellor);
        if (denied is not null) return denied;
        var application = _supply.Mine(Current()!.Id);
        return application is null ? NoContent() : application;
    }

    [HttpGet("application-fields")]
    public ActionResult<IReadOnlyList<ApplicationField>> Fields() =>
        Current() is null ? Unauthorized() : Ok(_supply.Fields());

    [HttpPost("application-fields")]
    public ActionResult<ApplicationField> AddField([FromBody] FieldBody body) =>
        FieldAct(() => _supply.AddField(body.Label, body.Required));

    [HttpPut("application-fields/{id:guid}")]
    public ActionResult<ApplicationField> UpdateField(Guid id, [FromBody] FieldBody body) =>
        FieldAct(() => _supply.UpdateField(id, body.Label, body.Required));

    [HttpDelete("application-fields/{id:guid}")]
    public IActionResult RemoveField(Guid id)
    {
        var denied = Only(AppRole.Staff);
        if (denied is not null) return denied;
        try
        {
            _supply.RemoveField(id);
            return NoContent();
        }
        catch (SupplyException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPut("applications/mine")]
    public ActionResult<CounsellorApplication> Save([FromBody] AnswersBody body) =>
        Act(account => _supply.SaveDraft(account.Id, body.Answers), AppRole.Counsellor);

    [HttpPost("applications/mine/submit")]
    public ActionResult<CounsellorApplication> Submit() =>
        Act(account => _supply.Submit(account.Id), AppRole.Counsellor);

    [HttpPut("identity/me")]
    public ActionResult<IdentityView> SaveIdentity([FromBody] IdentityBody body)
    {
        var denied = Only(AppRole.Counsellor);
        if (denied is not null) return denied;
        try
        {
            var account = _supply.SaveIdentity(Current()!.Id, body.DisplayName, body.PhoneNumber);
            return new IdentityView(account.Email, account.DisplayName, account.PhoneNumber, account.DateOfBirth);
        }
        catch (SupplyException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpGet("applications/queue")]
    public ActionResult<IReadOnlyList<ApplicationReview>> Queue()
    {
        var denied = Only(AppRole.Staff);
        return denied ?? Ok(_supply.Queue());
    }

    [HttpPost("applications/{id:guid}/decide")]
    public ActionResult<CounsellorApplication> Decide(Guid id, [FromBody] DecisionBody body) =>
        Act(_ => _supply.Decide(id, body.Decision, body.Note), AppRole.Staff);

    [HttpGet("counsellors")]
    public ActionResult<IReadOnlyList<ApprovedCounsellor>> Approved() =>
        Current() is null ? Unauthorized() : Ok(_supply.Approved());

    private ActionResult<T> Act<T>(Func<Account, T> action, AppRole role) where T : class
    {
        var denied = Only(role);
        if (denied is not null) return denied;
        try
        {
            return action(Current()!);
        }
        catch (SupplyException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    private ActionResult? Only(AppRole role)
    {
        var account = Current();
        if (account is null) return Unauthorized();
        return account.Role == role ? null : StatusCode(StatusCodes.Status403Forbidden);
    }

    private ActionResult<ApplicationField> FieldAct(Func<ApplicationField> action)
    {
        var denied = Only(AppRole.Staff);
        if (denied is not null) return denied;
        try
        {
            return action();
        }
        catch (SupplyException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    private Account? Current() => CurrentAccount.From(Request, _auth);
}

public sealed record IdentityBody(string DisplayName, string PhoneNumber);
public sealed record IdentityView(string Email, string DisplayName, string PhoneNumber, DateOnly DateOfBirth);
public sealed record AnswersBody(List<ApplicationAnswer> Answers);
public sealed record FieldBody(string Label, bool Required);
public sealed record DecisionBody(StaffDecision Decision, string? Note);
