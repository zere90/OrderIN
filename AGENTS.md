# OrderIN project rules

- Stay on Expo SDK 57 and preserve Expo Go compatibility. Install dependencies only with `npx expo install <package>`. SDK 57 patch alignment is allowed when Expo's compatibility checker requires it; no SDK-major upgrades, prebuild, custom native modules or dev-client-only libraries.
- Allowed additions: @supabase/supabase-js, expo-image-manipulator, expo-font, @expo-google-fonts/unbounded, @expo-google-fonts/manrope, expo-linear-gradient, react-native-svg, expo-blur, expo-haptics, expo-image-picker, expo-document-picker, xlsx, @expo/vector-icons. Existing router, Zustand, AsyncStorage, clipboard, safe-area and starter dependencies remain. Do not add Vite/Tailwind/react-dom for design reference code.
- `design/figma-make/` is reference only. Do not run, install, build or import it. It is excluded from app TypeScript checks.
- Strict TypeScript. Routes in `app/`; reusable components, business catalogs, services, store, theme and types under `src/`.
- All screen/component colors come from `useTheme()`. Exact six skin constants live in `src/theme/skins.ts`; shared neutral/semantic colors and dimensions in `tokens.ts`. Dark mode uses near-black backgrounds and each skin's second color for accent text/icons. No literal color values in screens.
- Icons go through `src/components/Icon.tsx` using design Material Symbols names. Unbounded is for display headings/numbers; Manrope for body text. Keep the splash until fonts and persisted state load.
- Use shared Screen/Header/Card/AICard/Button/BottomSheet/Toast components. New AI cards use `OpportunityCard`. Preserve spring press feedback, native safe areas and a responsive full-window layout.
- Keep Russian UI strings/templates in `src/i18n/ru.ts`. Mock customer content may mix ru/kk/en. Format money as `12 500 ₸` and dates in Russian.
- Every business owns its customers/chats/messages/orders/products/history/opportunity state. Capture business IDs for asynchronous work; never apply a response to whichever business happens to be selected later.
- Integrations stay behind typed AI, Payment, Messaging, Opportunity and Import service interfaces. AI may call the authenticated Supabase Edge Function; provider secrets remain server-side. Configured Instagram/WhatsApp sends go through authenticated server functions with 24-hour window enforcement. Demo messaging, payments and SMS remain mocks. No API secrets in the app.
- Compute opportunities and their numbers from business data. Persist hides/undo, created products, shopping checklists and all local outreach.
- Order lifecycle: draft → awaiting_payment → paid → completed; cancellation before payment. Validate finite nonnegative totals, positive integer quantities, dates, variants, and stock. Deduct stock and component requirements once. Preorders collect deposits without reducing unavailable stock.
- Preserve inventory-history sources. Excel values replace absolute stock counts; photo/manual imports add quantities. Match variants using name + size + color; reject invalid/duplicate rows and stale previews before atomic application. Keep the sample workbook and bundled copy byte-identical.
- Persist with Zustand/AsyncStorage; do not read browser/native storage during SSR. Local demo state is stored under `orderin-demo-v2`. Reset must invalidate pending async writes.
- Run `npm test`, `npx tsc --noEmit`, `npx expo install --check`, `npx expo-doctor`; bundle affected native/web platforms and inspect relevant browser flows. Report physical-device-only checks honestly.
- Keep README and PR validation/design-difference notes current. Do not commit secrets, node_modules, build exports, native generated directories or local user state.

- Messaging tokens are AES-GCM encrypted server-side and unavailable to app SELECT/Realtime. Keep raw-body webhook signature verification, tenant RLS, durable deduplication/AI jobs and outgoing idempotency. Never silently replace failed real sends with mock success.
