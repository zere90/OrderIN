# Qazyna · adaptive prototype v2

Qazyna is a Russian-language Expo Go app for micro-sellers in Kazakhstan. It brings Instagram and WhatsApp chats, editable AI orders, mock Kaspi payments, inventory and business-specific AI opportunities into one mobile app.

Everything is local demo data. SMS, channel connections, AI invoice recognition, outreach and payments are mocked. No external message is sent and no money moves. The size recommendation is a deterministic demo, not a measurement guarantee.

## Run

Use Node.js 20.19.4+ and Expo Go compatible with **Expo SDK 57**.

```sh
npm install
npx expo start
```

Scan the QR code with Expo Go on Android or the camera on iOS. If your phone is on another network:

```sh
npx expo start --tunnel
```

Expo may prompt to install its tunnel helper. A browser preview is available with `npx expo start --web`. Native camera, file-provider permissions and haptics require an actual device for final verification.

First launch walks through welcome → mock phone/code → business type → questions → mock connections → inventory setup → ready. Use any ten-digit demo phone and **1234**. Onboarding completion persists. Settings contains the demo reset action; it restores the three default businesses without repeating onboarding.

## Screens and flows

- **Чаты:** Instagram/WhatsApp/order/question filters, multilingual conversations, AI reply chips, editable order items/quantity/date/address/total, mock Kaspi links and payment simulation. Clothing chats can send an Expo deep link to size selection.
- **Заказы:** awaiting/paid/completed segments, detail timeline, completion and cancellation before payment. Payment validates inventory and deducts stock exactly once, including recipe/bundle components.
- **AI / Возможности:** one reusable card for computed recommendations, editable outreach with recipient selection, product/package/preorder creation, hide with undo, invoice and spreadsheet tools.
- **Склад:** skin-specific heading, variants, food ingredients or beauty materials, low-stock highlights, manual edits, Excel/photo updates and an auditable source for every change.
- **Сегодня:** seven-day revenue sparkline, bento metrics, top opportunity and quick actions.
- **Business switcher:** independent data per business, live revenue and unread counts, add-business onboarding, settings.
- **Settings:** system/light/dark mode, reset, and **Все стили**, with Today previews in all six skins.
- **Try-on:** height, weight, usual size and fit → size recommendation, silhouette, size table and a real local draft order for an available variant.
- **Shopping checklist:** generated from tomorrow’s bakery orders, recipes and current ingredient stock, with persisted checkboxes.

## Six businesses

Kofe Tau (coffee), Aru Style (clothing) and Bake by Aziza (bakery) are available by default. Add Dala Market (groceries), Nur Beauty (beauty), Tumar (small brand), or another business of an existing type from the switcher.

Opportunities are computed from each business's own mock data: co-purchases, size requests, weekly repeat orders, expiration dates, service intervals/free slots, sold-out requests, past celebration dates and upcoming Наурыз / 8 марта. Prices, recipient counts and expected revenue update with the underlying data. Expected revenue is an illustrative offer × recipient calculation, not a sales forecast. Creating a bundle keeps component references; paying a preorder collects its 50% deposit without deducting unavailable stock.

## Inventory imports

- **Photo:** camera or gallery → 1.5-second mock recognition → editable product/quantity/price/confidence rows. Low-confidence rows are highlighted. The demo does not perform OCR on the photo. “Попробовать на примере” exercises the same flow without a camera.
- **Excel/CSV:** DocumentPicker → SheetJS → editable ru/kk/en header mapping → stock/price differences → explicit application. Excel values are absolute stock counts; invoice/manual additions are increments. Matching uses product name + size + color. Invalid/duplicate rows and stale previews are rejected.
- [assets/sample-stock.xlsx](assets/sample-stock.xlsx) is a real example workbook. The sample button parses its byte-identical bundled base64 copy, so it also works offline in Expo Go. Import up to 500 data rows / 2 MB. The selected local file is read through Expo's file-capable fetch, with no upload.
- SheetJS is pinned to the official [0.20.3 vendor distribution](https://docs.sheetjs.com/docs/getting-started/installation/nodejs/) rather than the outdated npm-registry build. Install dependencies through `npx expo install` when adding or changing packages.

## Structure

```text
app/
  (tabs)/                chats, orders, AI, stock, today
  chat/[id].tsx          conversation and payment workflow
  order/[id].tsx         details and timeline
  tryon/[productId].tsx  customer size-selection demo
  shopping/[id].tsx      ingredient checklist
  onboarding.tsx         first launch / add-business wizard
  import.tsx             camera/gallery, XLSX/CSV and manual import
  settings.tsx           theme preference and reset
  skins.tsx              six Today previews
src/
  components/            native shared UI, Icon mapping, OpportunityCard
  data/{type}.ts         six separate business catalogs
  data/mock.ts           business-scoped chats, receipts, orders and history
  i18n/ru.ts             Russian strings, templates and formatting
  services/              typed AI, messaging, payments, opportunities, imports
  store/                 persisted Zustand business state and transactions
  theme/                 exact six skins, tokens, local fonts, ThemeProvider
  types/                 strict domain types
assets/sample-stock.xlsx real sample import workbook
tests/domain.cjs         domain regression suite
design/figma-make/src/   read-only Figma Make source reference
```

The design reference is excluded from TypeScript checking and is never imported or built by the app. No Vite or Tailwind was installed. Existing `react-dom` / `react-native-web` remain solely for the Expo web preview. Native screens fill the window without a fixed phone width.

## Design port and intentional differences

Unbounded / Manrope fonts, exact six skin palettes, gradient cards and buttons, Material icon-name mapping, raised AI tab, 0.94 press animation, native sheets and toast follow the supplied design. CSS radial gradients are reproduced by LinearGradient plus soft SVG radial circles; Material Icons substitute for the web Material Symbols Rounded font. Native text inputs and system pickers replace browser inputs; OS-specific keyboard, safe area, shadow and modal rendering can differ. Dynamic business data replaces cross-business/static example numbers from the reference. The expanded opportunities feed follows the requested v2 rules rather than the reference's static mock feature panels.

V2 uses `qazyna-demo-v2` storage. The previous prototype's `qazyna-demo-v1` key remains untouched. This is an independent demo seed, not a migration of existing seller records. SDK 57 patch versions were aligned with Expo's compatibility check; the SDK major remains 57.

## Validation

```sh
npm test
npx tsc --noEmit
npx expo install --check
npx expo-doctor
npx expo export --platform all
```

Tests cover skins and business isolation; dynamic opportunity calculations and actions; ru/kk/en parsing; order/payment transitions, duplicate taps and reset/switch races; preorder deposits; ingredient checklists; real XLSX parsing, column mapping, duplicate/invalid rows, variants and stale stock previews; persistence.

Phone-width browser verification covers onboarding, business switch, outreach, try-on → order → payment, Excel preview/application, invoice recognition, dark mode and reload persistence. iOS/Android export is a build check, not a physical Expo Go test.

## Screenshots

[Today — Kofe Tau](docs/screenshots/today-coffee.png) · [AI opportunities](docs/screenshots/opportunities.png) · [Skins in dark mode](docs/screenshots/skins-dark.png)
