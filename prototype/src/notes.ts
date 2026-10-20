import type { ScreenId } from "./types";

export const principles = [
  "Calm and adult. The screen should feel like a quiet room, not a hospital dashboard.",
  "The next session is the first thing a returning client sees.",
  "Privacy is shown in plain language: who can join a call, read a chat, or open a file.",
  "Price and cancellation terms appear before a client commits. A booking keeps the terms they accepted.",
  "Staff work from a queue. They do not open private chats or client files.",
];

export const screenIndex: { group: string; items: { id: ScreenId; label: string }[] }[] = [
  {
    group: "Arrive",
    items: [
      { id: "welcome", label: "Welcome & sign in" },
      { id: "register", label: "Create account" },
    ],
  },
  {
    group: "Client",
    items: [
      { id: "home", label: "Home" },
      { id: "counsellors", label: "Find a counsellor" },
      { id: "counsellor", label: "Counsellor profile" },
      { id: "book", label: "Review & book" },
      { id: "sessions", label: "Sessions" },
      { id: "session", label: "Session detail" },
      { id: "lobby", label: "Join the call" },
      { id: "messages", label: "Messages" },
      { id: "chat", label: "Conversation" },
      { id: "documents", label: "Documents" },
      { id: "profile", label: "Profile" },
    ],
  },
  {
    group: "Counsellor",
    items: [
      { id: "today", label: "Today" },
      { id: "calendar", label: "Hours" },
      { id: "clients", label: "Clients" },
      { id: "cprofile", label: "Fee & profile" },
      { id: "application", label: "Application" },
    ],
  },
  {
    group: "Staff",
    items: [
      { id: "staff-home", label: "Needs a decision" },
      { id: "staff-counsellors", label: "Counsellors" },
      { id: "application-review", label: "Review application" },
      { id: "questions", label: "Application form" },
      { id: "staff-payments", label: "Payments" },
      { id: "slip", label: "Bank slip" },
      { id: "staff-support", label: "Support" },
      { id: "complaint", label: "Complaint" },
      { id: "staff-settings", label: "Company rules" },
    ],
  },
];

