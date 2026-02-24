---
phase: 3
plan: 2
wave: 2
depends_on: ["3.1"]
files_modified: ["backend/db/schema.sql", "frontend/src/utils/email-service.ts", "frontend/src/app/components/TraditionalLogin.tsx", "frontend/src/app/components/TraditionalRegistration.tsx"]
autonomous: true

must_haves:
  truths:
    - "Users receive a suspicious login alert after 3 failed login attempts."
    - "Email logic utilizes EmailJS in the frontend."
  artifacts:
    - "frontend/src/utils/email-service.ts is configured."
    - "Users table tracks email and phone."
---

# Plan 3.2: EmailJS Integration

<objective>
Configure EmailJS to send users suspicious login alerts upon failed authentications to increase account security.

Purpose: Protect user accounts against brute force attacks.
Output: Integrated `email-service.ts` tracking failed traditional logins in `TraditionalLogin.tsx`.
</objective>

<context>
Load for context:
- .gsd/SPEC.md
- frontend/src/utils/email-service.ts
- frontend/src/app/components/TraditionalLogin.tsx
</context>

<tasks>

<task type="auto">
  <name>Configure EmailJS Utils</name>
  <files>frontend/src/utils/email-service.ts</files>
  <action>
    Define generic functions to send OTP and suspicious login alert using `@emailjs/browser` templates.
  </action>
  <verify>Functions are correctly typed and exported</verify>
  <done>Variables configure VITE env correctly</done>
</task>

<task type="auto">
  <name>Implement Suspicious Login Trigger</name>
  <files>frontend/src/app/components/TraditionalLogin.tsx, backend/routes/auth.js</files>
  <action>
    Track failed attempts in frontend. On 3rd failure, call `sendSuspiciousLoginAlert()`. Backend `/api/auth/login` must return the registered email to the frontend securely even if auth fails.
  </action>
  <verify>3 consecutive failed username/password logics trigger the send logic</verify>
  <done>User is notified via the UI that an email was dispatched</done>
</task>

</tasks>

<verification>
After all tasks, verify:
- [x] Schema correctly modified to insert `email`.
- [x] Email trigger successfully fires after 3 failures.
</verification>

<success_criteria>
- [x] All tasks verified
- [x] Must-haves confirmed
</success_criteria>
