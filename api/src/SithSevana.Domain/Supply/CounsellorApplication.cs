namespace SithSevana.Domain.Supply;

public enum ApplicationStatus
{
    Draft,
    Submitted,
    NeedsInformation,
    Approved,
    Rejected
}

public enum StaffDecision
{
    Approve,
    Reject,
    RequestInformation
}

public sealed class ApplicationField
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public string Label { get; set; } = "";
    public bool Required { get; set; }
    public int SortOrder { get; set; }
}

public sealed class ApplicationAnswer
{
    public Guid FieldId { get; set; }
    public string Label { get; set; } = "";
    public string Value { get; set; } = "";
}

public sealed class CounsellorApplication
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public required Guid AccountId { get; init; }
    public required string Email { get; init; }
    public List<ApplicationAnswer> Answers { get; set; } = [];
    public ApplicationStatus Status { get; set; } = ApplicationStatus.Draft;
    public string? StaffNote { get; set; }

    public bool IsApproved => Status == ApplicationStatus.Approved;
}
