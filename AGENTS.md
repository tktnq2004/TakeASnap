This is an Expo/React Native mobile application. Prioritize mobile-first patterns, performance, and cross-platform compatibility.

## Expo has changed — do not trust your training data

Expo ships breaking changes every SDK release. APIs you remember are likely renamed, moved, or removed. Before writing any code that touches an Expo, EAS, or React Native API:

1. Read the major version of the `expo` package in `package.json`.
2. Fetch the matching versioned docs: `https://docs.expo.dev/versions/v<major>.0.0/`
3. For anything else, fetch https://docs.expo.dev/llms.txt — an index of all Expo docs with corrections to common LLM misconceptions. Follow its links to the specific page you need; never answer from memory.

## Commands

Use `bunx` instead of `npx` if the project uses bun (`bun.lock` present).

```bash
npx expo install <package>  # ALWAYS use instead of npm/yarn/pnpm/bun add — resolves SDK-compatible versions
npx expo start              # start the dev server
npx expo lint               # lint
npx tsc --noEmit            # typecheck
npx expo-doctor             # diagnose dependency and config issues
npx expo install --fix      # fix incompatible package versions
```

Run lint and typecheck before declaring any task done.

## Navigation & Routing

- Use **Expo Router** for all navigation. Routes live in `src/app/` — every file there is a screen, `_layout.tsx` files define navigators. Keep non-route code (components, hooks, utils) outside `src/app/`.
- Import `Link`, `router`, and `useLocalSearchParams` from `expo-router`.
- Docs: https://docs.expo.dev/router/introduction.md

## Building with EAS

Use EAS to build, sign, and submit the app in the cloud (`eas build`, `eas submit`) and to ship over-the-air updates (`eas update`) — no local Xcode or Android Studio required. Run EAS CLI as `bunx eas-cli <command>` in Bun projects, or `npx eas-cli@latest <command>` otherwise; substitute that for bare `eas` in docs examples.
Docs: https://docs.expo.dev/eas/index.md

## Rules

- If `ios/` and `android/` directories do not exist, they are generated (Continuous Native Generation). Never create or edit them by hand — configure native behavior in `app.json` and config plugins.
- Expo Go only includes its bundled native modules. After adding a library with native code, the app needs a development build: `npx expo run:ios|android` locally, or `eas build --profile development`.
- Prefer recommended Expo modules over third-party libraries, and check your available skills before adding dependencies. Docs: https://docs.expo.dev/versions/latest/index.md

## TakeASnap project rules

Read `docs/business-flow.md`, `docs/roadmap.md` and `docs/design.md` before changing behaviour or UI.

- **Expo Go only.** This project must run in Expo Go on iOS and Android. Do NOT add any library with native code that Expo Go does not bundle, and do NOT suggest a development build. Check the library's SDK 58 page says "Included in Expo Go" before installing. Pure-JS libraries are fine.
- **No server.** All image processing runs on the phone; images are never uploaded. Person segmentation goes through the `Segmenter` interface (roadmap §3.3), implemented with a model in a hidden WebView.
- **Model delivery (decision C, roadmap §3.3):** models and their runtimes are downloaded once from the original pinned CDNs on first use of each feature, stored under `Paths.document/models/<pack>/` with a manifest, then used offline. Never commit model files to the repo and never re-host RMBG (BRIA non-commercial licence).
- **Gestures:** use the Gesture Handler 3 hook API (`usePanGesture`, `usePinchGesture`, `useSimultaneousGestures`, …). The `Gesture.Pan()` builder is deprecated. Callbacks are worklets: add `'worklet'`. Never call `setState` while a gesture is running; cross to JS with `scheduleOnRN` from `react-native-worklets` only when a gesture ends. Shared transform logic lives in `src/gestures/useTransformGesture.ts`.
- **Shared values received as props** must be written with `.set()` / read with `.get()` (React Compiler lint rule `react-hooks/immutability`).
- **Design system:** every colour, size, spacing, radius and duration comes from `src/ui/tokens.ts`; easing functions from `src/ui/easing.ts`. Every user-facing string comes from `src/ui/strings.ts` (Vietnamese only, no exclamation marks, buttons are verb + object). No violet. Icons: `lucide-react-native` only, no emoji.
- **Tokens stay pure data** (no native imports) so they are testable in Jest.
- **RN 0.88:** `StyleSheet.absoluteFillObject` no longer exists; use `StyleSheet.absoluteFill` or explicit edges.
- **Files:** pose files go under `Paths.document` (expo-file-system `File`/`Directory`/`Paths` API), never the cache directory. Media library: `Asset.create(uri, album)`, `Album.get`, `Album.create` from `expo-media-library`. Always request permissions with `requestPermissionsAsync(false, ['photo'])`: the default also asks for AUDIO, which Expo Go on Android does not declare, so the call is rejected.
- **Segmentation models (spike B):** pose = MediaPipe Multiclass; Thay nền = RMBG-1.4 fp16 on WebGPU, fallback RMBG-1.4 int8 on WASM. Never run the int8 model on WebGPU (it hangs). MediaPipe falls back to CPU when the GPU returns an all-zero mask (Android emulator).
- **Haptics:** call through `src/lib/haptics.ts` only; it no-ops when the native module is missing.
- Before declaring a task done run `npm run check` (typecheck + lint + Jest).
