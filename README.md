# Qazyna · adaptive prototype v2

Qazyna is a Russian-language Expo Go app for micro-sellers in Kazakhstan. It brings Instagram and WhatsApp chats, editable AI orders, mock Kaspi payments, inventory and business-specific AI opportunities into one mobile app.

Business records are local demo data. AI can use Gemini or Anthropic through Supabase (setup below), with local fallback. SMS, channel connections, outreach and payments are mocked. No external message is sent and no money moves. The size recommendation is a deterministic demo, not a measurement guarantee.

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

- **Photo:** camera or gallery → resized image → Supabase AI recognition (or a labelled demo fallback) → editable product/quantity/price/confidence rows. Low-confidence rows are highlighted. Without AI configuration, the demo does not perform OCR on the photo. “Попробовать на примере” exercises the same flow without a camera.
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

## Подключение AI

AI работает через `supabase/functions/ai` (Deno). В приложение попадают **только публичные URL и anon key**. Gemini/Anthropic API keys и Supabase service-role key никогда не добавляются в `.env` приложения. Без конфигурации или при ошибке/тайм-ауте показывается «демо-режим» и локальный результат. Платежи и отправка сообщений клиентам по-прежнему локальные моки.

Из корня репозитория владелец выполняет:

```sh
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db push
npx supabase secrets set AI_PROVIDER=gemini GEMINI_API_KEY=YOUR_GEMINI_API_KEY GEMINI_MODEL=gemini-3.5-flash-lite
npx supabase functions deploy ai
cp .env.example .env
```

В Supabase Dashboard → Authentication → Sign In / Providers включите **Anonymous Sign-Ins**. Приложение создаёт анонимную сессию и сохраняет её через AsyncStorage; ID пользователя этой сессии — стабильный идентификатор установки. Функция проверяет bearer token через `auth.getUser()` и совпадение `x-device-id` с проверенным ID. `verify_jwt = false` отключает только проверку старого JWT на шлюзе, а **не аутентификацию обработчика**. Это поддерживает проекты с современными signing keys. Запрос с одним anon key без пользовательской сессии отклоняется.

Содержимое `.env` (ключ из Project Settings → API):

```dotenv
EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=YOUR_PUBLIC_ANON_KEY
```

Перезапустите Metro: `npx expo start --clear`. `.env` игнорируется Git. Для переключения провайдера:

```sh
npx supabase secrets set AI_PROVIDER=anthropic ANTHROPIC_API_KEY=YOUR_ANTHROPIC_API_KEY ANTHROPIC_MODEL=claude-haiku-4-5
```

Оба имени модели задаются секретами; указанные небольшие модели — значения по умолчанию. Проверяйте доступность в своём аккаунте: [Gemini models](https://ai.google.dev/gemini-api/docs/models), [Claude Messages API](https://platform.claude.com/docs/en/api/messages). REST-адаптер не требует provider SDK в мобильном приложении.

### Поведение и ограничения

- `analyze_message`: текст ≤2000 символов, каталог ≤200 товаров, строгая Zod-валидация, только существующие ID/варианты, повтор невалидного ответа один раз, затем `other` с confidence 0. Дата «сегодня» передаётся устройством. Результат, включая демо-результат, кешируется по бизнесу и ID сообщения в AsyncStorage; конкурентные вызовы объединяются. Повторный анализ не отправляет сообщение снова. Для нового текста нужен новый ID сообщения.
- `draft_reply`: последние ≤10 сообщений, три коротких варианта ответа на языке клиента. Нажмите «Предложить ответы» в чате, затем выберите и отредактируйте вариант.
- `read_invoice`: выбранное фото преобразуется в JPEG ≤1600 px по длинной стороне; base64 ≤4 MB. Строки и найденные варианты остаются редактируемыми, низкая уверенность выделяется «Проверьте». Поставщик/дата возвращаются API, склад использует строки. Демо-образец не отправляет фото.
- `map_excel_columns`: кнопка «Определить колонки с AI» передаёт заголовки и первые пять строк. API возвращает name/qty/price/sku/size/color, индексы с нуля, -1 при отсутствии. Текущий склад использует пять полей без SKU; SKU сохраняется только в ответе API. Пользователь проверяет сопоставление перед импортом.
- `write_campaign`: «Написать с AI» в предпросмотре рассылки. Числа вычисляет `opportunities.ts`; цена подставляется сервером вместо `{{price}}`. Ответы с буквальными цифрами/процентами/скидками отклоняются. Предпросмотр требует проверки продавцом; AI не отправляет рассылку.
- Тайм-аут приложения — 15 секунд (включая получение сессии), провайдера — 13 секунд на оба варианта ответа. Сетевая ошибка показывает русский текст и кнопку повтора для ответов, импорта и кампании. Анализ сообщений вместо повторной передачи использует сохранённый результат.
- Лимит — 60 запросов за 60-секундное окно на проверенный ID установки, атомарно в Postgres, общий для всех Edge isolates. При недоступной БД обработчик закрывает доступ. Миграция обязательна: без `db push` AI вернётся к демо. Таблица недоступна anon/authenticated; RPC доступна только service_role. Удаление auth-пользователя удаляет счётчик.
- Переустановка/удаление AsyncStorage создаёт новый анонимный ID: это лимит установки, не защита от массовой регистрации. Для публичного production-запуска настройте Supabase Auth anti-abuse/CAPTCHA и бюджеты провайдера; CAPTCHA потребует отдельного UI. Глобального платного лимита здесь нет.
- Серверные application-логи содержат только task, inputTokens, outputTokens и latency. Сообщения, изображения, ключи и provider error bodies не логируются. Контент передаётся выбранному AI-провайдеру; подтверждение заказа/изменение склада остаётся за продавцом.

### Проверки AI

```sh
npm test
npx tsc --noEmit
npx expo install --check
npx expo-doctor
npx --yes deno check --config supabase/functions/ai/deno.json supabase/functions/ai/index.ts supabase/functions/ai/test.ts
npm run test:edge
npx expo export --platform all
```

Живой smoke-test десяти синтетических сообщений kk/ru/en/mixed (после настройки и деплоя; расходует до десяти AI-запросов):

```sh
npx --yes deno run --env-file=.env --allow-env --allow-net --config supabase/functions/ai/deno.json supabase/functions/ai/test.ts
```

Скрипт печатает номер и разобранный результат, а не credentials. Unit-тесты подменяют провайдера и проверяют auth, лимит, schema repair, каталог, лимиты входа, безопасные ошибки, оба адаптера, cache/fallback/timeout. Живой деплой, реальные ответы провайдера, миграция на Supabase и фото на физическом Expo Go требуют проекта/секретов владельца; локальные тесты их не подтверждают.
