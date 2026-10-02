# Qazyna · adaptive prototype v2

Qazyna is a Russian-language Expo Go app for micro-sellers in Kazakhstan. It brings Instagram and WhatsApp chats, editable AI orders, mock Kaspi payments, inventory and business-specific AI opportunities into one mobile app.

Without Supabase configuration, records and messaging are local demo data. With Supabase configured, Instagram/WhatsApp chats use the real server integrations below, and AI can use Gemini or Anthropic. Payments and SMS remain mocks; configured chat sends are real. The size recommendation is a deterministic demo, not a measurement guarantee.

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

AI работает через `supabase/functions/ai` (Deno). В приложение попадают **только публичные URL и anon key**. Gemini/Anthropic API keys и Supabase service-role key никогда не добавляются в `.env` приложения. Без конфигурации или при ошибке/тайм-ауте показывается «демо-режим» и локальный результат. Платежи остаются локальными моками; реальная переписка настраивается в разделе «Подключение Instagram и WhatsApp».

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

## Подключение Instagram и WhatsApp

Ветка `feature/meta-messaging` добавляет реальные каналы поверх Supabase AI. При наличии `EXPO_PUBLIC_SUPABASE_URL` и `EXPO_PUBLIC_SUPABASE_ANON_KEY` экран чатов читает серверные conversations/messages/order_drafts и подписывается на Realtime. Без этих переменных остаётся демо. **Ошибка реальной отправки никогда не превращается в демо-успех.** Подключения находятся в Настройки → Instagram и WhatsApp; onboarding по-прежнему демонстрационный.

### 1. Supabase и секреты

Используйте тот же проект, что для AI, и выполните миграции:

```sh
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db push
```

Миграции создают businesses, channels, customers, conversations, messages, order_drafts с RLS по `businesses.seller_id = auth.uid()`, очередь AI, OAuth-state и таблицу статусов. Realtime включён для conversations/messages/order_drafts. Каталог из текущего локального бизнеса синхронизируется в `businesses.products`, чтобы webhook AI знал реальные ID товаров. История Instagram/WhatsApp до подключения автоматически не импортируется.

В текущем приложении ID продавца — сохранённая сессия Supabase из предыдущего AI-этапа (анонимная, если постоянного пользователя ещё нет). Его видно в настройках. **Сохраните сессию; удаление данных/переустановка без привязки к постоянному Supabase-пользователю теряет доступ к подключённым бизнесам.** Полноценный вход/восстановление аккаунта не добавляется этой веткой; до production владелец должен обеспечить постоянную авторизацию. RLS работает и для anonymous authenticated пользователей.

Создайте случайные ключи (не коммитьте вывод):

```sh
openssl rand -base64 32  # META_TOKEN_ENCRYPTION_KEY
openssl rand -hex 32    # META_VERIFY_TOKEN
openssl rand -hex 32    # META_CRON_SECRET
```

Установите секреты сервера, подставив свои значения:

```sh
npx supabase secrets set META_APP_ID=YOUR_META_APP_ID META_APP_SECRET=YOUR_META_APP_SECRET META_VERIFY_TOKEN=YOUR_RANDOM_VERIFY_TOKEN
npx supabase secrets set INSTAGRAM_APP_ID=YOUR_INSTAGRAM_APP_ID INSTAGRAM_APP_SECRET=YOUR_INSTAGRAM_APP_SECRET
npx supabase secrets set WHATSAPP_TOKEN=YOUR_TEST_OR_SYSTEM_USER_TOKEN WHATSAPP_PHONE_NUMBER_ID=YOUR_PHONE_NUMBER_ID WHATSAPP_WABA_ID=YOUR_WABA_ID
npx supabase secrets set META_TOKEN_ENCRYPTION_KEY=YOUR_BASE64_32_BYTE_KEY META_CRON_SECRET=YOUR_RANDOM_CRON_SECRET
npx supabase secrets set WHATSAPP_DEV_SELLER_ID=UUID_FROM_QAZYNA_SETTINGS
npx supabase secrets set META_GRAPH_VERSION=v25.0
npx supabase secrets set META_REDIRECT_URIS='qazyna://oauth/meta,exp://YOUR_LAN_IP:8084/--/oauth/meta,http://localhost:8084/oauth/meta'
# Для временного тестового WhatsApp token укажите фактический срок:
npx supabase secrets set WHATSAPP_TOKEN_EXPIRES_AT=2026-10-02T12:00:00Z
```

