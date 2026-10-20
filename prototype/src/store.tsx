import { createContext, useContext, useEffect, useMemo, useReducer, type ReactNode } from "react";
import { createSeed } from "./data";
import { CLIENT_ID, quote, threadIdFor } from "./logic";
import type { AccessKind, Application, Booking, ChatRule, DataState, DocGrant, Question, Role, SessionUser, Slot } from "./types";

type Action =
  | { type: "reset" }
  | { type: "toast"; text: string | null }
  | { type: "sign-in"; user: SessionUser }
  | { type: "sign-out" }
  | { type: "settings"; patch: Partial<DataState["settings"]> }
  | { type: "book"; booking: Booking }
  | { type: "replace-slip"; bookingId: string; slipName: string }
  | { type: "cancel"; bookingId: string; next: Booking["status"] }
  | { type: "mark-paid"; bookingId: string }
  | { type: "reject-slip"; bookingId: string }
  | { type: "complete"; bookingId: string }
  | { type: "review"; bookingId: string; stars: number; text: string }
  | { type: "hide-review"; bookingId: string }
  | { type: "complaint"; complaint: DataState["complaints"][number] }
  | { type: "close-complaint"; complaintId: string }
  | { type: "ensure-thread"; counsellorId: string; clientId: string; clientName: string; rule: ChatRule }
  | { type: "message"; threadId: string; from: "client" | "counsellor"; text: string }
  | { type: "add-doc"; doc: DataState["documents"][number] }
  | { type: "share"; docId: string; grants: DocGrant[] }
  | { type: "revoke"; docId: string; grantId: string }
  | { type: "slots"; counsellorId: string; slots: Slot[] }
  | { type: "price"; counsellorId: string; priceLkr: number }
  | { type: "suspend"; counsellorId: string }
  | { type: "questions"; questions: Question[] }
  | { type: "save-application"; application: Application }
  | { type: "decide"; applicationId: string; status: Application["status"]; staffNote?: string };

type Store = {
  data: DataState;
  user: SessionUser | null;
  signIn: (email: string, password: string) => string | null;
  enter: (role: Role) => void;
  register: (input: { name: string; email: string; dob: string; consent: boolean }) => string | null;
  signOut: () => void;
  reset: () => void;
  patchSettings: (patch: Partial<DataState["settings"]>) => void;
  createBooking: (input: { counsellorId: string; startsAt: string; method: "card" | "bank" | "free"; slipName?: string }) => string;
  replaceSlip: (bookingId: string, slipName: string) => void;
  cancelBooking: (bookingId: string) => void;
  markPaid: (bookingId: string) => void;
  rejectSlip: (bookingId: string) => void;
  completeBooking: (bookingId: string) => void;
  addReview: (bookingId: string, stars: number, text: string) => void;
  hideReview: (bookingId: string) => void;
  addComplaint: (bookingId: string, text: string) => void;
  closeComplaint: (complaintId: string) => void;
  ensureThread: (counsellorId: string, clientId?: string, clientName?: string) => string;
  sendMessage: (threadId: string, from: "client" | "counsellor", text: string) => void;
  addDocument: (file: { name: string; note: string; sizeLabel: string; kind: string; previewUrl?: string }) => void;
  shareDocument: (docId: string, counsellorIds: string[], access: AccessKind, length: "revoke" | "days" | "session") => void;
  revokeDocument: (docId: string, grantId: string) => void;
  setSlots: (counsellorId: string, slots: Slot[]) => void;
  setPrice: (counsellorId: string, priceLkr: number) => void;
  suspend: (counsellorId: string) => void;
  setQuestions: (questions: Question[]) => void;
  saveApplication: (answers: { questionId: string; answer: string }[], submit: boolean) => void;
  decideApplication: (applicationId: string, status: Application["status"], staffNote?: string) => void;
};

const Ctx = createContext<Store | null>(null);

