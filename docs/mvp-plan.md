# Sith Sevana mobile app — design and MVP plan

Status: planning baseline for stakeholder review. Not an approved clinical, legal, or privacy policy.
Date: 12 October 2026.
Inputs: [Sith Sevana PRD v0.1](https://github.com) upload (12 October 2026) and the live site at https://www.sithsevana.lk/.

This document decides how to build. It does not start the MVP.

## What exists today

https://www.sithsevana.lk/ is a React single-page app (Vite), not a static brochure.

- Copy: “Sith Sevana Counseling. A safe, confidential space to heal, cope, and grow. Professional support for anxiety, stress, and emotional well-being.” Pillars: Qualified Professionals, Comprehensive Support, Accessible & Private.
- Languages in the bundle: English and Sinhala (Tamil strings were not present).
- Roles in code: `admin`, `counsellor`, `patient`.
- Backend: Firebase project `counsellingsllanka` (Auth, Firestore, Storage).
- Booking confirmation path visible in the UI: bank deposit or transfer, slip upload, and WhatsApp confirmation. “Fully Booked” is a first-class state.
- Counsellor directory, details and book, terms, counsellor login, and staff views already exist on the web.

The mobile product should feel like the same service. It should not silently depend on Firestore, WhatsApp, or manual slip matching for the long-term booking ledger. Treat the current site as the brand and operations reference, and the PRD as the target behaviour.

## Product shape

Three experiences, one domain model:

| Experience | Who | Recommended client | MVP |
| --- | --- | --- | --- |
| Client | Adults seeking counselling | Flutter (Android and iOS) | Yes |
| Counsellor | Applicants and verified counsellors | Same Flutter app, separate shell after role resolution | Yes, thinner than the client |
| Staff | Verification, operations, content, support, finance, security | Responsive web (Blazor or a small React admin) on the same API | Yes, queues only |

One app with two shells is the right first choice. A second store listing and a second release train are expensive for a Sri Lanka launch team, and counsellors already sign in on the website. Staff stay on the web because verification evidence, refunds, and audit review are desktop work. Visitors can keep using the website; the app does not need a logged-out clone of every marketing page.

**MVP user promise:** a client can find an approved counsellor, see price and cancellation terms, hold a slot, pay or use an eligible free session, attend a private audio or video session, message only when entitled, and share one document with one counsellor and take that access back.

Phase 2 (paid message plans, paid resources) and Phase 3 (store, doctor booking) stay out of the schema’s required behaviour. Tables can exist as empty extension points. Screens do not.

## Brand and UI

Match the site so the app is recognisable next to sithsevana.lk.

| Token | Value | Use |
| --- | --- | --- |
| Primary | `#3498DB` | Links, outline pills, directory chips |
| Primary pressed | `#2980B9` | Filled primary buttons |
| Ink | `#2C3E50` | Headings and body |
| Mute | `#7F8C8D` | Meta, helper text |
| Canvas | `#FFFC` to `#F8F9FA` | App background |
| Card | white at about 90% with a soft shadow | Profile and session cards, 16px radius |
| Heal | `#66BB6A` → `#43A047` | Confirm, paid, “you are booked” |
| Leaf deep | `#1B5E20` / `#2E7D32` | Success text on pale green `#E0F7FA`–`#C8E6C9` panels |
| Amber | `#F39C12` / `#856404` on `#FFF3CD` | Pending payment, slip received, needs information |
| Danger | `#FF4757` | Destructive actions and unread badges only |

Typography: **Poppins** for UI (the site loads 300–700). **Playfair Display** only for the home greeting and empty-state titles, never for prices, times, or consent. Buttons are pills (site uses 30–50px radius). Profile photos are circular with a light ring. Verification is a small blue chip (“Verified counsellor”), not a medal graphic.

Tone: calm, plain, confidential. Avoid hospital chrome, stock “mental health” illustrations of people crying, and red crisis styling on ordinary screens. The emergency disclaimer is a quiet persistent line on booking and call screens, plus a dedicated Help path, using company-approved Sri Lankan contacts. Do not imply 24/7 clinical emergency cover.

Motion: short lifts (the site uses 2–4px hover). On mobile, press states and skeletons replace hover.

Accessibility floor for MVP: 4.5:1 text contrast (the pale blue-on-white chips on the site need darker text or a stronger fill in the app), 44px targets, scalable text, screen-reader labels on booking and grant controls, and visible focus. Sinhala must be in the font fallback from day one even if Tamil ships later.

### Client information architecture

Bottom navigation:

1. **Home** — greeting, next session, pending payment or document request, safety line.
2. **Counsellors** — search and filters (speciality, language, session mode, price, rating, next available).
3. **Sessions** — upcoming and past; join opens only inside the early-join window.
4. **Messages** — entitled threads only.
5. **You** — profile, vault, payments, reviews, language, privacy requests.

Booking is a stack on the counsellor profile, not a sixth tab: service and duration, slot, price and cancellation terms, pay or free-session confirmation, result.

### Counsellor shell

Tabs: Today, Calendar, Messages, Requests (document asks and grants), Profile. Applicants who are not approved see only Application status. They cannot open Calendar publishing.

### Visual references to reuse

- Frosted white bars and cards, circular counsellor portraits, blue “Details & Book” buttons, green confirmation panels, amber pending-payment banners.
- Leaf accent in the wordmark area, used sparingly.
- Do not port the site’s mixed purple (`#6C5CE7`) admin buttons into the client app. Keep staff web slightly more utilitarian and the client app in blue and green only.

## Recommended stack

| Layer | Choice | Why |
| --- | --- | --- |
| Mobile | Flutter (stable channel), iOS and Android | One UI for both shells; decent Sinhala shaping; one store process |
| API | ASP.NET Core (.NET 8) | Transactions, webhooks, and object-level auth belong on the server |
| Data | Azure SQL | Bookings, payments, grants, and audit need constraints Firestore will not give you |
| Files | Azure Blob, private containers | Vault, slips, and credential evidence, separate containers and access policies |
| Secrets | Key Vault | Payment, video, and storage keys |
| Client and counsellor sign-in | Microsoft Entra External ID (email plus phone one-time code) | Managed passwords, lockout, and no homemade credential store |
| Staff sign-in | Entra ID workforce tenant, MFA required | Least privilege for operators |
| Realtime chat | Azure SignalR Service plus API persistence in SQL | Entitlements checked on the API before a message is stored |
| Audio and video | Azure Communication Services (ACS) Calling | Join tokens minted by the API for the two booking participants; recording off |
| Push | Notification Hubs with FCM and APNs | Booking and grant events; no clinical text in the payload |
| Email | Azure Communication Services Email | Transactional only at MVP |
| Observability | Application Insights, no message or document bodies | PRD analytics without counselling content |
| Host | Azure Container Apps (API) in a supported region, Front Door, WAF | Scale-to-zero is acceptable pre-launch; pin min replicas before go-live |
| Staff web | Blazor on the same API | Same RBAC model, no second backend |

Region: pick one Azure region and write it into the decision log before any production data (Southeast Asia or another region counsel accepts for Sri Lankan personal data). Do not split chat, files, and SQL across regions in MVP.

Firebase stays read-only as a migration source if Sith Sevana wants existing counsellors and bookings moved. New bookings are not written to Firestore.

### Why not “Flutter talking to Firebase”

The PRD’s launch gates are double-booking, idempotent payments, per-document grants, and staff who cannot read counselling content. Those are row-level, transactional rules. A .NET API in front of Azure SQL is the straightforward way to test them. Flutter never receives storage account keys or ACS connection strings.

## Domain model (build this, not a bag of JSON)

Core tables, all with stable IDs:

- `User`, `ConsentRecord`, `RoleAssignment`
- `CounsellorProfile`, `VerificationCase`, `CredentialEvidence` (blob pointer only)
- `ServiceOffering`, `PricingPolicy`, `FreeSessionRule`
- `AvailabilityRule`, `AvailabilityException`, `SlotHold`, `Booking`
- `Payment`, `Refund` (provider reference and status only; no card numbers)
- `Conversation`, `ContactEntitlement`, `Message`
- `VaultDocument`, `DocumentRequest`, `AccessGrant`, `DocumentAccessLog`
- `Review`, `ReviewModeration`
- `ContentItem` (public videos), `DoctorDirectoryEntry`
- `NotificationTemplate`, `NotificationDelivery`
- `SupportCase`, `AuditEvent` (append-only)

Booking states from the PRD: `PendingPayment`, `Confirmed`, `Cancelled`, `RescheduleRequested`, `Completed`, `NoShow`, `PaymentFailed`, `RefundPending`.

Verification states: `Draft`, `Submitted`, `NeedsInformation`, `Approved`, `Rejected`, `Suspended`, `RenewalRequired`.

A profile is searchable only when verification is `Approved`, publication checks pass, and the counsellor is not suspended or expired.

### Invariants the API must enforce

- One confirmed booking per counsellor slot. Holds expire (suggested default 15 minutes) and release the slot.
- Payment webhooks are idempotent on the provider event id.
- A confirmed booking keeps the price captured at confirmation.
- Free-session eligibility is decided on the server and stored on the booking.
- Chat send checks a live `ContactEntitlement`. Hitting a limit does not charge anyone.
- Every document read checks a non-revoked, unexpired grant for that user and document, then writes `DocumentAccessLog`. Download links are short-lived.
- Call tokens are minted only for the client and counsellor on that booking, inside the join window.
- Support and finance roles have no grant to message bodies, vault bytes, or credential files.
- Audit rows are not updated by application roles.

## MVP cut

The PRD Phase 1 list is the release checklist. Build it as four vertical slices so each slice is shippable to a private TestFlight and Play internal track.

### Slice A — Trust and diary

- Register, sign in, sign out, passwordless recovery, consent versions (terms, privacy, telehealth scope).
- Adults-only gate until a guardian policy exists. Block date of birth under 18 and say why, in English and Sinhala.
- Counsellor application with evidence upload, staff review, approve or reject or request information, audit, email.
- Public directory and profile. Favourite. No booking yet beyond a “request a time” preview if payments are not ready.
- Counsellor availability editor.

### Slice B — Money and the slot

- Server hold, confirm, cancel, reschedule request.
- One payment path. See the decision below. Until a gateway is contracted, keep **manual bank transfer** as an explicit `Payment` state machine (`AwaitingSlip`, `SlipReceived`, `MarkedPaid` by finance), which matches the website, and still release holds on timeout. Do not confirm the booking on slip upload alone.
- Free-session rule: one free introductory session per client per counsellor, funded as the company decides. Configurable, not hard-coded, but ship with that single rule.
- Push and email: confirmed, reminder (24h and 1h), cancelled, payment result. Payload is “You have an update about your session” plus an in-app destination. No counsellor notes, no document titles.

### Slice C — The session

- Entitled 1:1 chat (text only). Default MVP entitlement: messaging opens 24 hours before a confirmed session and closes 24 hours after, fair-use cap (for example 30 messages each way) shown before the first send. No paid top-up in MVP.
- ACS audio and video for the booking. Camera toggle. Recording disabled in the ACS room options. Join button hidden outside the window (15 minutes early through 15 minutes after scheduled end, configurable).
- Failure copy: retry, then “contact support”; the booking stays confirmed.

### Slice D — Vault, voice of the client, and the public extras

- Vault upload (pdf, jpg, png; size cap; malware scan via a defender-for-storage or equivalent scan step before the blob is readable).
- Counsellor request, client grant (view, and download only if the company allows it), expiry default 30 days, revoke.
- Review after `Completed` only, one per booking, moderation queue.
- Staff-managed public videos and informational doctor directory with “not bookable on Sith Sevana” on every card.
- Support case and a privacy-request type. No CRM.

Staff web in parallel with each slice: only the screens that slice needs (verification queue in A, payment reconciliation in B, report queue in C, content and review moderation in D).

### Explicitly not in MVP

Paid message bundles, resource store, doctor accounts, waitlists, message attachments, session notes or care plans, recording, transcription, promoted rankings, Tamil UI (unless the decision log adds it), guest booking without an account, and any claim of end-to-end encryption or total anonymity.

Anonymous mode: ship as **pseudonym shown to the counsellor**. Legal name, phone, and payment identity stay with the platform and the payment provider. The booking screen states that in one paragraph. Do not build a mode that claims the company cannot identify the client.

## API surface (illustrative)

REST under `/api/v1`, JSON, bearer tokens from Entra. Flutter uses a generated client later; hand-written DTOs are fine for slice A.

- `POST /auth/session` — exchange Entra token, return app roles and consent gaps.
- `POST /counsellor-applications` and staff `POST /verification-cases/{id}:decide`
- `GET /counsellors?speciality&language&mode&priceMax&from`
- `PUT /me/availability`
- `POST /bookings` → hold, `POST /bookings/{id}:confirm`, `:cancel`, `:reschedule`
- `POST /payments/manual-slips` and `POST /payments/webhooks/{provider}`
- `GET/POST /conversations/{id}/messages`
- `POST /sessions/{bookingId}/call-token`
- `POST /vault/documents`, `POST /document-requests`, `POST /grants`, `POST /grants/{id}:revoke`, `GET /vault/documents/{id}/content` (grant-checked redirect or limited SAS)

Authorise in the API and with SQL row filters or explicit `WHERE` predicates in one repository layer. UI hiding is not the control.

## Mobile app structure

```text
app/
  lib/features/   home, directory, booking, sessions, chat, call, vault, profile
  lib/shells/     client_shell, counsellor_shell, applicant_shell
  lib/design/     colors, type, components matching the tokens above
  lib/api/        generated or hand DTOs, no business rules
api/
  SithSevana.Api
  SithSevana.Domain
  SithSevana.Infrastructure
staff/
  SithSevana.StaffWeb
```

Flutter: go_router, a single `AppTheme`, flutter_localizations with `en` and `si`. Call UI isolated behind an interface so ACS can be replaced if counsel rejects the vendor.

Offline: read cache for the next session and directory last results. Never queue a second payment or a second confirm. If the network fails mid-hold, the app shows the hold state from the server on resume.

## Security and privacy work that is part of the plan

- Threat model before slice B: slot races, webhook spoofing, IDOR on grants, token reuse for calls, push payload leaks, staff role creep.
- PDPA Act No. 9 of 2022 and the provisions the DPA has tied to a 1 January 2027 start: data map, purpose limitation, processor list, retention, and a privacy notice before production data. This plan is not that notice.
- Retention defaults to propose, then replace with counsel’s numbers: verification evidence 7 years or employment-of-record equivalent; bookings and payments 7 years; messages 24 months after last activity; revoked documents inaccessible immediately and blob-deleted after the retention clock; backups encrypted and aged out on a stated schedule. The UI must not say “deleted” if backups still hold the file.
- Secrets only in Key Vault. No card data. Malware scan before a blob becomes readable. Audit of sign-in, role change, verification decision, grant, download, refund, and admin config.
- Pen test on auth, object-level access, upload, and webhooks before public store release. The PRD acceptance list in section 9 is the release gate.

## Decisions still blocking build

Record owner and date. Engineering can scaffold slice A without items 6–9; it cannot finish slice B without them.

1. Service model and which credentials may be approved (SLMC clinical psychologist versus other counselling categories).
2. Adults only at launch (recommended yes).
3. Pseudonym-to-counsellor only (recommended yes).
4. Same Flutter app for clients and counsellors; staff on the web (recommended yes).
5. Launch languages: English and Sinhala; Tamil as fast-follow.
6. Payment: which Sri Lankan gateway, or bank transfer only at launch; currency LKR; who is merchant of record; platform fee; refund actor.
7. Free session: one per client per counsellor (proposed).
8. Messaging: included around a confirmed session, capped, not sold (proposed).
9. Scheduling: 60-minute default, 10-minute buffer, 4-hour minimum notice, 30-day horizon, cancel more than 12 hours ahead for a full refund. Company must replace these numbers.
10. Documents: view and download versus view only; 30-day default grant.
11. No clinical notes in the app at MVP (proposed).
12. ACS as the call provider, recording off, pending contractual review.
13. Ranking: sort by soonest availability by default; rating sort uses a confidence-weighted score and is explained in a one-line caption. No paid rank.
14. Doctor directory source and owner.
15. No paid video in MVP.
16. Named staff for verification, refunds, safety, and privacy requests.
17. Hosting region and retention numbers from counsel.
18. Crisis copy and phone numbers approved by the clinical lead.
19. Capacity guess for the first quarter (concurrent calls) so ACS and SQL tiers are sized.
20. Whether existing Firebase users must be migrated.

## Suggested build order after sign-off

1. Stakeholder workshop on the twenty decisions. Freeze the nine proposed defaults above if the room does not object.
2. Solution skeleton: Azure SQL, API health, Entra External ID on a dev tenant, Flutter shells with the theme, empty staff login. No feature depth.
3. Slices A–D in order, each with API tests for the invariant it introduces (double book, webhook replay, cross-client document read, expired call token).
4. Private mobile tracks and a staging staff site. Migrate a handful of real counsellor profiles only after verification workflow is accepted.
5. Release gate: PRD section 9, backup restore drill, and counsel’s written privacy sign-off.

## Risks to keep visible

- Rebuilding the website’s bank-slip flow inside the app without a ledger will recreate mismatched bookings. The `Payment` states are the mitigation.
- Promising anonymity the payment path cannot keep.
- Two sources of truth if Firebase stays writable.
- Sinhala layout overflow on pill buttons if copy is translated without truncation rules.
- Scope drift into the store. Phase 3 has no tickets until Phase 1 acceptance passes.
