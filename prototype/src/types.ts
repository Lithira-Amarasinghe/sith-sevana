export type Role = "client" | "counsellor" | "staff" | "applicant";

export type ChatRule = "after-choose" | "after-paid" | "during-session" | "after-session";

export type Settings = {
  sessionMinutes: number;
  cancelHours: number;
  bookingNoticeHours: number;
  joinMinutesBefore: number;
  freeSession: boolean;
  cardEnabled: boolean;
  bankEnabled: boolean;
  chatRule: ChatRule;
  grantDays: number;
  crisisPhone: string;
  crisisLabel: string;
};

export type Slot = { weekday: number; start: string; end: string };

export type AccessKind = "view" | "copy";

export type DocGrant = {
  id: string;
  counsellorId: string;
  access: AccessKind;
  sharedAt: string;
  until?: string;
  revoked?: boolean;
};

export type Counsellor = {
  id: string;
  name: string;
  credentials: string;
  focus: string[];
  languages: string[];
  priceLkr: number;
  bio: string;
  approach: string;
  rating: number;
  reviewCount: number;
  slots: Slot[];
  hue: number;
  suspended: boolean;
  pendingSetup: boolean;
};

export type BookingStatus =
  | "awaiting-payment"
  | "payment-rejected"
  | "confirmed"
  | "completed"
  | "cancelled"
  | "refund-review"
  | "refunded";

export type Booking = {
  id: string;
  counsellorId: string;
  clientId: string;
  clientName: string;
  startsAt: string;
  minutes: number;
  priceLkr: number;
  cancelHours: number;
  status: BookingStatus;
  paymentMethod?: "card" | "bank" | "free";
  slipName?: string;
  createdAt: string;
  paidAt?: string;
  review?: { stars: number; text: string; hidden?: boolean };
};

export type ChatMessage = {
  id: string;
  from: "client" | "counsellor";
  text: string;
  at: string;
};

export type Thread = {
  id: string;
  counsellorId: string;
  clientId: string;
  clientName: string;
  ruleAtOpen: ChatRule;
  messages: ChatMessage[];
};

export type ClientDoc = {
  id: string;
  clientId: string;
  name: string;
  note: string;
  kind: string;
  sizeLabel: string;
  addedAt: string;
  body?: string;
  previewUrl?: string;
  grants: DocGrant[];
};

export type Question = { id: string; text: string; required: boolean };

export type ApplicationStatus = "draft" | "submitted" | "needs-info" | "approved" | "rejected";

export type Application = {
  id: string;
  name: string;
  email: string;
  status: ApplicationStatus;
  answers: { questionId: string; question: string; answer: string }[];
  staffNote?: string;
  hue: number;
};

export type Complaint = {
  id: string;
  bookingId: string;
  clientName: string;
  counsellorName: string;
  text: string;
  status: "open" | "closed";
  createdAt: string;
};

export type SessionUser = {
  role: Role;
  name: string;
  email: string;
};

export type DataState = {
  settings: Settings;
  questions: Question[];
  counsellors: Counsellor[];
  applications: Application[];
  bookings: Booking[];
  threads: Thread[];
  documents: ClientDoc[];
  complaints: Complaint[];
  toast: string | null;
};

export type ScreenId =
  | "welcome"
  | "register"
  | "home"
  | "counsellors"
  | "counsellor"
  | "book"
  | "pay"
  | "sessions"
  | "session"
  | "lobby"
  | "messages"
  | "chat"
  | "profile"
  | "documents"
  | "wallet"
  | "today"
  | "calendar"
  | "clients"
  | "client"
  | "cprofile"
  | "application"
  | "staff-home"
  | "staff-counsellors"
  | "application-review"
  | "questions"
  | "staff-payments"
  | "slip"
  | "staff-support"
  | "complaint"
  | "staff-settings";

export type Route = {
  id: ScreenId;
  counsellorId?: string;
  bookingId?: string;
  threadId?: string;
  applicationId?: string;
  complaintId?: string;
  slot?: string;
  method?: "card" | "bank";
};