function reducer(state: DataState, action: Action): DataState {
  switch (action.type) {
    case "reset":
      return createSeed();
    case "toast":
      return { ...state, toast: action.text };
    case "settings":
      return { ...state, settings: { ...state.settings, ...action.patch } };
    case "book":
      return { ...state, bookings: [action.booking, ...state.bookings] };
    case "replace-slip":
      return {
        ...state,
        bookings: state.bookings.map((booking) =>
          booking.id === action.bookingId
            ? { ...booking, slipName: action.slipName, status: "awaiting-payment", paymentMethod: "bank" }
            : booking,
        ),
      };
    case "cancel":
      return {
        ...state,
        bookings: state.bookings.map((booking) =>
          booking.id === action.bookingId ? { ...booking, status: action.next } : booking,
        ),
      };
    case "mark-paid":
      return {
        ...state,
        bookings: state.bookings.map((booking) =>
          booking.id === action.bookingId ? { ...booking, status: "confirmed", paidAt: new Date().toISOString() } : booking,
        ),
      };
    case "reject-slip":
      return {
        ...state,
        bookings: state.bookings.map((booking) =>
          booking.id === action.bookingId ? { ...booking, status: "payment-rejected" } : booking,
        ),
      };
    case "complete":
      return {
        ...state,
        bookings: state.bookings.map((booking) =>
          booking.id === action.bookingId ? { ...booking, status: "completed" } : booking,
        ),
      };
    case "review":
      return {
        ...state,
        bookings: state.bookings.map((booking) =>
          booking.id === action.bookingId ? { ...booking, review: { stars: action.stars, text: action.text } } : booking,
        ),
      };
    case "hide-review":
      return {
        ...state,
        bookings: state.bookings.map((booking) =>
          booking.id === action.bookingId && booking.review
            ? { ...booking, review: { ...booking.review, hidden: !booking.review.hidden } }
            : booking,
        ),
      };
    case "complaint":
      return { ...state, complaints: [action.complaint, ...state.complaints] };
    case "close-complaint":
      return {
        ...state,
        complaints: state.complaints.map((item) =>
          item.id === action.complaintId ? { ...item, status: "closed" } : item,
        ),
      };
    case "ensure-thread": {
      const id = threadIdFor(action.counsellorId, action.clientId);
      if (state.threads.some((thread) => thread.id === id)) return state;
      return {
        ...state,
        threads: [
          {
            id,
            counsellorId: action.counsellorId,
            clientId: action.clientId,
            clientName: action.clientName,
            ruleAtOpen: action.rule,
            messages: [],
          },
          ...state.threads,
        ],
      };
    }
    case "message":
      return {
        ...state,
        threads: state.threads.map((thread) =>
          thread.id === action.threadId
            ? {
                ...thread,
                messages: [
                  ...thread.messages,
                  { id: `m-${Date.now()}`, from: action.from, text: action.text, at: new Date().toISOString() },
                ],
              }
            : thread,
        ),
      };
    case "add-doc":
      return { ...state, documents: [action.doc, ...state.documents] };
    case "share":
      return {
        ...state,
        documents: state.documents.map((doc) => {
          if (doc.id !== action.docId) return doc;
          const replaced = new Set(action.grants.map((grant) => grant.counsellorId));
          return {
            ...doc,
            grants: [...doc.grants.filter((grant) => !replaced.has(grant.counsellorId)), ...action.grants],
          };
        }),
      };
    case "revoke":
      return {
        ...state,
        documents: state.documents.map((doc) =>
          doc.id === action.docId
            ? { ...doc, grants: doc.grants.map((grant) => (grant.id === action.grantId ? { ...grant, revoked: true } : grant)) }
            : doc,
        ),
      };
    case "slots":
      return {
        ...state,
        counsellors: state.counsellors.map((counsellor) =>
          counsellor.id === action.counsellorId
            ? { ...counsellor, slots: action.slots, pendingSetup: action.slots.length === 0 }
            : counsellor,
        ),
      };
    case "price":
      return {
        ...state,
        counsellors: state.counsellors.map((counsellor) =>
          counsellor.id === action.counsellorId ? { ...counsellor, priceLkr: action.priceLkr } : counsellor,
        ),
      };
    case "suspend":
      return {
        ...state,
        counsellors: state.counsellors.map((counsellor) =>
          counsellor.id === action.counsellorId ? { ...counsellor, suspended: !counsellor.suspended } : counsellor,
        ),
      };
    case "questions":
      return { ...state, questions: action.questions };
    case "save-application":
      return {
        ...state,
        applications: state.applications.some((item) => item.id === action.application.id)
          ? state.applications.map((item) => (item.id === action.application.id ? action.application : item))
          : [action.application, ...state.applications],
      };
    case "decide": {
      const applications = state.applications.map((item) =>
        item.id === action.applicationId ? { ...item, status: action.status, staffNote: action.staffNote } : item,
      );
      if (action.status !== "approved") return { ...state, applications };
      const application = applications.find((item) => item.id === action.applicationId);
      if (!application || state.counsellors.some((counsellor) => counsellor.id === application.id)) {
        return { ...state, applications };
      }
      const fee = Number(application.answers.find((answer) => answer.questionId === "q-fee")?.answer);
      return {
        ...state,
        applications,
        counsellors: [
          ...state.counsellors,
          {
            id: application.id,
            name: application.name,
            credentials: application.answers.find((answer) => answer.questionId === "q-qual")?.answer ?? "Qualification to confirm",
            focus: ["Relationships"],
            languages: ["English", "Sinhala"],
            priceLkr: Number.isFinite(fee) ? fee : 0,
            bio: application.answers.find((answer) => answer.questionId === "q-bio")?.answer ?? "",
            approach: "Hours are not published yet.",
            rating: 0,
            reviewCount: 0,
            hue: application.hue,
            suspended: false,
            pendingSetup: true,
            slots: [],
          },
        ],
      };
    }
    default:
      return state;
  }
}

