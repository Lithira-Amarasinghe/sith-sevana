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

public sealed class CounsellorApplication
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public required Guid AccountId { get; init; }
    public required string Email { get; init; }
    public string Statement { get; set; } = "";
    public ApplicationStatus Status { get; set; } = ApplicationStatus.Draft;
    public string? StaffNote { get; set; }

    public bool IsApproved => Status == ApplicationStatus.Approved;
}
