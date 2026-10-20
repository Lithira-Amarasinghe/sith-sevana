import { useState, type ReactNode } from "react";
import { chatRuleCopy, formatWhen, lkr, statusLabel } from "../logic";
import { useNav } from "../nav";
import { useStore } from "../store";
import type { ChatRule, Question } from "../types";
import { Area, Button, Field, Icon, Pill } from "../ui";

function Screen({ children }: { children: ReactNode }) {
  return <div className="screen-scroll">{children}</div>;
}

export function StaffHome() {
  const { data } = useStore();
  const { push } = useNav();
  const apps = data.applications.filter((item) => item.status === "submitted").length;
  const slips = data.bookings.filter((item) => item.status === "awaiting-payment").length;
  const refunds = data.bookings.filter((item) => item.status === "refund-review").length;
  const complaints = data.complaints.filter((item) => item.status === "open").length;
  const cards = [
    [apps, "Applications", "staff-counsellors"],
    [slips, "Bank slips", "staff-payments"],
    [refunds, "Refunds", "staff-payments"],
    [complaints, "Complaints", "staff-support"],
  ] as const;

  return (
    <Screen>
      <div className="pad">
        <p className="eyebrow">Staff</p>
        <h1 className="display">Needs a decision</h1>
        <p className="lede">Queues only. Private chats and client files are not part of this desk.</p>
        <div className="queue">
          {cards.map(([count, label, id]) => (
            <button key={label} onClick={() => push({ id })}>
              <strong>{count}</strong>
              <span>{label}</span>
            </button>
          ))}
        </div>
        <h3>Open now</h3>
        <div className="stack">
          {data.applications
            .filter((item) => item.status === "submitted")
            .map((item) => (
              <button key={item.id} className="list-card" onClick={() => push({ id: "application-review", applicationId: item.id })}>
                <div>
                  <strong>{item.name}</strong>
                  <span>Application to review</span>
                </div>
              </button>
            ))}
          {data.bookings
            .filter((item) => item.status === "awaiting-payment")
            .map((item) => (
              <button key={item.id} className="list-card" onClick={() => push({ id: "slip", bookingId: item.id })}>
                <div>
                  <strong>{item.clientName}</strong>
                  <span>Bank slip · {lkr(item.priceLkr)}</span>
                </div>
              </button>
            ))}
          {data.complaints
            .filter((item) => item.status === "open")
            .map((item) => (
              <button key={item.id} className="list-card" onClick={() => push({ id: "complaint", complaintId: item.id })}>
                <div>
                  <strong>{item.clientName}</strong>
                  <span>Complaint</span>
                </div>
              </button>
            ))}
        </div>
      </div>
    </Screen>
  );
}

export function StaffCounsellors() {
  const { data, suspend } = useStore();
  const { push } = useNav();
  return (
    <Screen>
      <div className="pad">
        <h1 className="display">Counsellors</h1>
        <Button tone="quiet" onClick={() => push({ id: "questions" })}>
          Edit application form
        </Button>
        <h3>Waiting</h3>
        <div className="stack">
          {data.applications.map((application) => (
            <button key={application.id} className="list-card" onClick={() => push({ id: "application-review", applicationId: application.id })}>
              <div>
                <strong>{application.name}</strong>
                <span>{application.status}</span>
              </div>
            </button>
          ))}
        </div>
        <h3>On the panel</h3>
        {data.counsellors.map((counsellor) => (
          <article key={counsellor.id} className="paper">
            <div>
              <strong>{counsellor.name}</strong>
              <p>{counsellor.pendingSetup ? "Hours not published" : lkr(counsellor.priceLkr)}</p>
              <Pill tone={counsellor.suspended ? "rose" : "green"}>{counsellor.suspended ? "Suspended" : "Visible to clients"}</Pill>
              <Button tone="ghost" onClick={() => suspend(counsellor.id)}>
                {counsellor.suspended ? "Restore" : "Suspend"}
              </Button>
            </div>
          </article>
        ))}
      </div>
    </Screen>
  );
}