export const notes: Record<ScreenId, { title: string; intent: string; ask: string[] }> = {
  welcome: {
    title: "Welcome",
    intent: "A first impression of privacy and calm, before any form.",
    ask: [
      "Does this tone match Sith Sevana, or should it feel more clinical?",
      "The public site mentions support for all ages. This app stops under 18. Is that still the decision?",
      "Should people enter as a client only, with counsellor access by application?",
    ],
  },
  register: {
    title: "Create account",
    intent: "Adult check and consent happen before an account exists.",
    ask: [
      "Is date of birth the right adult check, or do you prefer a declaration only?",
      "What must the terms cover: privacy, no recording, cancellation, and crisis limits?",
      "Version 1 is English only. When do Sinhala and Tamil need to appear?",
    ],
  },
  home: {
    title: "Client home",
    intent: "Returning clients land on the next session, with the crisis line always within reach.",
    ask: [
      "Should the crisis line sit on every screen, or only Home and Profile?",
      "Is the default number 1926, and may staff change the label and number?",
      "Do you want a privacy reminder here, or is it enough at booking and in Profile?",
    ],
  },
  counsellors: {
    title: "Find a counsellor",
    intent: "Search by concern and language, with fee and next opening visible before a profile is opened.",
    ask: [
      "Are Anxiety, Stress, Grief, Relationships, and Academic stress the right filters?",
      "Should clients filter by fee, gender, or years of experience?",
      "Suspended counsellors disappear from this list. Is that the right suspension behaviour?",
    ],
  },
  counsellor: {
    title: "Counsellor profile",
    intent: "Enough to choose someone, without looking like a marketplace.",
    ask: [
      "Which facts are required: qualifications, languages, fee, approach, next times?",
      "Should star ratings be public in version 1, with the written notes on this profile?",
      "Can a client message before booking, or only after?",
    ],
  },
  book: {
    title: "Review and book",
    intent: "The client sees fee, length, and the cancellation rule, then accepts them.",
    ask: [
      "Is a 12-hour full refund the starting rule?",
      "If both card and bank transfer are switched off, what should the client see?",
      "Should the first session be free when staff turn that setting on?",
    ],
  },
  pay: {
    title: "Payment",
    intent: "A bank slip does not confirm the booking. Only staff confirmation, or a successful card payment, does.",
    ask: [
      "Which bank account details should the slip screen show?",
      "What must a slip contain for staff to accept it?",
      "Card payment can stay switched off until a gateway is chosen. Is that the plan?",
    ],
  },
  sessions: {
    title: "Sessions",
    intent: "Every booking shows the status the client needs: confirmed, waiting, or completed.",
    ask: [
      "Are these statuses enough for the client?",
      "Should a waiting payment stay on this list until staff decide?",
    ],
  },
  session: {
    title: "Session detail",
    intent: "Join, cancel, message, and review from one place. The booking keeps the terms it was given.",
    ask: [
      "How many minutes before the start may someone join? This preview uses 10.",
      "Inside the cancellation window, should the refund always wait for staff?",
      "One review per completed session. Can the client also raise a complaint without staff reading the chat?",
    ],
  },
  lobby: {
    title: "The call",
    intent: "Only the two people on the booking join. Camera can be off. Nothing is recorded.",
    ask: [
      "Is audio-only an equal choice, not a fallback?",
      "Who ends the session as completed: the counsellor, either person, or the clock?",
      "Confirm there are no session notes and no recording in version 1.",
    ],
  },
  messages: {
    title: "Messages",
    intent: "One thread per counsellor. Old threads keep the rule the client already saw.",
    ask: ["Is one thread per counsellor enough, rather than a thread per session?"],
  },
  chat: {
    title: "Conversation",
    intent: "The chat rule is written above the box. Send follows the rule from when the thread opened.",
    ask: [
      "Starting rule: message any time after the client chooses the counsellor. Is that what you want?",
      "If staff later change the rule, should open threads stay on the old rule?",
      "May the counsellor reply even when the client is not allowed to send?",
      "No attachments in version 1. Files go through Documents instead. Agree?",
    ],
  },
  documents: {
    title: "Documents",
    intent: "A file stays in the client's vault. They can share that same file with more than one counsellor, and end each person's access on its own.",
    ask: [
      "Should the name the client chooses be what the counsellor sees, rather than the file name from their device?",
      "Are the two access types right: view in the app, or allow a saved copy?",
      "Should the length be the company default, until the next session, or until the client revokes it?",
      "Ending a saved-copy grant cannot pull back a copy already kept. Is that warning clear enough?",
    ],
  },
  profile: {
    title: "Profile",
    intent: "Account, receipts, documents, and a plain explanation of what staff cannot see.",
    ask: ["What else belongs under Profile: notification preferences, saved counsellors, invoices?"],
  },
  wallet: {
    title: "Payments",
    intent: "A receipt shows who the session is with, when it is, how it was paid, and when the payment was confirmed.",
    ask: [
      "Is the paid time the card success, or the moment staff mark a bank slip paid?",
      "Are Paid, Waiting, Refunds, and Cancelled the filters a client needs?",
    ],
  },
  today: {
    title: "Counsellor today",
    intent: "The day is a short agenda: who, when, and whether the room is open.",
    ask: ["Is a day list enough, or do counsellors expect a full calendar first?"],
  },
  calendar: {
    title: "Hours",
    intent: "The counsellor sets working blocks. The app splits each block into sessions of the company length. Booked times are hidden from clients.",
    ask: [
      "Are repeating weekly blocks enough for version 1?",
      "Do you need leave and public holidays now, or later?",
    ],
  },
  clients: {
    title: "Clients",
    intent: "Name, next session, and files that were shared. No clinical notes.",
    ask: ["Is a client list without notes acceptable for the counsellors?"],
  },
  client: {
    title: "Client record",
    intent: "The counsellor sees only what this client shared, and can ask for a file.",
    ask: ["Should a request for a document arrive as a normal message?"],
  },
  cprofile: {
    title: "Counsellor profile settings",
    intent: "Fee and introduction, after approval. Verification is a status, not a badge the counsellor edits.",
    ask: ["Can an approved counsellor change their own fee freely, or does staff confirm fee changes?"],
  },
  application: {
    title: "Counsellor application",
    intent: "Until approval, this is the only screen. The submitted wording is kept.",
    ask: ["Who may apply: any adult, or only people Sith Sevana invites?"],
  },
  "staff-home": {
    title: "Staff home",
    intent: "Only work that needs a human decision.",
    ask: ["Is the queue right: applications, bank slips, refunds, complaints?"],
  },
  "staff-counsellors": {
    title: "Counsellor desk",
    intent: "Approve, ask for more, reject, or suspend. Suspension hides the profile from clients.",
    ask: ["What should happen to future bookings when someone is suspended?"],
  },
  "application-review": {
    title: "Review an application",
    intent: "Staff read the answers that were submitted, not a live form.",
    ask: ["Are approve, request information, and reject the only outcomes?"],
  },
  questions: {
    title: "Application questions",
    intent: "Staff write the form. Each question is required or optional.",
    ask: ["Which questions must every applicant answer before you can decide?"],
  },
  "staff-payments": {
    title: "Payments",
    intent: "Slips and refunds. Uploading a slip is not payment.",
    ask: [
      "Should the desk open on what needs a decision: slips to check and refunds to settle?",
      "How quickly should a slip be reviewed, and who is notified?",
    ],
  },
  slip: {
    title: "Bank slip",
    intent: "Mark paid confirms the booking. Reject asks the client to upload again.",
    ask: ["What reason should the client see when a slip is rejected?"],
  },
  "staff-support": {
    title: "Support",
    intent: "Complaints and reviews. The complaint screen does not open the chat or the files.",
    ask: ["Can staff remove a public review? Can they reply to the client inside the app?"],
  },
  complaint: {
    title: "Complaint",
    intent: "Enough to act, without the private conversation.",
    ask: ["What outcomes do you need: note, contact the client, close?"],
  },
  "staff-settings": {
    title: "Company rules",
    intent: "These settings change what clients see next. Confirmed bookings keep their own terms.",
    ask: [
      "Which of these rules should staff be free to change without a developer?",
      "Public videos and a doctor list are drawn as later items. Should they stay out of version 1?",
    ],
  },
};
