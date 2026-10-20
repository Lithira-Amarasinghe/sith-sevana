import { useState, type ReactNode } from "react";
import {
  CLIENT_ID,
  chatRuleCopy,
  clientCanSend,
  documentVisibleToCounsellor,
  formatTime,
  formatWhen,
  grantUntil,
  greeting,
  hoursUntil,
  inSessionWindow,
  lkr,
  openings,
  quote,
  statusLabel,
} from "../logic";
import { useNav } from "../nav";
import { useStore } from "../store";
import type { Booking } from "../types";
import { Area, Avatar, Button, Empty, Field, Icon, Pill, Stars } from "../ui";

function useCounsellor(id?: string) {
  const { data } = useStore();
  return data.counsellors.find((counsellor) => counsellor.id === id);
}

function Screen({ children, footer }: { children: ReactNode; footer?: ReactNode }) {
  return (
    <>
      <div className="screen-scroll">{children}</div>
      {footer}
    </>
  );
}

export function ClientHome() {
  const { data, user, ensureThread } = useStore();
  const { push } = useNav();
  const mine = data.bookings
    .filter((booking) => booking.clientId === CLIENT_ID)
    .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
  const current = mine.find((booking) => booking.status === "confirmed" && inSessionWindow(booking, data.settings));
  const upcoming = mine.filter((booking) => booking.status === "confirmed" && new Date(booking.startsAt).getTime() > Date.now());
  const hero = current ?? upcoming[0];
  const first = user?.name.split(" ")[0] ?? "there";

  return (
    <Screen>
      <div className="pad home">
        <p className="eyebrow">Sith Sevana</p>
        <h1 className="display">
          {greeting()},
          <br />
          {first}
        </h1>
        {hero ? (
          <article className="session-hero">
            <p className="eyebrow light">{current ? "Happening now" : "Next session"}</p>
            <h2>{formatWhen(hero.startsAt)}</h2>
            <p>{data.counsellors.find((item) => item.id === hero.counsellorId)?.name}</p>
            <p className="quiet">{hero.minutes} minutes · {lkr(hero.priceLkr)}</p>
            <div className="row">
              <Button onClick={() => push(current ? { id: "lobby", bookingId: hero.id } : { id: "session", bookingId: hero.id })}>
                {current ? "Join session" : "View session"}
              </Button>
              <Button
                tone="quiet"
                className="on-dark"
                onClick={() => {
                  const threadId = ensureThread(hero.counsellorId);
                  push({ id: "chat", threadId });
                }}
              >
                Message
              </Button>
            </div>
          </article>
        ) : (
          <article className="session-hero quiet-hero">
            <h2>No session booked</h2>
            <p>When you are ready, choose someone to talk with.</p>
            <Button onClick={() => push({ id: "counsellors" })}>Find a counsellor</Button>
          </article>
        )}
        <div className="privacy-note">
          <Icon name="shield" size={18} />
          <p>Calls are private to you and your counsellor. Staff cannot read messages or open your files.</p>
        </div>
        <div className="twin">
          <button className="mini" onClick={() => push({ id: "counsellors" })}>
            <Icon name="people" />
            <strong>Find someone</strong>
            <span>By concern and language</span>
          </button>
          <button className="mini" onClick={() => push({ id: "documents" })}>
            <Icon name="file" />
            <strong>Documents</strong>
            <span>{data.documents.filter((doc) => doc.clientId === CLIENT_ID && doc.sharedWith && !doc.revoked).length} shared</span>
          </button>
        </div>
        {upcoming.length > 1 && (
          <section>
            <h3>Also coming up</h3>
            {upcoming.slice(current ? 0 : 1).map((booking) => (
              <BookingRow key={booking.id} booking={booking} />
            ))}
          </section>
        )}
        <Crisis />
      </div>
    </Screen>
  );
}

