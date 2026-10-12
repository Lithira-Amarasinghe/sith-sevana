# Sith Sevana mobile app — agreed design

Status: agreed product design. Slice 1 is started: role shells in the Flutter app, and company settings plus booking-term capture in the API.
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

## Build slices

Finish one slice on a phone before starting the next. Card payments, public videos, and the doctor list stay after the core trip works. The settings table already exists. Each slice only adds the controls it needs.

**Done**

- Shells for client, counsellor, and staff, with the agreed tabs.
- Company settings in the API, and a booking quote that keeps the cancellation window it was given.

**1. Sign-in**

- Email sign-in, sign out, adult check, and consent.
- The app opens the right tab set for the role.

**2. Counsellor supply**

- Counsellor submits an application.
- Staff approve, reject, or ask for more information.
- Only an approved counsellor can appear later.

**3. Profile and times**

- Approved counsellor sets profile, price, and weekly times.
- Client can search and open that profile.

**4. Book a slot**

- Client picks a free time.
- The screen shows price and the cancellation rule.
- The server allows only one confirmed booking for that time.
- Client can cancel. A confirmed booking keeps the terms it was quoted.

**5. Bank payment**

- Client uploads a payment slip. The booking stays "Waiting for payment".
- Staff mark it paid or reject it. Only "mark paid" confirms the booking.
- The card switch exists in settings and stays off.

**6. The call**

- Join button only inside the join window.
- Audio and video for the two people on that booking. Camera can be off. No recording.

**7. Chat**

- One thread after the client picks that counsellor.
- Send is allowed only when the current chat setting says so. The rule is shown above the message box.

**8. Documents**

- Client uploads a file.
- Counsellor can ask for a file.
- Client shares that one file, or declines. Client can revoke. The counsellor cannot see anything else.

**9. After the session**

- One review per completed booking.
- Client can raise a complaint. Staff can see the complaint, not the chat or the file.

**Later, same app, not required for the first usable version**

- Card gateway.
- Reminder pushes.
- Public videos and the informational doctor list.
- The rest of the settings screen (file size, reminder times, suspension behaviour).
