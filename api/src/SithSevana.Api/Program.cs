using SithSevana.Application.Identity;
using SithSevana.Application.Settings;
using SithSevana.Infrastructure.Identity;
using SithSevana.Infrastructure.Settings;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddSingleton(TimeProvider.System);
builder.Services.AddSingleton<ICompanySettingsStore, InMemoryCompanySettingsStore>();
builder.Services.AddSingleton<SettingsService>();
builder.Services.AddSingleton<IAccountStore, InMemoryAccountStore>();
builder.Services.AddSingleton<ISessionStore, InMemorySessionStore>();
builder.Services.AddSingleton<IPasswordHasher, Pbkdf2PasswordHasher>();
builder.Services.AddSingleton<AuthService>();

var app = builder.Build();
DevAccountSeeder.Seed(app.Services.GetRequiredService<IAccountStore>(), app.Services.GetRequiredService<IPasswordHasher>());

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.MapGet("/health", () => Results.Ok(new { status = "ok" }));
app.MapControllers();
app.Run();

public partial class Program;