function Crisis() {
  const { data } = useStore();
  return (
    <a className="crisis" href={`tel:${data.settings.crisisPhone}`}>
      <span>
        <strong>If you need help now</strong>
        <em>
          {data.settings.crisisLabel} · {data.settings.crisisPhone}
        </em>
      </span>
      <Icon name="phone" />
    </a>
  );
}

function BookingRow({ booking }: { booking: Booking }) {
  const { data } = useStore();
  const { push } = useNav();
  const counsellor = data.counsellors.find((item) => item.id === booking.counsellorId);
  return (
    <button className="list-card" onClick={() => push({ id: "session", bookingId: booking.id })}>
      <div>
        <strong>{counsellor?.name}</strong>
        <span>{formatWhen(booking.startsAt)}</span>
      </div>
      <Pill tone={booking.status === "confirmed" ? "green" : booking.status === "awaiting-payment" ? "amber" : "ink"}>
        {statusLabel(booking.status)}
      </Pill>
    </button>
  );
}

export function CounsellorList() {
  const { data } = useStore();
  const { push } = useNav();
  const [query, setQuery] = useState("");
  const [focus, setFocus] = useState("All");
  const focuses = ["All", ...new Set(data.counsellors.flatMap((counsellor) => counsellor.focus))];
  const visible = data.counsellors.filter((counsellor) => {
    if (counsellor.suspended) return false;
    const blob = `${counsellor.name} ${counsellor.focus.join(" ")} ${counsellor.languages.join(" ")}`.toLowerCase();
    if (query && !blob.includes(query.toLowerCase())) return false;
    if (focus !== "All" && !counsellor.focus.includes(focus)) return false;
    return true;
  });

  return (
    <Screen>
      <div className="pad">
        <h1 className="display">Counsellors</h1>
        <p className="lede">Qualified professionals. You can read a profile before you book.</p>
        <label className="search">
          <Icon name="search" size={18} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by name or concern" />
        </label>
        <div className="chips">
          {focuses.map((item) => (
            <button key={item} className={item === focus ? "chip on" : "chip"} onClick={() => setFocus(item)}>
              {item}
            </button>
          ))}
        </div>
        {visible.length === 0 && <Empty title="No one matches" body="Try another concern, or clear the search." />}
        <div className="stack">
          {visible.map((counsellor) => {
            const next = openings(counsellor, data.bookings, data.settings)[0];
            return (
              <button key={counsellor.id} className="person" onClick={() => push({ id: "counsellor", counsellorId: counsellor.id })}>
                <Avatar name={counsellor.name} hue={counsellor.hue} />
                <span>
                  <strong>{counsellor.name}</strong>
                  <em>{counsellor.credentials}</em>
                  <em>{counsellor.focus.join(" · ")}</em>
                  <em>
                    {counsellor.languages.join(" · ")}
                    {counsellor.pendingSetup ? " · Profile in progress" : ` · ${lkr(counsellor.priceLkr)}`}
                  </em>
                </span>
                <span className="person-side">
                  {counsellor.rating > 0 && <Stars value={counsellor.rating} />}
                  <small>{next ? formatWhen(next.startsAt) : "No openings"}</small>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </Screen>
  );
}

export function CounsellorProfile({ id }: { id: string }) {
  const counsellor = useCounsellor(id);
  const { data } = useStore();
  const { ensureThread } = useStore();
  const { pop, push } = useNav();
  const slots = counsellor ? openings(counsellor, data.bookings, data.settings).slice(0, 6) : [];
  if (!counsellor) return <Empty title="Not available" body="This counsellor is not on the panel." />;
  const price = quote(counsellor, data.bookings, data.settings);

  return (
    <Screen
      footer={
        <div className="dock">
          <Button
            tone="quiet"
            onClick={() => {
              const threadId = ensureThread(counsellor.id);
              push({ id: "chat", threadId });
            }}
          >
            Message
          </Button>
          <Button disabled={counsellor.pendingSetup} onClick={() => push({ id: "book", counsellorId: counsellor.id, slot: slots[0]?.startsAt })}>
            Book
          </Button>
        </div>
      }
    >
      <div className="pad">
        <button className="back" onClick={pop}>
          <Icon name="back" size={18} /> Counsellors
        </button>
        <div className="profile-head">
          <Avatar name={counsellor.name} hue={counsellor.hue} size={72} />
          <div>
            <h1 className="display">{counsellor.name}</h1>
            <p>{counsellor.credentials}</p>
            {counsellor.rating > 0 && (
              <p className="quiet">
                {counsellor.rating.toFixed(1)} from {counsellor.reviewCount} reviews
              </p>
            )}
          </div>
        </div>
        <div className="chips">
          {counsellor.focus.map((item) => (
            <span key={item} className="chip on">
              {item}
            </span>
          ))}
          {counsellor.languages.map((item) => (
            <span key={item} className="chip">
              {item}
            </span>
          ))}
        </div>
        <p>{counsellor.bio}</p>
        <h3>How a session feels</h3>
        <p>{counsellor.approach}</p>
        <div className="facts">
          <div>
            <span>Length</span>
            <strong>{price.minutes} min</strong>
          </div>
          <div>
            <span>Fee</span>
            <strong>{counsellor.pendingSetup ? "Not set" : price.free ? "Free first session" : lkr(price.priceLkr ?? 0)}</strong>
          </div>
          <div>
            <span>Cancel</span>
            <strong>{price.cancelHours}h</strong>
          </div>
        </div>
        <h3>Next openings</h3>
        {slots.length === 0 && <p className="quiet">No bookable hours yet.</p>}
        <div className="chips">
          {slots.map((slot) => (
            <button key={slot.startsAt} className="chip" onClick={() => push({ id: "book", counsellorId: counsellor.id, slot: slot.startsAt })}>
              {formatWhen(slot.startsAt)}
            </button>
          ))}
        </div>
      </div>
    </Screen>
  );
}

export function BookScreen({ counsellorId, slot }: { counsellorId: string; slot?: string }) {
  const counsellor = useCounsellor(counsellorId);
  const { data, createBooking } = useStore();
  const { pop, push } = useNav();
  const choices = counsellor ? openings(counsellor, data.bookings, data.settings) : [];
  const [selected, setSelected] = useState(slot && choices.some((item) => item.startsAt === slot) ? slot : choices[0]?.startsAt);
  const [accepted, setAccepted] = useState(false);
  const [method, setMethod] = useState<"card" | "bank">(data.settings.cardEnabled ? "card" : "bank");
  if (!counsellor) return null;
  const price = quote(counsellor, data.bookings, data.settings);
  const methods = [
    data.settings.cardEnabled ? "card" : null,
    data.settings.bankEnabled ? "bank" : null,
  ].filter(Boolean) as Array<"card" | "bank">;
  const chosen = method && methods.includes(method) ? method : methods[0];

  function confirm() {
    if (!selected || !accepted) return;
    if (price.free || price.priceLkr === 0) {
      const id = createBooking({ counsellorId, startsAt: selected, method: "free" });
      push({ id: "session", bookingId: id });
      return;
    }
    if (chosen === "card") {
      push({ id: "pay", counsellorId, slot: selected, method: "card" });
      return;
    }
    push({ id: "pay", counsellorId, slot: selected, method: "bank" });
  }

  return (
    <Screen
      footer={
        <div className="dock">
          <Button disabled={!selected || !accepted || (!price.free && methods.length === 0)} onClick={confirm}>
            {price.free ? "Confirm free session" : "Continue to payment"}
          </Button>
        </div>
      }
    >
      <div className="pad">
        <button className="back" onClick={pop}>
          <Icon name="back" size={18} /> Back
        </button>
        <h1 className="display">Review</h1>
        <p className="lede">
          {counsellor.name} · {price.minutes} minutes
        </p>
        <div className="chips">
          {choices.slice(0, 8).map((item) => (
            <button key={item.startsAt} className={item.startsAt === selected ? "chip on" : "chip"} onClick={() => setSelected(item.startsAt)}>
              {formatWhen(item.startsAt)}
            </button>
          ))}
        </div>
        <div className="terms">
          <p>
            <strong>{price.free ? "No fee for this first session." : lkr(price.priceLkr ?? 0)}</strong>
          </p>
          <p>Cancel more than {price.cancelHours} hours ahead for a full refund. Later cancellations are reviewed by staff.</p>
          <p>This is a counselling conversation. It is not a medical diagnosis and not an emergency service.</p>
          <p>The fee and the cancellation window stay with this booking, even if the company rules change later.</p>
        </div>
        {!price.free && methods.length === 0 && <p className="error">Payments are paused. Please contact Sith Sevana before booking.</p>}
        {!price.free && methods.length > 0 && (
          <div className="stack">
            {methods.map((item) => (
              <button key={item} className={chosen === item ? "choice on" : "choice"} onClick={() => setMethod(item)}>
                <Icon name={item === "card" ? "card" : "file"} />
                <span>
                  <strong>{item === "card" ? "Card" : "Bank transfer"}</strong>
                  <em>{item === "card" ? "Confirmed when the payment succeeds." : "Confirmed only after staff check the slip."}</em>
                </span>
              </button>
            ))}
          </div>
        )}
        <label className="check">
          <input type="checkbox" checked={accepted} onChange={(event) => setAccepted(event.target.checked)} />
          <span>I accept this fee and these cancellation terms.</span>
        </label>
      </div>
    </Screen>
  );
}

export function PayScreen({ counsellorId, slot, method }: { counsellorId: string; slot?: string; method?: "card" | "bank" }) {
  const { createBooking } = useStore();
  const { pop, open } = useNav();
  const [name, setName] = useState("Sanduni Wickramasinghe");
  const [card, setCard] = useState("4242 4242 4242 4242");
  const [slip, setSlip] = useState("bank-slip.jpg");
  if (!slot || !method) return null;

  return (
    <Screen
      footer={
        <div className="dock">
          <Button
            onClick={() => {
              const id = createBooking({
                counsellorId,
                startsAt: slot,
                method,
                slipName: method === "bank" ? slip : undefined,
              });
              open({ id: "session", bookingId: id });
            }}
          >
            {method === "card" ? "Pay and confirm" : "Submit slip"}
          </Button>
        </div>
      }
    >
      <div className="pad">
        <button className="back" onClick={pop}>
          <Icon name="back" size={18} /> Back
        </button>
        <h1 className="display">{method === "card" ? "Card payment" : "Bank transfer"}</h1>
        {method === "bank" ? (
          <>
            <div className="terms">
              <p>Sample account for this preview.</p>
              <p>
                <strong>Sith Sevana</strong>
                <br />
                Commercial Bank · 1234567890
                <br />
                Reference: your name and the session date
              </p>
            </div>
            <Field label="Slip file name" value={slip} onChange={(event) => setSlip(event.target.value)} />
            <p className="fine">Uploading a slip keeps the booking as waiting. It is confirmed only when staff mark it paid.</p>
          </>
        ) : (
          <>
            <Field label="Name on card" value={name} onChange={(event) => setName(event.target.value)} />
            <Field label="Card number" value={card} onChange={(event) => setCard(event.target.value)} />
            <p className="fine">A stand-in form. No payment is taken in this preview.</p>
          </>
        )}
      </div>
    </Screen>
  );
}

export function SessionsScreen() {
  const { data } = useStore();
  const mine = data.bookings.filter((booking) => booking.clientId === CLIENT_ID);
  const upcoming = mine.filter((booking) => !["completed", "cancelled", "refunded"].includes(booking.status));
  const past = mine.filter((booking) => ["completed", "cancelled", "refunded"].includes(booking.status));
  return (
    <Screen>
      <div className="pad">
        <h1 className="display">Sessions</h1>
        <h3>Upcoming</h3>
        {upcoming.length === 0 && <Empty title="Nothing booked" body="A confirmed session will wait for you here." />}
        <div className="stack">{upcoming.map((booking) => <BookingRow key={booking.id} booking={booking} />)}</div>
        <h3>Earlier</h3>
        <div className="stack">{past.map((booking) => <BookingRow key={booking.id} booking={booking} />)}</div>
      </div>
    </Screen>
  );
}

export function SessionScreen({ bookingId }: { bookingId: string }) {
  const { data, cancelBooking, addReview, addComplaint, replaceSlip, ensureThread } = useStore();
  const { pop, push } = useNav();
  const booking = data.bookings.find((item) => item.id === bookingId);
  const counsellor = data.counsellors.find((item) => item.id === booking?.counsellorId);
  const [stars, setStars] = useState(5);
  const [text, setText] = useState("");
  const [complaint, setComplaint] = useState("");
  const [slip, setSlip] = useState("new-slip.jpg");
  if (!booking || !counsellor) return <Empty title="Session missing" body="It may have been reset." />;
  const open = booking.status === "confirmed" && inSessionWindow(booking, data.settings);
  const future = new Date(booking.startsAt).getTime() > Date.now();
  const fullRefund = hoursUntil(booking.startsAt) >= booking.cancelHours;

  return (
    <Screen
      footer={
        open ? (
          <div className="dock">
            <Button onClick={() => push({ id: "lobby", bookingId: booking.id })}>Join session</Button>
          </div>
        ) : undefined
      }
    >
      <div className="pad">
        <button className="back" onClick={pop}>
          <Icon name="back" size={18} /> Sessions
        </button>
        <Pill tone={booking.status === "confirmed" ? "green" : booking.status === "awaiting-payment" ? "amber" : "ink"}>{statusLabel(booking.status)}</Pill>
        <h1 className="display">{counsellor.name}</h1>
        <p className="lede">{formatWhen(booking.startsAt)}</p>
        <div className="facts">
          <div>
            <span>Length</span>
            <strong>{booking.minutes} min</strong>
          </div>
          <div>
            <span>Fee</span>
            <strong>{booking.priceLkr === 0 ? "Free" : lkr(booking.priceLkr)}</strong>
          </div>
          <div>
            <span>Paid by</span>
            <strong>{booking.paymentMethod ?? "—"}</strong>
          </div>
        </div>
        <p className="quiet">Cancel more than {booking.cancelHours} hours ahead for a full refund. These are the terms you accepted.</p>
        {!open && booking.status === "confirmed" && future && (
          <p className="fine">Join opens {data.settings.joinMinutesBefore} minutes before the start. Calls are not recorded.</p>
        )}
        {booking.status === "payment-rejected" && (
          <>
            <p className="error">The slip was not accepted. Upload another. The booking stays unconfirmed until staff mark it paid.</p>
            <Field label="New slip" value={slip} onChange={(event) => setSlip(event.target.value)} />
            <Button onClick={() => replaceSlip(booking.id, slip)}>Send new slip</Button>
          </>
        )}
        {future && !["cancelled", "refunded", "completed", "refund-review"].includes(booking.status) && (
          <Button
            tone="ghost"
            onClick={() => {
              cancelBooking(booking.id);
              pop();
            }}
          >
            {booking.status === "confirmed" ? (fullRefund ? "Cancel for a full refund" : "Cancel · refund needs review") : "Cancel booking"}
          </Button>
        )}
        <Button
          tone="quiet"
          onClick={() => {
            const threadId = ensureThread(counsellor.id);
            push({ id: "chat", threadId });
          }}
        >
          Open messages
        </Button>
        {booking.status === "completed" && !booking.review && (
          <section className="terms">
            <h3>How was the session?</h3>
            <div className="chips">
              {[1, 2, 3, 4, 5].map((value) => (
                <button key={value} className={value === stars ? "chip on" : "chip"} onClick={() => setStars(value)}>
                  {value}
                </button>
              ))}
            </div>
            <Area label="A few words" value={text} onChange={(event) => setText(event.target.value)} />
            <Button
              onClick={() => {
                if (text.trim()) addReview(booking.id, stars, text.trim());
              }}
            >
              Send review
            </Button>
          </section>
        )}
        {booking.review && <p className="quiet">You reviewed this session. {booking.review.stars} stars.</p>}
        {booking.status === "completed" && (
          <section>
            <h3>Something to raise?</h3>
            <Area label="Complaint" value={complaint} onChange={(event) => setComplaint(event.target.value)} />
            <p className="fine">Staff can read this note. They cannot open the chat or your files.</p>
            <Button
              tone="quiet"
              onClick={() => {
                if (!complaint.trim()) return;
                addComplaint(booking.id, complaint.trim());
                setComplaint("");
              }}
            >
              Send to staff
            </Button>
          </section>
        )}
      </div>
    </Screen>
  );
}

export function LobbyScreen({ bookingId }: { bookingId: string }) {
  const { data } = useStore();
  const { pop } = useNav();
  const booking = data.bookings.find((item) => item.id === bookingId);
  const counsellor = data.counsellors.find((item) => item.id === booking?.counsellorId);
  const [live, setLive] = useState(false);
  const [camera, setCamera] = useState(false);
  const [mic, setMic] = useState(true);
  if (!booking || !counsellor) return null;

  return (
    <div className={live ? "call live" : "call"}>
      <button className="back light" onClick={pop}>
        <Icon name="back" size={18} /> Leave
      </button>
      <Avatar name={counsellor.name} hue={counsellor.hue} size={96} />
      <h1>{counsellor.name}</h1>
      <p>{live ? "Connected · sample call" : "Ready when you are"}</p>
      <p className="fine light">{camera ? "Camera on" : "Camera off"} · {mic ? "Microphone on" : "Muted"} · Not recorded</p>
      <div className="call-controls">
        <button onClick={() => setMic((value) => !value)} aria-label="Microphone">
          <Icon name="mic" />
        </button>
        <button onClick={() => setCamera((value) => !value)} aria-label="Camera">
          <Icon name="video" />
        </button>
        {live ? (
          <button className="end" onClick={() => setLive(false)}>
            End
          </button>
        ) : (
          <button className="join" onClick={() => setLive(true)}>
            Join
          </button>
        )}
      </div>
      <p className="fine light">Only you and {counsellor.name.split(" ")[0]} can be in this room.</p>
    </div>
  );
}

export function MessagesScreen() {
  const { data, user } = useStore();
  const { push } = useNav();
  const mine = data.threads.filter((thread) => (user?.role === "counsellor" ? thread.counsellorId === "nadeesha" : thread.clientId === CLIENT_ID));
  return (
    <Screen>
      <div className="pad">
        <h1 className="display">Messages</h1>
        <p className="lede">One conversation with each counsellor.</p>
        {mine.length === 0 && <Empty title="No conversations" body="A thread opens when you choose a counsellor." />}
        <div className="stack">
          {mine.map((thread) => {
            const counsellor = data.counsellors.find((item) => item.id === thread.counsellorId);
            const last = thread.messages[thread.messages.length - 1];
            const title = user?.role === "counsellor" ? thread.clientName : counsellor?.name;
            return (
              <button key={thread.id} className="list-card" onClick={() => push({ id: "chat", threadId: thread.id })}>
                <div>
                  <strong>{title}</strong>
                  <span>{last ? last.text : "No messages yet"}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </Screen>
  );
}

export function ChatScreen({ threadId }: { threadId: string }) {
  const { data, user, sendMessage } = useStore();
  const { pop } = useNav();
  const [text, setText] = useState("");
  const active = data.threads.find((item) => item.id === threadId);
  const counsellor = data.counsellors.find((item) => item.id === active?.counsellorId);
  const from = user?.role === "counsellor" ? "counsellor" : "client";
  const gate = active ? clientCanSend(active, data.bookings, data.settings) : { ok: false, reason: "" };
  const allowed = from === "counsellor" || gate.ok;

  if (!active || !counsellor) {
    return (
      <div className="pad">
        <button className="back" onClick={pop}>
          <Icon name="back" size={18} /> Back
        </button>
        <Empty title="No conversation yet" body="Open a counsellor and choose Message." />
      </div>
    );
  }

  return (
    <Screen
      footer={
        <form
          className="composer"
          onSubmit={(event) => {
            event.preventDefault();
            if (!allowed || !text.trim()) return;
            sendMessage(active.id, from, text.trim());
            setText("");
          }}
        >
          <p>{chatRuleCopy(active.ruleAtOpen)}</p>
          {!allowed && <p className="error">{gate.reason}</p>}
          <div className="composer-row">
            <input value={text} onChange={(event) => setText(event.target.value)} placeholder={allowed ? "Write a message" : "Sending is paused"} disabled={!allowed} />
            <Button disabled={!allowed || !text.trim()} type="submit">
              Send
            </Button>
          </div>
        </form>
      }
    >
      <div className="pad">
        <button className="back" onClick={pop}>
          <Icon name="back" size={18} /> Messages
        </button>
        <h1 className="display">{from === "counsellor" ? active.clientName : counsellor.name}</h1>
        <div className="thread">
          {active.messages.map((message) => (
            <p key={message.id} className={message.from === from ? "bubble mine" : "bubble"}>
              {message.text}
              <time>{formatTime(message.at)}</time>
            </p>
          ))}
        </div>
      </div>
    </Screen>
  );
}

export function DocumentsScreen() {
  const { data, addDocument, shareDocument, revokeDocument } = useStore();
  const { pop } = useNav();
  const [sharing, setSharing] = useState<string | null>(null);
  const [name, setName] = useState("Letter.pdf");
  const docs = data.documents.filter((doc) => doc.clientId === CLIENT_ID);
  const partners = data.counsellors.filter((counsellor) =>
    data.bookings.some((booking) => booking.clientId === CLIENT_ID && booking.counsellorId === counsellor.id) ||
    data.threads.some((thread) => thread.clientId === CLIENT_ID && thread.counsellorId === counsellor.id),
  );

  return (
    <Screen>
      <div className="pad">
        <button className="back" onClick={pop}>
          <Icon name="back" size={18} /> Back
        </button>
        <h1 className="display">Documents</h1>
        <p className="lede">A file stays with you until you share that exact file.</p>
        <div className="stack">
          {docs.map((doc) => {
            const counsellor = data.counsellors.find((item) => item.id === doc.sharedWith);
            const visible = counsellor ? documentVisibleToCounsellor(doc, counsellor.id) : false;
            return (
              <article key={doc.id} className="paper">
                <Icon name="file" />
                <div>
                  <strong>{doc.name}</strong>
                  <p>{doc.note}</p>
                  {visible && doc.sharedAt && doc.grantDays && counsellor && (
                    <p className="fine">Shared with {counsellor.name} until {formatWhen(grantUntil(doc.sharedAt, doc.grantDays).toISOString())}.</p>
                  )}
                  {doc.revoked && <p className="fine">Access revoked. A copy already saved cannot be pulled back.</p>}
                  {!doc.sharedWith && <p className="fine">Not shared.</p>}
                  <div className="row">
                    {!visible && (
                      <Button tone="quiet" onClick={() => setSharing(doc.id)}>
                        Share
                      </Button>
                    )}
                    {visible && (
                      <Button tone="ghost" onClick={() => revokeDocument(doc.id)}>
                        Revoke
                      </Button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
        <Field label="Add a sample file" value={name} onChange={(event) => setName(event.target.value)} />
        <Button
          tone="quiet"
          onClick={() => {
            if (name.trim()) addDocument(name.trim());
          }}
        >
          Add file
        </Button>
        {sharing && (
          <div className="overlay" onClick={() => setSharing(null)}>
            <div className="sheet" onClick={(event) => event.stopPropagation()}>
              <h3>Share with</h3>
              {partners.map((counsellor) => (
                <button
                  key={counsellor.id}
                  className="list-card"
                  onClick={() => {
                    shareDocument(sharing, counsellor.id);
                    setSharing(null);
                  }}
                >
                  <strong>{counsellor.name}</strong>
                </button>
              ))}
              <Button tone="ghost" onClick={() => setSharing(null)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </div>
    </Screen>
  );
}

export function ProfileScreen() {
  const { user, signOut } = useStore();
  const { push, setRole } = useNav();
  return (
    <Screen>
      <div className="pad">
        <h1 className="display">{user?.name}</h1>
        <p className="lede">{user?.email}</p>
        <div className="stack">
          <button className="list-card" onClick={() => push({ id: "documents" })}>
            <strong>Documents</strong>
            <span>Share or revoke a file</span>
          </button>
          <button className="list-card" onClick={() => push({ id: "wallet" })}>
            <strong>Payments</strong>
            <span>Fees you already accepted</span>
          </button>
        </div>
        <div className="terms">
          <h3>What stays private</h3>
          <p>Staff can approve counsellors, confirm payments, and read a complaint you send them.</p>
          <p>They cannot open your messages, your files, or the call.</p>
        </div>
        <Crisis />
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

export function WalletScreen() {
  const { data } = useStore();
  const { pop } = useNav();
  const mine = data.bookings.filter((booking) => booking.clientId === CLIENT_ID);
  return (
    <div className="screen-scroll pad">
      <button className="back" onClick={pop}>
        <Icon name="back" size={18} /> Profile
      </button>
      <h1 className="display">Payments</h1>
      <div className="stack">
        {mine.map((booking) => {
          const counsellor = data.counsellors.find((item) => item.id === booking.counsellorId);
          return (
            <article key={booking.id} className="paper">
              <div>
                <strong>{counsellor?.name}</strong>
                <p>{formatWhen(booking.startsAt)}</p>
                <p>
                  {booking.priceLkr === 0 ? "Free" : lkr(booking.priceLkr)} · {statusLabel(booking.status)}
                </p>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

export function clientScreen(id: string, route: { counsellorId?: string; bookingId?: string; threadId?: string; slot?: string; method?: "card" | "bank" }) {
  switch (id) {
    case "home":
      return <ClientHome />;
    case "counsellors":
      return <CounsellorList />;
    case "counsellor":
      return <CounsellorProfile id={route.counsellorId ?? ""} />;
    case "book":
      return <BookScreen counsellorId={route.counsellorId ?? ""} slot={route.slot} />;
    case "pay":
      return <PayScreen counsellorId={route.counsellorId ?? ""} slot={route.slot} method={route.method} />;
    case "sessions":
      return <SessionsScreen />;
    case "session":
      return <SessionScreen bookingId={route.bookingId ?? ""} />;
    case "lobby":
      return <LobbyScreen bookingId={route.bookingId ?? ""} />;
    case "messages":
      return <MessagesScreen />;
    case "chat":
      return <ChatScreen threadId={route.threadId ?? ""} />;
    case "documents":
      return <DocumentsScreen />;
    case "profile":
      return <ProfileScreen />;
    case "wallet":
      return <WalletScreen />;
    default:
      return null;
  }
}
