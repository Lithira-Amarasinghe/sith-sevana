using SithSevana.Application.Identity;
using SithSevana.Domain.Identity;
using SithSevana.Domain.Supply;

namespace SithSevana.Application.Supply;

public sealed class SupplyService
{
    private readonly IApplicationStore _applications;
    private readonly IApplicationFormStore _form;
    private readonly IAccountStore _accounts;

    public SupplyService(IApplicationStore applications, IApplicationFormStore form, IAccountStore accounts)
    {
        _applications = applications;
        _form = form;
        _accounts = accounts;
    }

    public IReadOnlyList<ApplicationField> Fields() =>
        _form.All().OrderBy(field => field.SortOrder).ThenBy(field => field.Label).ToList();

    public ApplicationField AddField(string label, bool required)
    {
        var field = new ApplicationField
        {
            Label = CleanLabel(label),
            Required = required,
            SortOrder = _form.All().Count
        };
        _form.Add(field);
        return field;
    }

    public ApplicationField UpdateField(Guid id, string label, bool required)
    {
        var field = _form.Find(id) ?? throw new SupplyException("Question not found.");
        field.Label = CleanLabel(label);
        field.Required = required;
        return field;
    }

    public void RemoveField(Guid id)
    {
        if (_form.Find(id) is null)
            throw new SupplyException("Question not found.");
        _form.Remove(id);
    }

    public CounsellorApplication? Mine(Guid accountId) => _applications.FindByAccountId(accountId);

    public CounsellorApplication SaveDraft(Guid accountId, IReadOnlyList<ApplicationAnswer> answers)
    {
        var application = Editable(accountId);
        var fields = Fields();
        application.Answers = fields.Select(field => new ApplicationAnswer
        {
            FieldId = field.Id,
            Label = field.Label,
            Value = answers.FirstOrDefault(answer => answer.FieldId == field.Id)?.Value.Trim() ?? ""
        }).ToList();
        return application;
    }

    public CounsellorApplication Submit(Guid accountId)
    {
        var application = Editable(accountId);
        var fields = Fields();
        if (fields.Count == 0)
            throw new SupplyException("Staff have not added any application questions yet.");

        var missing = fields.Where(field => field.Required && string.IsNullOrWhiteSpace(Answer(application, field.Id))).ToList();
        if (missing.Count > 0)
            throw new SupplyException($"Fill in: {string.Join(", ", missing.Select(field => field.Label))}.");

        application.Answers = fields.Select(field => new ApplicationAnswer
        {
            FieldId = field.Id,
            Label = field.Label,
            Value = Answer(application, field.Id)
        }).ToList();
        application.Status = ApplicationStatus.Submitted;
        return application;
    }

    public IReadOnlyList<CounsellorApplication> Queue() =>
        _applications.All().Where(application => application.Status == ApplicationStatus.Submitted).ToList();

    public CounsellorApplication Decide(Guid id, StaffDecision decision, string? note)
    {
        var application = _applications.FindById(id) ?? throw new SupplyException("Application not found.");
        if (application.Status != ApplicationStatus.Submitted)
            throw new SupplyException("Only a submitted application can be reviewed.");

        application.StaffNote = string.IsNullOrWhiteSpace(note) ? null : note.Trim();
        application.Status = decision switch
        {
            StaffDecision.Approve => ApplicationStatus.Approved,
            StaffDecision.Reject => ApplicationStatus.Rejected,
            StaffDecision.RequestInformation when application.StaffNote is null =>
                throw new SupplyException("Tell the counsellor what is missing."),
            StaffDecision.RequestInformation => ApplicationStatus.NeedsInformation,
            _ => throw new SupplyException("Unknown decision.")
        };
        return application;
    }

    public IReadOnlyList<ApprovedCounsellor> Approved() =>
        _applications.All()
            .Where(application => application.IsApproved)
            .Select(application => new ApprovedCounsellor(application.AccountId, application.Email))
            .ToList();

    private CounsellorApplication Editable(Guid accountId)
    {
        var account = _accounts.FindById(accountId) ?? throw new SupplyException("Account not found.");
        if (account.Role != AppRole.Counsellor)
            throw new SupplyException("Only a counsellor can apply.");

        var application = _applications.FindByAccountId(accountId);
        if (application is null)
        {
            application = new CounsellorApplication { AccountId = accountId, Email = account.Email };
            _applications.Add(application);
            return application;
        }

        if (application.Status is not (ApplicationStatus.Draft or ApplicationStatus.NeedsInformation))
            throw new SupplyException("This application can no longer be edited.");
        return application;
    }

    private static string Answer(CounsellorApplication application, Guid fieldId) =>
        application.Answers.FirstOrDefault(answer => answer.FieldId == fieldId)?.Value.Trim() ?? "";

    private static string CleanLabel(string label)
    {
        var cleaned = label.Trim();
        if (cleaned.Length == 0)
            throw new SupplyException("A question needs a label.");
        return cleaned;
    }
}
