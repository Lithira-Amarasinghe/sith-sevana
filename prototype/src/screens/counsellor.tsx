import { useState, type ReactNode } from "react";
import { accessLabel, formatWhen, grantIsActive, inSessionWindow, lkr, minutesOf, timesInWindow, weekdayName } from "../logic";
import { useNav } from "../nav";
import { useStore } from "../store";
import type { Slot } from "../types";
import { Area, Avatar, Button, Empty, Field, Icon, Pill } from "../ui";
import { DocumentReader, MessagesScreen } from "./client";

function Screen({ children, footer }: { children: ReactNode; footer?: ReactNode }) {
  return (
    <>
      <div className="screen-scroll">{children}</div>
      {footer}
    </>
  );
}

export function TodayScreen() {
  const { data, completeBooking } = useStore();
  const { push } = useNav();
  const mine = data.bookings
    .filter((booking) => booking.counsellorId === "nadeesha" && ["confirmed", "completed", "awaiting-payment"].includes(booking.status))
    .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
  const today = mine.filter((booking) => {
    const start = new Date(booking.startsAt);
    const now = new Date();
    return start.toDateString() === now.toDateString() || inSessionWindow(booking, data.settings);
  });

  return (
    <Screen>
      <div className="pad">
        <p className="eyebrow">Counsellor</p>
        <h1 className="display">Today</h1>
        <p className="lede">Sessions that need you. Nothing here is a clinical note.</p>
        {today.length === 0 && <Empty title="A clear day" body="New bookings will appear as they are confirmed." />}
        <div className="stack">
          {today.map((booking) => {
            const open = booking.status === "confirmed" && inSessionWindow(booking, data.settings);
            return (
              <article key={booking.id} className="paper">
                <div>
                  <strong>{booking.clientName}</strong>
                  <p>{formatWhen(booking.startsAt)} · {booking.minutes} min</p>
                  <Pill tone={open ? "green" : booking.status === "awaiting-payment" ? "amber" : "ink"}>
                    {open ? "Open to join" : booking.status === "awaiting-payment" ? "Waiting for payment" : "Confirmed"}
                  </Pill>
                  <div className="row">
                    {open && <Button onClick={() => push({ id: "lobby", bookingId: booking.id })}>Join</Button>}
                    {booking.status === "confirmed" && new Date(booking.startsAt).getTime() < Date.now() && (
                      <Button tone="quiet" onClick={() => completeBooking(booking.id)}>
                        Mark complete
                      </Button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
        <h3>Coming up</h3>
        {mine
          .filter((booking) => new Date(booking.startsAt).getTime() > Date.now())
          .map((booking) => (
            <p key={booking.id} className="quiet">
              {booking.clientName} · {formatWhen(booking.startsAt)}
            </p>
          ))}
      </div>
    </Screen>
  );
}

const CLOCK = Array.from({ length: 25 }, (_, index) => {
  const hour = 8 + Math.floor(index / 2);
  const minute = index % 2 === 0 ? "00" : "30";
  return `${String(hour).padStart(2, "0")}:${minute}`;
}).filter((time) => minutesOf(time) <= 20 * 60);

export function CalendarScreen() {
  const { data, setSlots } = useStore();
  const counsellor = data.counsellors.find((item) => item.id === "nadeesha");
  const [day, setDay] = useState(new Date().getDay());
  const [start, setStart] = useState("09:00");
  const [end, setEnd] = useState("12:00");
  const [warning, setWarning] = useState<string | null>(null);
  if (!counsellor) return null;
  const person = counsellor;
  const windows = person.slots.filter((slot) => slot.weekday === day);
  const bookable = windows.flatMap((window) => timesInWindow(window.start, window.end, data.settings.sessionMinutes));

  function addWindow() {
    if (minutesOf(end) <= minutesOf(start)) {
      setWarning("The end needs to be after the start.");
      return;
    }
    const overlap = windows.some((window) => minutesOf(start) < minutesOf(window.end) && minutesOf(end) > minutesOf(window.start));
    if (overlap) {
      setWarning("That range overlaps hours already on this day.");
      return;
    }
    const slots: Slot[] = [...person.slots, { weekday: day, start, end }];
    setSlots(person.id, slots);
    setWarning(null);
  }

  return (
    <Screen>
      <div className="pad">
        <h1 className="display">Hours</h1>
        <p className="lede">
          Set the blocks of time you can work. Clients see separate {data.settings.sessionMinutes}-minute sessions inside those blocks. A time that is already booked disappears from their list.
        </p>
        <div className="chips">
          {[1, 2, 3, 4, 5, 6, 0].map((value) => (
            <button key={value} className={value === day ? "chip on" : "chip"} onClick={() => setDay(value)}>
              {weekdayName(value).slice(0, 3)}
            </button>
          ))}
        </div>
        <h3>{weekdayName(day)}</h3>
        {windows.length === 0 && <p className="quiet">No hours on this day. Clients cannot book it.</p>}
        <div className="stack">
          {windows.map((window) => (
            <article key={`${window.start}-${window.end}`} className="paper">
              <strong>
                {window.start} – {window.end}
              </strong>
              <p className="fine">{timesInWindow(window.start, window.end, data.settings.sessionMinutes).join(", ") || "Too short for one session."}</p>
              <Button
                tone="ghost"
                onClick={() =>
                  setSlots(
                    person.id,
                    person.slots.filter((slot) => !(slot.weekday === day && slot.start === window.start && slot.end === window.end)),
                  )
                }
              >
                Remove
              </Button>
            </article>
          ))}
        </div>
        <div className="window-add">
          <label>
            From
            <select value={start} onChange={(event) => setStart(event.target.value)}>
              {CLOCK.map((time) => (
                <option key={time}>{time}</option>
              ))}
            </select>
          </label>
          <label>
            To
            <select value={end} onChange={(event) => setEnd(event.target.value)}>
              {CLOCK.map((time) => (
                <option key={time}>{time}</option>
              ))}
            </select>
          </label>
        </div>
        {warning && <p className="error">{warning}</p>}
        <Button onClick={addWindow}>Add these hours</Button>
        {bookable.length > 0 && <p className="fine">Clients can book {bookable.join(", ")} on {weekdayName(day)}s, unless a session is already held.</p>}
      </div>
    </Screen>
  );
}

export function ClientsScreen() {
  const { data } = useStore();
  const { push } = useNav();
  const names = new Map<string, string>();
  for (const booking of data.bookings) {
    if (booking.counsellorId === "nadeesha") names.set(booking.clientId, booking.clientName);
  }
  return (
    <Screen>
      <div className="pad">
        <h1 className="display">Clients</h1>
        <p className="lede">People with a session. There is no notes field in this version.</p>
        <div className="stack">
          {[...names.entries()].map(([id, name]) => (
            <button key={id} className="list-card" onClick={() => push({ id: "client", counsellorId: id })}>
              <strong>{name}</strong>
              <span>Shared files and sessions</span>
            </button>
          ))}
        </div>
      </div>
    </Screen>
  );
}

export function ClientRecord({ clientId }: { clientId: string }) {
  const { data, ensureThread, sendMessage } = useStore();
  const { pop, push } = useNav();
  const name = data.bookings.find((booking) => booking.clientId === clientId)?.clientName ?? "Client";
  const sessions = data.bookings.filter((booking) => booking.clientId === clientId && booking.counsellorId === "nadeesha");
  const files = data.documents.flatMap((doc) => {
    const grant = doc.grants.find((item) => doc.clientId === clientId && item.counsellorId === "nadeesha" && grantIsActive(item));
    return grant ? [{ doc, grant }] : [];
  });

  return (
    <div className="screen-scroll pad">
      <button className="back" onClick={pop}>
        <Icon name="back" size={18} /> Clients
      </button>
      <h1 className="display">{name}</h1>
      <h3>Sessions</h3>
      {sessions.map((booking) => (
        <p key={booking.id}>
          {formatWhen(booking.startsAt)} · {booking.status}
        </p>
      ))}
      <h3>Files shared with you</h3>
      {files.length === 0 && <p className="quiet">Nothing shared with you. You cannot see the rest of their vault.</p>}
      {files.map(({ doc, grant }) => (
        <article key={doc.id} className="paper">
          <strong>{doc.name}</strong>
          <p>
            {doc.kind} · {doc.sizeLabel}
          </p>
          <p className="fine">
            {accessLabel(grant.access)}
            {grant.until ? ` · until ${formatWhen(grant.until)}` : " · until they end it"}
          </p>
          <DocumentReader doc={doc} />
        </article>
      ))}
      <Button
        tone="quiet"
        onClick={() => {
          const threadId = ensureThread("nadeesha", clientId, name);
          sendMessage(threadId, "counsellor", "If you are comfortable, you can share a document from your vault. You can also decline.");
          push({ id: "chat", threadId });
        }}
      >
        Ask for a document
      </Button>
    </div>
  );
}

export function CounsellorProfileScreen() {
  const { data, setPrice, signOut } = useStore();
  const { setRole } = useNav();
  const counsellor = data.counsellors.find((item) => item.id === "nadeesha");
  const [fee, setFee] = useState(String(counsellor?.priceLkr ?? ""));
  if (!counsellor) return null;
  return (
    <Screen>
      <div className="pad">
        <p className="eyebrow">Approved</p>
        <div className="profile-head">
          <Avatar name={counsellor.name} hue={counsellor.hue} size={64} />
          <div>
            <h1 className="display">{counsellor.name}</h1>
            <p>{counsellor.credentials}</p>
          </div>
        </div>
        <p>{counsellor.bio}</p>
        <Field label="Fee per session (LKR)" value={fee} onChange={(event) => setFee(event.target.value)} />
        <Button
          onClick={() => {
            const price = Number(fee);
            if (price > 0) setPrice(counsellor.id, price);
          }}
        >
          Save fee · now {lkr(counsellor.priceLkr)}
        </Button>
        <p className="fine">Clients see this fee on new bookings. A booking already made keeps its own fee.</p>
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

export function ApplicationScreen() {
  const { data, saveApplication, signOut } = useStore();
  const { setRole } = useNav();
  const application = data.applications.find((item) => item.email === "thilini@sithsevana.test");
  const editable = !application || application.status === "draft" || application.status === "needs-info";
  const [answers, setAnswers] = useState<Record<string, string>>(() => {
    const seed: Record<string, string> = {};
    for (const answer of application?.answers ?? []) seed[answer.questionId] = answer.answer;
    return seed;
  });
  const missing = data.questions.some((question) => question.required && !(answers[question.id] ?? "").trim());

  return (
    <Screen>
      <div className="pad">
        <p className="eyebrow">Counsellor application</p>
        <h1 className="display">{application?.status === "approved" ? "You are approved" : "Your application"}</h1>
        <Status applicationStatus={application?.status ?? "draft"} />
        {application?.staffNote && <p className="error">{application.staffNote}</p>}
        {application?.status === "approved" && <p>You can set your fee and hours. Until hours are published, clients cannot book you.</p>}
        {editable
          ? data.questions.map((question) => (
              <Area
                key={question.id}
                label={question.text}
                value={answers[question.id] ?? ""}
                onChange={(event) => setAnswers((current) => ({ ...current, [question.id]: event.target.value }))}
              />
            ))
          : application?.answers.map((answer) => (
              <Area key={answer.questionId} label={answer.question} value={answer.answer} readOnly />
            ))}
        {editable && (
          <div className="row">
            <Button tone="quiet" onClick={() => saveApplication(Object.entries(answers).map(([questionId, answer]) => ({ questionId, answer })), false)}>
              Save draft
            </Button>
            <Button
              disabled={missing}
              onClick={() => saveApplication(Object.entries(answers).map(([questionId, answer]) => ({ questionId, answer })), true)}
            >
              Submit
            </Button>
          </div>
        )}
        {application?.status === "submitted" && <p className="fine">Submitted wording is kept, even if staff later edit the form.</p>}
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

function Status({ applicationStatus }: { applicationStatus: string }) {
  const steps = ["draft", "submitted", "approved"];
  return (
    <div className="steps">
      {steps.map((step) => (
        <span key={step} className={step === applicationStatus || (applicationStatus === "needs-info" && step === "submitted") ? "step on" : "step"}>
          {applicationStatus === "rejected" && step === "approved" ? "rejected" : step}
        </span>
      ))}
    </div>
  );
}

export function LockedScreen() {
  const { open } = useNav();
  return (
    <div className="screen-scroll pad">
      <h1 className="display">After approval</h1>
      <p className="lede">Today, hours, messages, and your fee open once Sith Sevana approves the application.</p>
      <Button onClick={() => open({ id: "application" })}>Back to application</Button>
    </div>
  );
}

export function counsellorScreen(id: string, clientId?: string) {
  switch (id) {
    case "locked":
      return <LockedScreen />;
    case "today":
      return <TodayScreen />;
    case "calendar":
      return <CalendarScreen />;
    case "messages":
      return <MessagesScreen />;
    case "clients":
      return <ClientsScreen />;
    case "client":
      return <ClientRecord clientId={clientId ?? ""} />;
    case "cprofile":
      return <CounsellorProfileScreen />;
    case "application":
      return <ApplicationScreen />;
    case "chat":
    case "lobby":
      return null;
    default:
      return null;
  }
}
