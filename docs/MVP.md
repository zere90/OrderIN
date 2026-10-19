# Qazyna — MVP scope

This document maps the product to the MVP steps from the course (problem → audience → user path → prioritised functions → MVP scope → testing).

## 1. Problem

Micro-sellers in Kazakhstan sell through Instagram and WhatsApp DMs. Every order is read and retyped by hand, payment links are sent manually, and stock is updated (or forgotten) separately. The result: lost or wrong orders, overselling items that are out of stock, and no time to bring regular customers back.

**Value in one sentence:** *Qazyna turns customer chats into confirmed, paid orders and keeps stock up to date automatically.*

## 2. Target audience

Owners of very small businesses (one person or a small team) who already take orders in messengers and get paid via Kaspi:
coffee shops, home bakeries, clothing and small brands, beauty studios, neighbourhood groceries. The six business «skins» in the app correspond to these segments.

## 3. User path (customer journey)

```
Message in chat → AI finds the order → Seller checks/edits → Kaspi link sent
      → Customer pays → Stock deducted → Order completed → Revenue on «Сегодня»
```

## 4. Functions by priority

| Priority | Step | Functions | In MVP |
|---|---|---|---|
| **Must** (walking skeleton) | Receive order | Inbox with channel filters; AI order detection; editable order card | ✅ |
| | Confirm & pay | Validation against stock; payment link; payment status | ✅ (Kaspi simulated) |
| | Update stock | Automatic deduction once per paid order; recipes; history | ✅ |
| | Track | Order statuses and timeline; today's revenue | ✅ |
| **Should** | Fill stock fast | Excel/CSV import, manual edits, invoice photo | ✅ (photo OCR via optional server) |
| | Reply fast | AI reply suggestions, quick replies | ✅ |
| | Grow sales | AI opportunities with outreach | ✅ (messages stay in-app in demo) |
| | Several businesses | Business switcher, per-business skins | ✅ |
| **Later** (after feedback) | Real channels | Instagram/WhatsApp in production, Meta App Review | Server code exists, not required for the demo |
| | Real payments | Kaspi Pay API, payment confirmation | ❌ |
| | Accounts | Real SMS login, cloud sync, team members | ❌ |
| | Analytics | Weekly reports, A/B tests of offers | ❌ |

The line between **Should** and **Later** is the MVP boundary: everything above it works in the app today; everything below is simulated or postponed until users confirm the core value.

## 5. Type of MVP

A **single-feature product with Wizard-of-Oz elements**: the core loop (parse → order → pay → stock) is real software; external services (Kaspi, SMS, message delivery) are simulated and clearly labelled «демо» in the interface, so testers experience the full flow without accounts or payments.

## 6. How to test the MVP

**Alpha (team, friends):** go through the main journey on each business type; try wrong input (bad code, zero/negative quantities, wrong dates, quantities above stock, invalid Excel files) and check the error messages.

**Beta (5–10 real sellers, 1–2 weeks):** give each seller the app on Expo Go or the web build, ask them to paste 10 real customer messages using «Написать от имени клиента», and observe:

- share of messages where AI found the right items/quantity without edits;
- time from message to sent payment link;
- which screens they open daily (Чаты / Заказы / Склад / AI);
- whether they would pay for it and which «Later» feature they ask for first.

Collect the answers in short interviews after each week and decide: continue, change the scope, or stop.