Дата выше — пример: поставьте действительный будущий срок своего token; не копируйте её как гарантированный срок. При постоянном system-user token без срока этот секрет можно не задавать. WHATSAPP_DEV_SELLER_ID обязателен: общий тестовый номер нельзя присвоить произвольной анонимной установке.

META_REDIRECT_URIS — **точный allowlist**, без wildcard. Скопируйте фактический «Адрес возврата» из настроек Qazyna. `Linking.createURL` может дать другой адрес/порт; добавьте его явно. Meta перенаправляет сначала на HTTPS Edge callback, а сервер — на разрешённый адрес приложения. OAuth state случайный, одноразовый, привязан к продавцу и бизнесу, живёт 10 минут; токен в deep link не передаётся.

```sh
npx supabase functions deploy ai
npx supabase functions deploy meta-webhook
npx supabase functions deploy send-message
npx supabase functions deploy connect-instagram
npx supabase functions deploy connect-whatsapp
npx supabase functions deploy meta-maintenance
```

`verify_jwt=false` нужен webhook/OAuth callback; закрытые POST самостоятельно проверяют `auth.getUser()` и владельца бизнеса. meta-maintenance принимает отдельный cron secret. Токены шифруются AES-256-GCM с уникальным IV и привязкой к business/type/external_id. На `channels.token_encrypted` нет SELECT у app-role; channels не входит в Realtime. **Потеря ключа шифрования требует переподключения каналов.** При ротации ключа сначала расшифруйте/перешифруйте существующие записи на сервере; простая замена секрета сделает их нечитаемыми.

### 2. Webhook и Instagram Login

