using System.Text.Json.Serialization;
using SithSevana.Application.Identity;
using SithSevana.Application.Settings;
using SithSevana.Application.Supply;
using SithSevana.Infrastructure.Identity;
using SithSevana.Infrastructure.Settings;
using SithSevana.Infrastructure.Supply;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers().AddJsonOptions(options =>
    options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter()));
builder.Services.AddCors(options => options.AddDefaultPolicy(policy =>
    policy.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod()));
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddSingleton(TimeProvider.System);
builder.Services.AddSingleton<ICompanySettingsStore, InMemoryCompanySettingsStore>();
builder.Services.AddSingleton<SettingsService>();
builder.Services.AddSingleton<IAccountStore, InMemoryAccountStore>();
builder.Services.AddSingleton<ISessionStore, InMemorySessionStore>();
builder.Services.AddSingleton<IPasswordHasher, Pbkdf2PasswordHasher>();
builder.Services.AddSingleton<AuthService>();
builder.Services.AddSingleton<IApplicationStore, InMemoryApplicationStore>();
builder.Services.AddSingleton<IApplicationFormStore, InMemoryApplicationFormStore>();
builder.Services.AddSingleton<SupplyService>();

var app = builder.Build();
DevAccountSeeder.Seed(app.Services.GetRequiredService<IAccountStore>(), app.Services.GetRequiredService<IPasswordHasher>());

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors();

app.MapGet("/health", () => Results.Ok(new { status = "ok" }));
app.MapControllers();
app.Run();

public partial class Program;