export function ApplicationReview({ applicationId }: { applicationId: string }) {
  const { data, decideApplication } = useStore();
  const { pop } = useNav();
  const [note, setNote] = useState("Please add the year of the diploma.");
  const application = data.applications.find((item) => item.id === applicationId);
  if (!application) return null;
  return (
    <div className="screen-scroll pad">
      <button className="back" onClick={pop}>
        <Icon name="back" size={18} /> Back
      </button>
      <h1 className="display">{application.name}</h1>
      <p className="lede">{application.email}</p>
      {application.answers.map((answer) => (
        <article key={answer.questionId} className="paper">
          <p className="fine">{answer.question}</p>
          <strong>{answer.answer || "—"}</strong>
        </article>
      ))}
      <Area label="Note to the applicant" value={note} onChange={(event) => setNote(event.target.value)} />
      <div className="stack">
        <Button onClick={() => decideApplication(application.id, "approved")}>Approve</Button>
        <Button tone="quiet" onClick={() => decideApplication(application.id, "needs-info", note)}>
          Ask for more information
        </Button>
        <Button tone="ghost" onClick={() => decideApplication(application.id, "rejected", note)}>
          Reject
        </Button>
      </div>
    </div>
  );
}

export function QuestionsScreen() {
  const { data, setQuestions } = useStore();
  const { pop } = useNav();
  function update(questions: Question[]) {
    setQuestions(questions);
  }
  return (
    <div className="screen-scroll pad">
      <button className="back" onClick={pop}>
        <Icon name="back" size={18} /> Back
      </button>
      <h1 className="display">Application form</h1>
      <p className="lede">New applications use this wording. One already submitted keeps the questions it was sent with.</p>
      {data.questions.map((question) => (
        <article key={question.id} className="paper">
          <Field
            label="Question"
            value={question.text}
            onChange={(event) =>
              update(data.questions.map((item) => (item.id === question.id ? { ...item, text: event.target.value } : item)))
            }
          />
          <label className="check">
            <input
              type="checkbox"
              checked={question.required}
              onChange={(event) =>
                update(data.questions.map((item) => (item.id === question.id ? { ...item, required: event.target.checked } : item)))
              }
            />
            <span>Required</span>
          </label>
          <Button tone="ghost" onClick={() => update(data.questions.filter((item) => item.id !== question.id))}>
            Remove
          </Button>
        </article>
      ))}
      <Button
        onClick={() =>
          update([...data.questions, { id: `q-${Date.now()}`, text: "New question", required: false }])
        }
      >
        Add question
      </Button>
    </div>
  );
}

export function PaymentsScreen() {
  const { data } = useStore();
  const { push } = useNav();
  const slips = data.bookings.filter((booking) => booking.status === "awaiting-payment" || booking.status === "payment-rejected");
  const refunds = data.bookings.filter((booking) => booking.status === "refund-review" || booking.status === "refunded");
  return (
    <Screen>
      <div className="pad">
        <h1 className="display">Payments</h1>
        <h3>Bank slips</h3>
        {slips.map((booking) => (
          <button key={booking.id} className="list-card" onClick={() => push({ id: "slip", bookingId: booking.id })}>
            <div>
              <strong>{booking.clientName}</strong>
              <span>
                {lkr(booking.priceLkr)} · {statusLabel(booking.status)}
              </span>
            </div>
          </button>
        ))}
        <h3>Refunds</h3>
        {refunds.map((booking) => (
          <article key={booking.id} className="paper">
            <strong>{booking.clientName}</strong>
            <p>
              {lkr(booking.priceLkr)} · {statusLabel(booking.status)}
            </p>
            <p className="fine">{formatWhen(booking.startsAt)}</p>
          </article>
        ))}
      </div>
    </Screen>
  );
}

