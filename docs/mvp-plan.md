# Sith Sevana mobile app — agreed design

Status: agreed product design. No app code yet.
Date: 12 October 2026.

The website at https://www.sithsevana.lk/ is a style reference only (blue `#3498DB`, green confirmation, Poppins, pill buttons, calm cards). It is not part of this product and is not connected to it. A web admin is a later product.

## Product

One Flutter app for Android and iOS. Clients, counsellors, and staff all work in this app. After sign-in, the tabs depend on role. A person with more than one role chooses which role to use.

A .NET API on Azure holds the rules: Azure SQL, private file storage, sign-in, push, and email. The phone does not decide bookings, payments, chat rights, or document access. Calls use a provider with recording off. Only the client and counsellor on that booking can join.

Version 1 language is English. Labels stay outside the code so Sinhala or Tamil can be added later without a rewrite.

## What version 1 includes

A client can find an approved counsellor, book, pay, join audio or video, chat when the current rule allows it, and keep a private document vault.

A counsellor can apply, be approved in the app, set times and prices, see the day, message, and join the same session.

A staff member can approve or suspend counsellors, confirm bank payments and refunds, handle complaints and reviews, and change company settings. Staff cannot open private chat or client documents in version 1.

Not in version 1: a web app, a store, doctor booking, session notes, recording, and message attachments.

## Locked choices

- **Payment:** card (or a local gateway) inside the app, and bank transfer that staff confirm. Staff can turn either method off. Uploading a bank slip does not confirm the booking by itself.
- **Chat:** no fixed rule in code. Staff choose when a client may message a counsellor. The app shows that rule before send. A change applies to new chats. An open chat keeps the rule the client already saw.
- **Documents:** a counsellor sees a file only when the client shares that exact file. The client can revoke access. Revoke stops future access in the app. It cannot pull back a copy already saved. A new counsellor does not get old files or old chats.
- **Company rules are settings:** free sessions, cancellation and refund, session length, booking notice, payment methods, chat rules, document grant length, and the crisis phone line. Staff change these in the app. A confirmed booking keeps the price and terms the client already accepted.

Starting values until staff change them: free session off, 60 minutes, cancel more than 12 hours ahead for a full refund, chat any time after the client picks the counsellor, both payment methods on, document grants last 30 days.

Not a setting: adults only, no recording, no clinical notes, no store.

## Tabs

**Client:** Home, Counsellors, Sessions, Messages, Profile. Documents, payments, and settings are under Profile.

**Counsellor:** Today, Calendar, Messages, Clients, Profile. Price, availability, and verification are under Profile. Until staff approve them, an applicant sees only application status.

**Staff:** Home, Counsellors, Payments, Support, Settings.

- Home: what needs action today.
- Counsellors: approve, reject, suspend.
- Payments: bank slips and refunds.
- Support: complaints and reviews.
- Settings: company rules, videos, and the doctor list.

## Build order

Do not start a later slice until the one before it works on a phone.

1. Foundation — theme, English, sign-in, roles, consent, adults-only gate, three shells.
2. Supply — counsellor application; staff approve, reject, request information, or suspend on the phone.
3. Diary — profile, search, availability, book, cancel, reschedule. Only one confirmed booking per slot.
4. Money — price and rules shown before confirm; card and bank transfer as settings.
5. Session — chat under the staff rule; audio and video; camera optional.
6. Vault — upload, request, share one file, revoke, access history.
7. Trust and content — one review per completed session, reminders without clinical detail, public videos, informational doctor list, complaints.

Staff screens ship with the slice that needs them, not at the end.

## Still needed before card payments go live

Which card gateway to use, and where data may be hosted. That does not block the rest of the design or slices 1–3.
