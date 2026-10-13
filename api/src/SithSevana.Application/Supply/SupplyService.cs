using SithSevana.Application.Identity;
using SithSevana.Domain.Identity;
using SithSevana.Domain.Supply;

namespace SithSevana.Application.Supply;

public sealed class SupplyService
{
    private readonly IApplicationStore _applications;
    private readonly IAccountStore _accounts;

    public SupplyService(IApplicationStore applications, IAccountStore accounts)
    {
        _applications = applications;
        _accounts = accounts;
    }

    public CounsellorApplication? Mine(Guid accountId) => _applications.FindByAccountId(accountId);

    public CounsellorApplication SaveDraft(Guid accountId, string statement)
    {
        var application = Editable(accountId);
        application.Statement = statement.Trim();
        return application;
    }

    public CounsellorApplication Submit(Guid accountId)
    {
        var application = Editable(accountId);
        if (string.IsNullOrWhiteSpace(application.Statement))
            throw new SupplyException("Write a short application before submitting.");
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
}
