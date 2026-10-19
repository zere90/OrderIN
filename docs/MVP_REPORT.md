# MVP completion report

Starting point: the existing Expo app (prototype v2 + Supabase AI + Meta messaging branches merged). Concept, architecture, design system and six skins were kept; changes target the stability of the core journey, consistency and demo readiness.

## Errors and problems fixed

| # | Problem | Impact | Fix |
|---|---|---|---|
| 1 | With `.env` present, the Chats tab replaced all demo chats with the live Supabase inbox | Core journey invisible; empty inbox if the backend or Meta channel isn't set up | Demo chats always available; live conversations moved to a «Подключённые каналы» tab |
| 2 | With `.env` present, «Подтвердить и отправить Kaspi», replies and outreach sent demo chats to the live `send-message` function | Confirming an order failed → order could never be paid | On-device chats always use local messaging; live chats keep the real service |
| 3 | Opening a chat/order link with an unknown or reset business crashed (`Cannot read properties of undefined (reading 'id')`) | White screen after reset, old deep link or reload | Guards and fallback to the current business; friendly «not found» states on chat, order, try-on, shopping, import |
| 4 | Aggregated daily revenue receipts appeared in «Заказы» as fake orders (e.g. «Латте ×1 — 47 300 ₸») and inflated the «Заказов» counter | Misleading data in the demo | Receipts kept only for the revenue chart; lists and counters skip them |
| 5 | Every business's seeded order had the coffee-shop address («ул. Абая 12») even when the message said another address | Data contradicted the chat | Per-business addresses matching each message |
| 6 | Completing an order showed the toast «Выполнены» (a tab label) | Confusing feedback | «Заказ выдан клиенту»; cancel now also confirms with a toast |
| 7 | Going back and forth in «Add business» onboarding created duplicate businesses | Duplicate entries in the switcher | Business is created once per wizard run |
| 8 | Welcome screen buttons overflowed («Зарегистрироваться» clipped) | Broken first impression | Full-width stacked buttons |
| 9 | Shopping-list opportunity showed a permanently disabled «Отправить клиентам» and could not be reopened after creation | Dead button, lost list | Button hidden when there are no recipients; «Открыть список» after creation; progress «Куплено N из M» |
| 10 | «Новый заказ» on Today silently created an order for the first product and first customer | Unexpected data | Bottom sheet to choose customer and product (in-stock items only) |
| 11 | «Поделиться» failed in browsers without the Share API | Error toast on desktop | Falls back to copying the text |
| 12 | Kazakh letters (ә, ң, қ…) are missing in Unbounded/Manrope and rendered as mixed fonts | Broken-looking greetings and messages | Such strings use the platform font |
| 13 | Analysed messages showed a disabled button with a long technical sentence | Visual noise | Compact «✦ AI: вопрос · 94%» tag; analyse action only when not yet analysed |
| 14 | Order IDs shown as raw fragments («9-jdxzr5») | Unprofessional | Readable order numbers («№ 1041») |
| 15 | On wide screens the mobile layout stretched across the whole window | Hard to read on a projector | Centred column (max 720 px) on web, bottom sheets constrained too |
| 16 | `expo serve` returns 404 when reloading dynamic pages of the static build | Reload during a demo breaks | `npm run serve:web` zero-dependency server resolving dynamic routes |

## UI/UX improvements

- Chat composer: one row of AI/quick-reply chips, round send button, compact AI status, clear separation from messages.
- New demo capability for presentations: write **as the customer** and watch AI create the order instantly.
- Onboarding: lightweight back link instead of a full-width button.
- Orders list: newest first, status + number + date on each card, cancelled orders shown in the archive tab, helpful empty state.
- AI status shown as a single line («✦ AI · демо-режим», spinner while thinking, retry on error).
- Manual orders are labelled «Заказ создан вручную» instead of «ИИ: найден заказ».

## Verification performed

- `npm test` — all three suites pass, including a new MVP-journey test (customer message → AI order → confirm → double-tap payment → stock deducted once).
- `npm run typecheck` — passes (strict).
- `npx expo export --platform all` — web, iOS and Android bundles build.
- `expo install --check` — dependencies up to date (offline mode; Expo's online checks were not reachable from the build environment).
- Browser end-to-end run on the production build (Chromium, 390×844): onboarding with wrong/correct code, chat → confirm → pay → complete, live customer message parsing, orders tabs, new order, outreach, combo creation, Excel sample import, invoice sample import, manual stock edit and history, business switching, try-on order, bakery shopping list, dark mode, skins, reset, reload persistence, deep-link reload — **13/13 steps passed, no console errors**.
- Same checks at 360 px, 768 px and 1440 px widths, in dark mode, and with Supabase configured but unreachable (demo flow keeps working; AI shows the fallback message with retry).

## Not verified here

- Physical phone in Expo Go (camera, file picker, haptics, native keyboard).
- Live Supabase/Meta backend, Deno and SQL tests (no network access / Docker in the build environment).
