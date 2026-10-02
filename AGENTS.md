# Qazyna project rules

- Preserve the Expo SDK installed by create-expo-app (currently SDK 57). Keep the app runnable in Expo Go with `npx expo start`.
- Install dependencies with `npx expo install <package>` so native versions match the SDK. Never use `npm install <package>` to add dependencies. `npm install` is permitted for restoring the lockfile.
- No prebuild, custom native modules or dev-client-only libraries. Prefer expo-router, Zustand, AsyncStorage, @expo/vector-icons, expo-clipboard, expo-haptics and react-native-safe-area-context; justify any other new library. Starter dependencies may remain.
- Keep TypeScript strict. Routes live in `app/`; reusable UI, data, services, state, theme and types live under the corresponding `src/` folders.
- Put integrations behind typed `AiService`, `PaymentService` and `MessagingService` interfaces. This prototype uses mocks only: no real payments, external messages or API credentials.
- Put Russian UI strings in `src/i18n/ru.ts`; mock customer messages may mix Kazakh, Russian and English. Format money as `12 500 ₸` and dates for Russian readers.
- Maintain light/dark themes, deep teal #0F766E, gold #F5B301, rounded 16-point cards and mobile-friendly touch targets.
- Preserve order lifecycle: draft → awaiting_payment → paid → completed, with cancellation before payment. Validate positive integer quantities, known products, dates and sufficient stock. Decrement stock exactly once on payment; never allow negative stock.
- Persist demo state with Zustand / AsyncStorage. Avoid accessing native or browser storage during server rendering. Keep reset repeatable and protect async mutations from reset races.
- Run `npm test`, `npx tsc --noEmit`, `npx expo install --check` and `npx expo-doctor` after relevant changes. Start Expo and verify affected flows; report device-only checks honestly.
- Keep README instructions and service contracts current. Do not add secrets, generated native directories, node_modules or build exports to Git.