В [Meta for Developers](https://developers.facebook.com/apps/) создайте/выберите приложение для бизнеса и настройте Instagram API **with Instagram Login** для professional Instagram account (Business/Creator), не Facebook Login и не устаревший Basic Display.

- OAuth redirect URI в настройках Instagram Login:
  `https://YOUR_PROJECT_REF.supabase.co/functions/v1/connect-instagram`
- Callback URL для webhook (Instagram и WhatsApp):
  `https://YOUR_PROJECT_REF.supabase.co/functions/v1/meta-webhook`
- Verify token: ровно значение META_VERIFY_TOKEN.
- Instagram webhook fields: `messages`, `messaging_postbacks`, `messaging_seen`, `message_reactions`. Приложение сохраняет message events/echoes и seen с message ID; реакции/postback-only события пока не отображаются отдельными сообщениями.
- Scopes: `instagram_business_basic`, `instagram_business_manage_messages`.

В Meta App Roles добавьте владельца professional account как Instagram tester (или администратора/разработчика); в Instagram примите приглашение в настройках разрешённых приложений/тестовых приглашений. В Development mode проверяйте через разрешённые аккаунты и активы. Для сторонних продавцов нужны Live mode и Advanced Access/App Review для запрошенных разрешений; настройте privacy policy/data-deletion callback в Meta до публикации. Данная ветка не проходит App Review автоматически.

В Qazyna выберите бизнес → Настройки → «Подключить Instagram». Откроется `openAuthSessionAsync`, сервер обменяет code на short-lived, затем long-lived token, получит профиль и вызовет `/{instagram-user-id}/subscribed_apps`. В приложении появится название подключённого аккаунта. Один Instagram account принадлежит одному бизнесу; уже подключённую запись нельзя незаметно переназначить другому бизнесу/аккаунту.

Expo Go остаётся поддерживаемым рантаймом, но **не регистрирует custom scheme `qazyna://`**. В Expo Go используется текущий `exp://…/--/oauth/meta`; возврат браузера зависит от платформы. Если браузер не закрылся, вернитесь в приложение и нажмите «Обновить» — канал уже сохранён сервером. Надёжный custom-scheme OAuth проверяется в установленной сборке. Native Meta SDK, prebuild и dev-client-only библиотеки не добавлены. См. [Expo OAuth guidance](https://docs.expo.dev/guides/authentication/), [Instagram Login](https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/business-login), [официальная коллекция Meta Messaging](https://www.postman.com/meta/instagram/request/scob1z4/text-message).

### 3. WhatsApp Cloud API: тестовый номер

В Meta app добавьте WhatsApp, откройте API Setup / Getting Started. Скопируйте **Phone number ID**, **WhatsApp Business Account ID**, token в соответствующие Supabase secrets. META_APP_ID/SECRET должны принадлежать приложению, выпустившему WhatsApp token: connect-whatsapp проверяет это через `debug_token` и принадлежность номера WABA.

В API Setup добавьте и подтвердите личные номера тестовых получателей (получатель вводит код у Meta). Тестовый номер отправляет только разрешённым получателям. В WhatsApp → Configuration/Webhooks вставьте URL и Verify token выше, подпишитесь на поле **`messages`** объекта **`whatsapp_business_account`** — оно включает входящие сообщения и sent/delivered/read/failed statuses.

В Qazyna под продавцом WHATSAPP_DEV_SELLER_ID нажмите «Подключить тестовый номер». Сервер прочитает token из secrets, проверит WABA, подпишет WABA через `/{waba-id}/subscribed_apps` и сохранит зашифрованный канал. Временные тестовые токены часто требуют ручного обновления; замените secret и повторите подключение. Автоматически продлеваются только long-lived Instagram tokens.

После входящего сообщения клиента открывается 24-часовое окно. Внутри отправляется обычный текст; снаружи Instagram блокирует отправку, а WhatsApp показывает picker утверждённых шаблонов. Picker загружает первые 100 templates WABA и поддерживает APPROVED templates с текстовым BODY, последовательными `{{1}}…{{n}}` параметрами и необязательными статическими текстовыми HEADER/FOOTER (например `hello_world`). Динамические header/media/buttons и именованные параметры не поддерживаются этим picker. Создайте подходящий шаблон в WhatsApp Manager → Message templates; его имя, язык и число параметров повторно проверяются сервером перед отправкой. Учитывайте правила согласия получателей и тарификацию шаблонов Meta.

**TODO Embedded Signup / coexistence:** интерфейс `EmbeddedSignupConnection` и точка интеграции находятся в `connect-whatsapp/index.ts`. Следующий этап должен принимать одноразовый code, проверять выданные WABA/phone assets, обменивать code на сервере и сохранять канал. Клиентские токены сейчас не принимаются. Embedded Signup/coexistence не заявляются как реализованные.

### 4. Расписание и надёжность

Миграция устанавливает pg_cron/pg_net и задачу `qazyna-meta-maintenance` раз в минуту. В Supabase SQL Editor **от имени администратора** создайте два Vault secrets (значение cron secret должно совпасть с Edge secret):

```sql
select vault.create_secret('https://YOUR_PROJECT_REF.supabase.co', 'qazyna_supabase_url');
select vault.create_secret('YOUR_RANDOM_CRON_SECRET', 'qazyna_meta_cron_secret');
```

Создавайте каждый secret один раз; при повторной настройке обновляйте существующий через Vault. Пока этих secrets нет, cron не делает HTTP-запросов. Токены Instagram, истекающие менее чем через 7 дней и старше 24 часов, обновляются через `ig_refresh_token`; leases предотвращают конкурирующий refresh. Просроченные каналы показывают «Токен истёк». Cron также подбирает незавершённые AI jobs: атомарный ingest сохраняет входящее сообщение, conversation/unread и job, сразу после commit webhook возвращает 200, а `EdgeRuntime.waitUntil` запускает тот же `analyze_message` schema/prompt/provider pipeline, что и функция ai. Входящий текст >2000 символов сохраняется, но не передаётся в AI. API failures повторяются до пяти попыток с задержкой; rate-limit откладывает работу без расхода попытки. Администратор видит исчерпанные jobs в meta_ai_jobs (`not done and attempts >= 5`) и может сбросить attempts после устранения причины. AI не отправляет ответы автоматически.

Webhook проверяет HMAC-SHA256 **сырых байтов** до любого сохранения. WhatsApp проверяется META_APP_SECRET; для Instagram также допускается INSTAGRAM_APP_SECRET, если у Instagram Login отдельный app secret. Повторный external_message_id (с префиксом платформы) не увеличивает unread и не создаёт новый AI job. Out-of-order statuses не откатывают read/delivered. Повтор send с тем же client request ID не вызывает повторную Graph отправку; при неоднозначном timeout статус unknown и новый текст блокируется до сверки с Meta. После сверки с Meta продавец может выбрать «Я проверил переписку в Meta» → «Разрешить новую отправку». Это очищает только локальную блокировку, не отправляет сообщение заново и не меняет сохранённый unknown статус. Не используйте разблокировку вслепую: повтор уже доставленного текста создаст дубль.

«Отправить Kaspi-ссылку» принимает HTTPS-ссылку продавца на kaspi.kz и использует `send-message`; генерация реального Kaspi payment и подтверждение оплаты не входят в этот этап. Принятие AI draft сохраняет статус accepted; оно не проводит оплату и не списывает локальный склад. Демо-заказы/возможности и реальные переписки не объединяются в фиктивные продажи.

Текст, profile name и metadata вложений сохраняются. Instagram attachment URL и WhatsApp media ID сохраняются, но защищённая загрузка/просмотр медиа и история до подключения пока не реализованы. Снимок inbox ограничен 100 conversations и 500 последними messages бизнеса; пагинация старой истории — отдельное расширение. В application logs нет текстов клиентов, токенов или Meta response bodies.

### 5. Локальные проверки

```sh
npm test
npm run test:meta
npm run test:edge
npx tsc --noEmit
npx expo-doctor
npx expo install --check
npx --yes deno check --config supabase/functions/deno.json supabase/functions/meta-webhook/index.ts supabase/functions/send-message/index.ts supabase/functions/connect-instagram/index.ts supabase/functions/connect-whatsapp/index.ts supabase/functions/meta-maintenance/index.ts scripts/simulate-meta-webhooks.ts
npx expo export --platform all
```

Для миграций/RLS/дедупликации нужен работающий Docker:

```sh
npx supabase start
npx supabase db reset --local
npx supabase test db
```

`supabase/tests/meta_messaging_test.sql` проверяет две изолированные учётные записи, запрет чтения ciphertext, защиту функций, повторный ingest, unread/AI jobs, порядок statuses и leases. Эти SQL-тесты и миграции нельзя считать проверенными одним TypeScript/Deno check.

Скопируйте секреты **локального тестового окружения** в игнорируемый `.env.meta.local` (META_APP_SECRET, META_VERIFY_TOKEN и отдельные безопасные тестовые значения). Поднимите функции:

```sh
npx supabase functions serve --env-file .env.meta.local
```

Создайте в локальной БД business/channel с external_id `test-phone` и `test-instagram` (или используйте собственные тестовые IDs). Реальные подключения для симулятора не требуются: он не отправляет сообщения в Meta. Затем:

```sh
npx --yes deno run --env-file=.env.meta.local --allow-env --allow-net scripts/simulate-meta-webhooks.ts
```

Скрипт подписывает два синтетических payload (WhatsApp и Instagram) и отправляет каждый **дважды**, чтобы проверить dedup. Он разрешает только localhost URL; задайте WEBHOOK_URL для другого локального порта. TEST_MESSAGE_ID задаёт ID новой серии (по умолчанию повторные запуски остаются дублями). WHATSAPP_PHONE_NUMBER_ID и INSTAGRAM_TEST_ACCOUNT_ID должны совпадать с локальными channels. Без совпадающего channel корректный webhook получает 200 и игнорируется. Для AI order card добавьте каталог с «Латте» и настройте локальный AI provider.

Живые OAuth, App Review/tester access, доставка через Meta, cron/Vault и возврат на физическом Expo Go требуют аккаунтов/секретов владельца. Они не подтверждаются offline fixtures. В этой рабочей среде Docker daemon недоступен, поэтому миграции/SQL-тесты здесь не запускались.

Проверка браузера с изолированным локальным HTTP/Realtime simulator: входящий текст и AI draft появились без обновления, ответ отобразился со статусом «Отправлено», закрытое окно WhatsApp показало picker и отправку шаблона. [Скриншот синтетической переписки](docs/screenshots/meta-messaging-local.png). Это проверка UI, не подтверждение доставки через Meta.