const people: Record<string, SessionUser> = {
  "sanduni@sithsevana.test": { role: "client", name: "Sanduni Wickramasinghe", email: "sanduni@sithsevana.test" },
  "nadeesha@sithsevana.test": { role: "counsellor", name: "Nadeesha Perera", email: "nadeesha@sithsevana.test" },
  "thilini@sithsevana.test": { role: "applicant", name: "Thilini Rodrigo", email: "thilini@sithsevana.test" },
  "malini@sithsevana.test": { role: "staff", name: "Malini Jayasuriya", email: "malini@sithsevana.test" },
};

const previewUser: Record<Role, SessionUser> = {
  client: people["sanduni@sithsevana.test"],
  counsellor: people["nadeesha@sithsevana.test"],
  applicant: people["thilini@sithsevana.test"],
  staff: people["malini@sithsevana.test"],
};

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, dispatch] = useReducer(reducer, undefined, createSeed);
  const [user, setUser] = useReducer((_: SessionUser | null, next: SessionUser | null) => next, null);

  useEffect(() => {
    if (!data.toast) return;
    const timer = window.setTimeout(() => dispatch({ type: "toast", text: null }), 2600);
    return () => window.clearTimeout(timer);
  }, [data.toast]);

  const api = useMemo<Store>(() => {
    return {
      data,
      user,
      signIn: (email, password) => {
        const found = people[email.trim().toLowerCase()];
        if (!found || password.trim().length < 4) return "Use a sample email and at least 4 characters.";
        setUser(found);
        return null;
      },
      enter: (role) => setUser(previewUser[role]),
      register: ({ name, email, consent }) => {
        if (!consent) return "Please accept the terms to continue.";
        if (!name.trim() || !email.trim()) return "Name and email are required.";
        setUser({ role: "client", name: name.trim(), email: email.trim() });
        return null;
      },
      signOut: () => setUser(null),
      reset: () => {
        dispatch({ type: "reset" });
        setUser(null);
      },
      patchSettings: (patch) => dispatch({ type: "settings", patch }),
      createBooking: ({ counsellorId, startsAt, method, slipName }) => {
        const counsellor = data.counsellors.find((item) => item.id === counsellorId);
        if (!counsellor) return "";
        const price = quote(counsellor, data.bookings, data.settings);
        const id = `b-${crypto.randomUUID()}`;
        const status = method === "bank" ? "awaiting-payment" : "confirmed";
        dispatch({
          type: "book",
          booking: {
            id,
            counsellorId,
            clientId: CLIENT_ID,
            clientName: user?.name ?? "Sanduni Wickramasinghe",
            startsAt,
            minutes: price.minutes,
            priceLkr: price.priceLkr ?? counsellor.priceLkr,
            cancelHours: price.cancelHours,
            status,
            paymentMethod: method,
            slipName,
            createdAt: new Date().toISOString(),
            paidAt: method === "bank" ? undefined : new Date().toISOString(),
          },
        });
        dispatch({
          type: "toast",
          text: status === "confirmed" ? "Booking confirmed" : "Slip received. Waiting for confirmation",
        });
        return id;
      },
      replaceSlip: (bookingId, slipName) => {
        dispatch({ type: "replace-slip", bookingId, slipName });
        dispatch({ type: "toast", text: "New slip sent for confirmation" });
      },
      cancelBooking: (bookingId) => {
        const booking = data.bookings.find((item) => item.id === bookingId);
        if (!booking) return;
        const started = new Date(booking.startsAt).getTime() <= Date.now();
        if (started) return;
        const hours = (new Date(booking.startsAt).getTime() - Date.now()) / 3_600_000;
        const paid = booking.status === "confirmed" || booking.status === "refund-review";
        const full = hours >= booking.cancelHours;
        const next = !paid ? "cancelled" : full ? "refunded" : "refund-review";
        dispatch({ type: "cancel", bookingId, next });
        dispatch({
          type: "toast",
          text: next === "refunded" ? "Cancelled with a full refund" : next === "refund-review" ? "Sent to staff for a refund decision" : "Booking cancelled",
        });
      },
      markPaid: (bookingId) => {
        dispatch({ type: "mark-paid", bookingId });
        dispatch({ type: "toast", text: "Marked as paid. The booking is confirmed." });
      },
      rejectSlip: (bookingId) => {
        dispatch({ type: "reject-slip", bookingId });
        dispatch({ type: "toast", text: "Slip rejected" });
      },
      completeBooking: (bookingId) => {
        dispatch({ type: "complete", bookingId });
        dispatch({ type: "toast", text: "Session marked complete" });
      },
      addReview: (bookingId, stars, text) => {
        dispatch({ type: "review", bookingId, stars, text });
        dispatch({ type: "toast", text: "Review saved" });
      },
      hideReview: (bookingId) => dispatch({ type: "hide-review", bookingId }),
      addComplaint: (bookingId, text) => {
        const booking = data.bookings.find((item) => item.id === bookingId);
        const counsellor = data.counsellors.find((item) => item.id === booking?.counsellorId);
        if (!booking || !counsellor) return;
        dispatch({
          type: "complaint",
          complaint: {
            id: `c-${crypto.randomUUID()}`,
            bookingId,
            clientName: booking.clientName,
            counsellorName: counsellor.name,
            text,
            status: "open",
            createdAt: new Date().toISOString(),
          },
        });
        dispatch({ type: "toast", text: "Complaint sent to staff" });
      },
      closeComplaint: (complaintId) => dispatch({ type: "close-complaint", complaintId }),
      ensureThread: (counsellorId, clientId = CLIENT_ID, clientName = user?.name ?? "Sanduni Wickramasinghe") => {
        dispatch({
          type: "ensure-thread",
          counsellorId,
          clientId,
          clientName,
          rule: data.settings.chatRule,
        });
        return threadIdFor(counsellorId, clientId);
      },
      sendMessage: (threadId, from, text) => dispatch({ type: "message", threadId, from, text }),
      addDocument: (file) =>
        dispatch({
          type: "add-doc",
          doc: {
            id: `d-${crypto.randomUUID()}`,
            clientId: CLIENT_ID,
            name: file.name,
            note: file.note || "Added from this device. Not shared yet.",
            kind: file.kind,
            sizeLabel: file.sizeLabel,
            addedAt: new Date().toISOString(),
            previewUrl: file.previewUrl,
            grants: [],
          },
        }),
      shareDocument: (docId, counsellorIds, access, length) => {
        const now = new Date();
        const grants: DocGrant[] = [];
        const skipped: string[] = [];
        for (const counsellorId of counsellorIds) {
          let until: string | undefined;
          if (length === "days") {
            const end = new Date(now);
            end.setDate(end.getDate() + data.settings.grantDays);
            until = end.toISOString();
          } else if (length === "session") {
            const next = data.bookings
              .filter(
                (booking) =>
                  booking.clientId === CLIENT_ID &&
                  booking.counsellorId === counsellorId &&
                  (booking.status === "confirmed" || booking.status === "awaiting-payment") &&
                  new Date(booking.startsAt).getTime() > now.getTime(),
              )
              .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime())[0];
            if (!next) {
              skipped.push(counsellorId);
              continue;
            }
            until = new Date(new Date(next.startsAt).getTime() + next.minutes * 60_000).toISOString();
          }
          grants.push({
            id: `g-${crypto.randomUUID()}`,
            counsellorId,
            access,
            sharedAt: now.toISOString(),
            until,
          });
        }
        if (grants.length > 0) dispatch({ type: "share", docId, grants });
        const skippedNames = skipped
          .map((id) => data.counsellors.find((counsellor) => counsellor.id === id)?.name)
          .filter(Boolean);
        dispatch({
          type: "toast",
          text:
            grants.length === 0
              ? "No upcoming session to attach that access to."
              : skippedNames.length > 0
                ? `Shared. No upcoming session for ${skippedNames.join(", ")}.`
                : "Access updated",
        });
      },
      revokeDocument: (docId, grantId) => {
        dispatch({ type: "revoke", docId, grantId });
        dispatch({ type: "toast", text: "Access ended for that counsellor" });
      },
      setSlots: (counsellorId, slots) => dispatch({ type: "slots", counsellorId, slots }),
      setPrice: (counsellorId, priceLkr) => dispatch({ type: "price", counsellorId, priceLkr }),
      suspend: (counsellorId) => dispatch({ type: "suspend", counsellorId }),
      setQuestions: (questions) => dispatch({ type: "questions", questions }),
      saveApplication: (answers, submit) => {
        const current = data.applications.find((item) => item.email === "thilini@sithsevana.test");
        const nextAnswers = data.questions.map((question) => ({
          questionId: question.id,
          question: question.text,
          answer: answers.find((item) => item.questionId === question.id)?.answer ?? "",
        }));
        dispatch({
          type: "save-application",
          application: {
            id: current?.id ?? "app-thilini",
            name: "Thilini Rodrigo",
            email: "thilini@sithsevana.test",
            hue: 268,
            status: submit ? "submitted" : "draft",
            answers: nextAnswers,
            staffNote: submit ? undefined : current?.staffNote,
          },
        });
        dispatch({ type: "toast", text: submit ? "Application submitted" : "Draft saved" });
      },
      decideApplication: (applicationId, status, staffNote) => {
        dispatch({ type: "decide", applicationId, status, staffNote });
        dispatch({
          type: "toast",
          text: status === "approved" ? "Counsellor approved" : status === "rejected" ? "Application rejected" : "More information requested",
        });
      },
    };
  }, [data, user]);

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useStore() {
  const store = useContext(Ctx);
  if (!store) throw new Error("Store missing");
  return store;
}