export function SlipScreen({ bookingId }: { bookingId: string }) {
  const { data, markPaid, rejectSlip } = useStore();
  const { pop } = useNav();
  const booking = data.bookings.find((item) => item.id === bookingId);
  if (!booking) return null;
  return (
    <div className="screen-scroll pad">
      <button className="back" onClick={pop}>
        <Icon name="back" size={18} /> Payments
      </button>
      <h1 className="display">{booking.clientName}</h1>
      <div className="slip">
        <p>SAMPLE SLIP</p>
        <strong>{lkr(booking.priceLkr)}</strong>
        <span>{booking.slipName ?? "No file name"}</span>
        <span>{formatWhen(booking.createdAt)}</span>
      </div>
      <p className="fine">Mark paid is what confirms the booking. The upload alone does not.</p>
      {booking.status === "confirmed" ? (
        <Pill tone="green">Confirmed</Pill>
      ) : booking.status === "payment-rejected" ? (
        <Pill tone="rose">Slip rejected. The client can upload another.</Pill>
      ) : (
        <div className="row">
          <Button onClick={() => markPaid(booking.id)}>Mark paid</Button>
          <Button tone="ghost" onClick={() => rejectSlip(booking.id)}>
            Reject slip
          </Button>
        </div>
      )}
    </div>
  );
}

export function SupportScreen() {
  const { data, hideReview } = useStore();
  const { push } = useNav();
  const reviews = data.bookings.filter((booking) => booking.review);
  return (
    <Screen>
      <div className="pad">
        <h1 className="display">Support</h1>
        <h3>Complaints</h3>
        {data.complaints.map((complaint) => (
          <button key={complaint.id} className="list-card" onClick={() => push({ id: "complaint", complaintId: complaint.id })}>
            <div>
              <strong>{complaint.clientName}</strong>
              <span>
                {complaint.counsellorName} · {complaint.status}
              </span>
            </div>
          </button>
        ))}
        <h3>Reviews</h3>
        {reviews.map((booking) => (
          <article key={booking.id} className="paper">
            <strong>
              {booking.clientName} · {booking.review?.stars} stars
            </strong>
            <p>{booking.review?.text}</p>
            <Button tone="ghost" onClick={() => hideReview(booking.id)}>
              {booking.review?.hidden ? "Restore review" : "Hide review"}
            </Button>
          </article>
        ))}
        {reviews.length === 0 && <p className="quiet">No reviews yet. A completed session can leave one.</p>}
      </div>
    </Screen>
  );
}

export function ComplaintScreen({ complaintId }: { complaintId: string }) {
  const { data, closeComplaint } = useStore();
  const { pop } = useNav();
  const complaint = data.complaints.find((item) => item.id === complaintId);
  if (!complaint) return null;
  return (
    <div className="screen-scroll pad">
      <button className="back" onClick={pop}>
        <Icon name="back" size={18} /> Support
      </button>
      <Pill tone={complaint.status === "open" ? "amber" : "ink"}>{complaint.status}</Pill>
      <h1 className="display">{complaint.clientName}</h1>
      <p className="lede">About a session with {complaint.counsellorName}</p>
      <div className="terms">
        <p>{complaint.text}</p>
      </div>
      <p className="fine">The chat and any documents stay closed. This note is the whole record for staff.</p>
      {complaint.status === "open" && <Button onClick={() => closeComplaint(complaint.id)}>Mark closed</Button>}
    </div>
  );
}

const rules: { id: ChatRule; label: string }[] = [
  { id: "after-choose", label: "After they choose a counsellor" },
  { id: "after-paid", label: "After a booking is confirmed" },
  { id: "during-session", label: "Only during the session window" },
  { id: "after-session", label: "After a session is completed" },
];

