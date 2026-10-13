using Microsoft.AspNetCore.Mvc;
using SithSevana.Application.Identity;

namespace SithSevana.Api.Controllers;

[ApiController]
[Route("api/v1/auth")]
public sealed class AuthController : ControllerBase
{
    private readonly AuthService _auth;

    public AuthController(AuthService auth) => _auth = auth;

    [HttpPost("register")]
    public ActionResult<AuthSession> Register([FromBody] RegisterRequest request)
    {
        try
        {
            return _auth.Register(request);
        }
        catch (AuthException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPost("login")]
    public ActionResult<AuthSession> Login([FromBody] LoginRequest request)
    {
        try
        {
            return _auth.Login(request);
        }
        catch (AuthException ex)
        {
            return Unauthorized(new { error = ex.Message });
        }
    }

    [HttpPost("sign-out")]
    public IActionResult SignOutSession()
    {
        var account = CurrentAccount.From(Request, _auth);
        if (account is null)
            return Unauthorized();
        var token = Request.Headers.Authorization.ToString()["Bearer ".Length..];
        _auth.SignOut(token);
        return NoContent();
    }

    [HttpGet("me")]
    public ActionResult<AuthSession> Me()
    {
        var account = CurrentAccount.From(Request, _auth);
        if (account is null)
            return Unauthorized();
        var token = Request.Headers.Authorization.ToString()["Bearer ".Length..];
        return new AuthSession(token, account.Email, account.Role);
    }
}
