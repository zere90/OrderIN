# Qazyna

A clickable Expo / React Native prototype of an AI assistant for micro-sellers in Kazakhstan. Qazyna brings Instagram and WhatsApp conversations together, extracts orders from Kazakh, Russian and English messages, and demonstrates a Kaspi payment and inventory workflow.

The demo business is a home bakery in Astana. All customers, messages, payments and integrations are fictional. No messages are sent externally and no money moves. Payment URLs use the reserved `pay.example` domain.

## Run on your phone

Use Node.js 20.19.4+ and an Expo Go version supporting Expo SDK 57 (the version installed by the official starter).

```sh
npm install
npx expo start
```

Scan the QR code with Expo Go (Android) or your camera (iOS). Connect the phone and computer to the same network. If they are on different networks:

```sh
npx expo start --tunnel
```

Expo may prompt to install its tunnel helper. For an optional browser preview, run `npx expo start --web`.

## Demo walkthrough

1. **Сообщения:** filter all conversations, Instagram, WhatsApp or detected orders. Open Айгерім's Kazakh message.
2. **Chat:** edit the detected items, quantities, date and address. Confirm to add a fake Kaspi link to the local conversation.
3. **Payment:** tap **Симулировать оплату**. The order becomes paid, stock decreases once, and a confirmation toast appears; Expo Go also provides a success haptic where supported.
4. **Заказы:** inspect awaiting, paid, completed, draft or cancelled orders. Open a paid order to complete it.
5. **Склад:** adjust quantities with +/−. Products below three units are highlighted. Insufficient stock blocks confirmation and payment.
6. **Сегодня:** view revenue received today, today's order counts, pending payments, low stock and drafts. **Сбросить демо-данные** restores the initial demo after confirmation.

Replies and changes persist through restarts with AsyncStorage. Initial stock already accounts for the seeded paid order. Awaiting orders do not reserve stock; payment revalidates availability. Cancellation is permitted before payment only. Completing a paid order does not deduct stock again.

## Structure

```text
app/                 expo-router stack routes
  (tabs)/            inbox, orders, stock, today
  chat/[id].tsx      conversation and editable AI order card
  order/[id].tsx     order details and status actions
src/
  components/        reusable cards, controls, badges, stock rows
  data/              fictional customers, products, chats and demo seed
  i18n/ru.ts         Russian UI strings and formatting helpers
  services/          typed AI, payment and messaging interfaces / mocks
  store/             persisted Zustand state and lifecycle validation
  theme/             light/dark palette, spacing and typography
  types/             shared strict TypeScript domain models
tests/domain.cjs     Node regression tests with mocked native storage
```

## Integrations

`AiService.analyzeMessage` is a deterministic parser with a 600 ms delay. It recognizes product aliases in ru/kk/en, digits and common number words, relative dates, ISO/dotted dates and labeled delivery addresses. Seeded messages include precomputed examples; **Распознать заказ** invokes the parser for messages without orders. This is a deliberately limited parser, not a language model; review extracted details before confirmation.

`PaymentService` creates fake links and demo receipts. `MessagingService` returns mock chats and produces local messages. Replace these implementations behind their interfaces when adding real integrations. Production payment verification, credentials, refunds and network synchronization are outside this prototype.

## Checks

```sh
npm test
npx tsc --noEmit
npx expo install --check
npx expo-doctor
```

Tests cover multilingual parsing, dates, stock validation, status transitions, duplicate payment protection, reset races, local replies and persistence writes. Browser testing covers startup and the clickable payment workflow. A physical Expo Go device is still needed to verify camera QR onboarding and native haptic behavior.
