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

    [HttpPut("applications/mine")]
    public ActionResult<CounsellorApplication> Save([FromBody] StatementBody body) =>
        Act(account => _supply.SaveDraft(account.Id, body.Statement), AppRole.Counsellor);

    [HttpPost("applications/mine/submit")]
    public ActionResult<CounsellorApplication> Submit() =>
        Act(account => _supply.Submit(account.Id), AppRole.Counsellor);

    [HttpGet("applications/queue")]
    public ActionResult<IReadOnlyList<CounsellorApplication>> Queue()
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

    private ActionResult<CounsellorApplication> Act(Func<Account, CounsellorApplication> action, AppRole role)
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

    private Account? Current() => CurrentAccount.From(Request, _auth);
}

public sealed record StatementBody(string Statement);
public sealed record DecisionBody(StaffDecision Decision, string? Note);
