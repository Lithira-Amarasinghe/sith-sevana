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
        var token = ReadToken();
        if (token is null)
            return Unauthorized();
        _auth.SignOut(token);
        return NoContent();
    }

    [HttpGet("me")]
    public ActionResult<AuthSession> Me()
    {
        var token = ReadToken();
        if (token is null)
            return Unauthorized();
        var account = _auth.FindByToken(token);
        if (account is null)
            return Unauthorized();
        return new AuthSession(token, account.Email, account.Role);
    }

    private string? ReadToken()
    {
        var header = Request.Headers.Authorization.ToString();
        const string prefix = "Bearer ";
        return header.StartsWith(prefix, StringComparison.Ordinal) ? header[prefix.Length..] : null;
    }
}
