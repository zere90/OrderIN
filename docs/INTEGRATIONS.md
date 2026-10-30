# OrderIN · интеграции (AI, Instagram, WhatsApp)

Этот документ — подробная настройка необязательного серверного режима. Для запуска MVP он **не нужен**: без `.env` приложение работает в демо-режиме (см. [README](../README.md)).

> Начиная с MVP-версии демо-чаты и демо-заказы всегда работают локально, даже когда Supabase настроен. Реальные Instagram/WhatsApp-переписки открываются отдельной вкладкой «Подключённые каналы» на экране «Чаты».

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
npx supabase secrets set WHATSAPP_DEV_SELLER_ID=UUID_FROM_ORDERIN_SETTINGS
npx supabase secrets set META_GRAPH_VERSION=v25.0
npx supabase secrets set META_REDIRECT_URIS='orderin://oauth/meta,exp://YOUR_LAN_IP:8084/--/oauth/meta,http://localhost:8084/oauth/meta'
# Для временного тестового WhatsApp token укажите фактический срок:
npx supabase secrets set WHATSAPP_TOKEN_EXPIRES_AT=2026-10-02T12:00:00Z
```

Дата выше — пример: поставьте действительный будущий срок своего token; не копируйте её как гарантированный срок. При постоянном system-user token без срока этот секрет можно не задавать. WHATSAPP_DEV_SELLER_ID обязателен: общий тестовый номер нельзя присвоить произвольной анонимной установке.

META_REDIRECT_URIS — **точный allowlist**, без wildcard. Скопируйте фактический «Адрес возврата» из настроек OrderIN. `Linking.createURL` может дать другой адрес/порт; добавьте его явно. Meta перенаправляет сначала на HTTPS Edge callback, а сервер — на разрешённый адрес приложения. OAuth state случайный, одноразовый, привязан к продавцу и бизнесу, живёт 10 минут; токен в deep link не передаётся.

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

В OrderIN выберите бизнес → Настройки → «Подключить Instagram». Откроется `openAuthSessionAsync`, сервер обменяет code на short-lived, затем long-lived token, получит профиль и вызовет `/{instagram-user-id}/subscribed_apps`. В приложении появится название подключённого аккаунта. Один Instagram account принадлежит одному бизнесу; уже подключённую запись нельзя незаметно переназначить другому бизнесу/аккаунту.

Expo Go остаётся поддерживаемым рантаймом, но **не регистрирует custom scheme `orderin://`**. В Expo Go используется текущий `exp://…/--/oauth/meta`; возврат браузера зависит от платформы. Если браузер не закрылся, вернитесь в приложение и нажмите «Обновить» — канал уже сохранён сервером. Надёжный custom-scheme OAuth проверяется в установленной сборке. Native Meta SDK, prebuild и dev-client-only библиотеки не добавлены. См. [Expo OAuth guidance](https://docs.expo.dev/guides/authentication/), [Instagram Login](https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/business-login), [официальная коллекция Meta Messaging](https://www.postman.com/meta/instagram/request/scob1z4/text-message).

### 3. WhatsApp Cloud API: тестовый номер

В Meta app добавьте WhatsApp, откройте API Setup / Getting Started. Скопируйте **Phone number ID**, **WhatsApp Business Account ID**, token в соответствующие Supabase secrets. META_APP_ID/SECRET должны принадлежать приложению, выпустившему WhatsApp token: connect-whatsapp проверяет это через `debug_token` и принадлежность номера WABA.

В API Setup добавьте и подтвердите личные номера тестовых получателей (получатель вводит код у Meta). Тестовый номер отправляет только разрешённым получателям. В WhatsApp → Configuration/Webhooks вставьте URL и Verify token выше, подпишитесь на поле **`messages`** объекта **`whatsapp_business_account`** — оно включает входящие сообщения и sent/delivered/read/failed statuses.

В OrderIN под продавцом WHATSAPP_DEV_SELLER_ID нажмите «Подключить тестовый номер». Сервер прочитает token из secrets, проверит WABA, подпишет WABA через `/{waba-id}/subscribed_apps` и сохранит зашифрованный канал. Временные тестовые токены часто требуют ручного обновления; замените secret и повторите подключение. Автоматически продлеваются только long-lived Instagram tokens.

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

Проверка браузера с изолированным локальным HTTP/Realtime simulator: входящий текст и AI draft появились без обновления, ответ отобразился со статусом «Отправлено», закрытое окно WhatsApp показало picker и отправку шаблона. [Скриншот синтетической переписки](screenshots/meta-messaging-local.png). Это проверка UI, не подтверждение доставки через Meta.