export function SettingsScreen() {
  const { data, patchSettings, signOut } = useStore();
  const { setRole } = useNav();
  const settings = data.settings;
  return (
    <Screen>
      <div className="pad">
        <h1 className="display">Company rules</h1>
        <p className="lede">Changes apply to the next booking or the next new conversation.</p>
        <Stepper label="Session length (minutes)" value={settings.sessionMinutes} min={30} step={15} onChange={(sessionMinutes) => patchSettings({ sessionMinutes })} />
        <Stepper label="Full refund if cancelled more than (hours)" value={settings.cancelHours} min={1} step={1} onChange={(cancelHours) => patchSettings({ cancelHours })} />
        <Stepper label="Booking notice (hours)" value={settings.bookingNoticeHours} min={0} step={1} onChange={(bookingNoticeHours) => patchSettings({ bookingNoticeHours })} />
        <Stepper label="Join opens (minutes before)" value={settings.joinMinutesBefore} min={0} step={5} onChange={(joinMinutesBefore) => patchSettings({ joinMinutesBefore })} />
        <Stepper label="Document access (days)" value={settings.grantDays} min={1} step={1} onChange={(grantDays) => patchSettings({ grantDays })} />
        <Toggle label="Free first session" on={settings.freeSession} onClick={() => patchSettings({ freeSession: !settings.freeSession })} />
        <Toggle label="Card payments" on={settings.cardEnabled} onClick={() => patchSettings({ cardEnabled: !settings.cardEnabled })} />
        <Toggle label="Bank transfer" on={settings.bankEnabled} onClick={() => patchSettings({ bankEnabled: !settings.bankEnabled })} />
        <h3>When a client may send a message</h3>
        <div className="stack">
          {rules.map((rule) => (
            <button key={rule.id} className={settings.chatRule === rule.id ? "choice on" : "choice"} onClick={() => patchSettings({ chatRule: rule.id })}>
              <span>
                <strong>{rule.label}</strong>
                <em>{chatRuleCopy(rule.id)}</em>
              </span>
            </button>
          ))}
        </div>
        <Field label="Crisis line label" value={settings.crisisLabel} onChange={(event) => patchSettings({ crisisLabel: event.target.value })} />
        <Field label="Crisis phone" value={settings.crisisPhone} onChange={(event) => patchSettings({ crisisPhone: event.target.value })} />
        <div className="terms">
          <h3>Later, not this version</h3>
          <p>Public videos and an information-only doctor list stay out until the core visit works.</p>
        </div>
        <Button
          tone="ghost"
          onClick={() => {
            signOut();
            setRole(null);
          }}
        >
          Sign out
        </Button>
      </div>
    </Screen>
  );
}

function Stepper({ label, value, min, step, onChange }: { label: string; value: number; min: number; step: number; onChange: (value: number) => void }) {
  return (
    <div className="stepper">
      <span>{label}</span>
      <div>
        <button onClick={() => onChange(Math.max(min, value - step))} aria-label={`Decrease ${label}`}>
          −
        </button>
        <strong>{value}</strong>
        <button onClick={() => onChange(value + step)} aria-label={`Increase ${label}`}>
          +
        </button>
      </div>
    </div>
  );
}

function Toggle({ label, on, onClick }: { label: string; on: boolean; onClick: () => void }) {
  return (
    <button className="toggle" onClick={onClick} aria-pressed={on}>
      <span>{label}</span>
      <strong>{on ? "On" : "Off"}</strong>
    </button>
  );
}

export function staffScreen(id: string, route: { applicationId?: string; bookingId?: string; complaintId?: string }) {
  switch (id) {
    case "staff-home":
      return <StaffHome />;
    case "staff-counsellors":
      return <StaffCounsellors />;
    case "application-review":
      return <ApplicationReview applicationId={route.applicationId ?? ""} />;
    case "questions":
      return <QuestionsScreen />;
    case "staff-payments":
      return <PaymentsScreen />;
    case "slip":
      return <SlipScreen bookingId={route.bookingId ?? ""} />;
    case "staff-support":
      return <SupportScreen />;
    case "complaint":
      return <ComplaintScreen complaintId={route.complaintId ?? ""} />;
    case "staff-settings":
      return <SettingsScreen />;
    default:
      return null;
  }
}
