# Codigdex Mobile

Expo (SDK 57) + React Native 0.86 client, entry point `App.tsx`. It renders its
own native game — title, world, battle, capture, result, dex, and settings —
with plain React Native views and a [React Native
Skia](https://shopify.github.io/react-native-skia/) canvas for the world
scene. There is no WebView and no Phaser here; the web client's Phaser canvas
and scene classes stay in `web/`. It shares game rules, content, and the save
schema with the web app through the workspace packages; rendering, navigation,
input, and persistence are separate per platform.

## What is implemented

`App.tsx` wraps `SaveProvider` and `NativeGame`. `src/game/NativeGame.tsx` is a
single in-memory route state machine (`"title" | "world" | "battle" |
"result" | "dex" | "settings"`) — not file-based routing; Expo Router and the
earlier read-only dex-only slice were replaced by this sprint's playable loop.

| Screen | What it does |
| --- | --- |
| Title | Logo, capture count, Play / Codigdex / Settings |
| World | `WorldCanvas` renders a Skia background scene; `DPad` moves a virtual position over it; reaching the glowing quest marker enables "Start battle" |
| Battle | Loads the monster's quiz pack (`@codigdex/quiz-content`'s `loadQuizPack`), draws questions with `game-core`'s `drawQuizQuestions`, and scores answers with a 550ms feedback delay |
| Result | Shows the score percentage and, at ≥60% correct, registers the capture |
| Dex | Grid over `DEX_MONSTERS`; captured monsters show art and name, others show `?` |
| Settings | Locale toggle (ko/en) and reset progress |

`src/game/battle.ts` holds the scoring rules: `CAPTURE_PASS_RATE = 0.6`,
`didPassBattle()`, `battlePercent()`. `NativeGame` calls `capture(monsterId)`
(from `useSave()`) when a battle passes.

## Shared packages

- `@codigdex/game-core` — save schema and v1/v2 → v3 migrations
  (`save/schema`, `save/storage`), locale contracts and `localize()`
  (`i18n/locale`), quiz drawing (`domain/dex/quiz`)
- `@codigdex/game-content` — `CHAPTERS` and stage/chapter status for the
  world screen, `DEX_MONSTERS` for the dex grid
- `@codigdex/quiz-content` — `loadQuizPack()` for the battle screen; unlike
  the earlier dex-only slice, the battle/capture loop is now implemented on
  mobile too
- `@codigdex/game-assets` — art, resolved from asset keys through a
  generated static `require()` map (unchanged from before this sprint)

Rendering, navigation, input, and persistence adapters live in this directory
because those concerns differ between web and mobile.

## Assets

Shared packages store **asset keys** (paths relative to
`packages/game-assets/files/`), never URLs or bundler imports. Metro cannot
resolve a dynamic `require()`, so `scripts/generate-asset-map.mjs` reads the
key list out of `packages/game-assets/src/manifest.generated.ts` and writes
one static `require()` per key into `src/assets.generated.ts`, typed as
`Readonly<Record<AssetKey, ImageSourcePropType>>`.

`src/assets.ts` exposes `mobileAssetSource(key)`, which validates the key with
`isAssetKey()` and throws on an unknown one.

`src/assets.generated.ts` is committed. Regenerate it after adding, renaming,
or removing art:

```bash
npm run generate --workspace @codigdex/game-assets   # refresh the shared manifest first
npm run generate:assets --workspace @codigdex/mobile
```

`npm run typecheck --workspace @codigdex/mobile` runs the generator with
`--check` and fails while the committed map is stale. Every script that feeds
the bundler — `start`, `android`, `ios`, `export:android`, `export:ios` —
regenerates the map first, so a stale map cannot reach Metro.

## Save persistence

`src/storage/asyncStorage.ts` binds `@react-native-async-storage/async-storage`
to `createAsyncSaveStorage()` in `src/storage/saveStorage.ts`, which implements
the shared `SaveStorage` contract. The schema is `StoredGameStateV3`.

On `load()` the adapter tries the AsyncStorage keys in order —
`codigdex:save:v3`, `:v2`, `:v1` — through `game-core`'s `parseSave()`, which
migrates v1/v2 payloads up to v3. The first key that parses wins; when it was
not the v3 key, the migrated result is written back to `codigdex:save:v3`. An
unparseable value falls through to the next key, and a storage read failure or
an exhausted list returns `createEmptySave()` rather than throwing.

`save()` only ever writes `codigdex:save:v3`. `src/state/SaveProvider.tsx`
hydrates once on mount, exposes `{ capture, clearProgress, hydrated, locale,
save, setLocale }` through `useSave()`, and updates the in-memory save
optimistically before persisting. Every persist call is
`.catch(() => undefined)` — a rejected write is silently swallowed, leaving
memory ahead of disk with nothing surfaced to the player. That is accepted as
next-sprint work (see [Known limitations](#known-limitations)).

## Orientation and native projects

`app.json` sets `"orientation": "landscape"`. `expo prebuild` baked that into
the committed native projects: `android:screenOrientation="landscape"` on
`MainActivity` in `android/app/src/main/AndroidManifest.xml`, and
`UISupportedInterfaceOrientations` restricted to the two landscape values in
`ios/Codigdex/Info.plist`. The status bar is hidden via `expo-status-bar`'s
`<StatusBar hidden />` in `App.tsx`, not a native plist key.

Both `android/` and `ios/` are committed source trees (this sprint moved from
generating them on demand to checking them in) — only build output and Pods
are git-ignored (`mobile/.gitignore`): `android/.gradle/`, `android/build/`,
`android/app/build/`, `ios/build/`, `ios/Pods/`, and Xcode user-data
directories.

## Fonts and theme

`src/ui/theme.ts` exports `colors` and `font = "monospace"`. The earlier
Galmuri14 bitmap font and its `expo-font` loading gate were dropped this
sprint; `App.tsx` renders immediately, with no font-loading splash state.

## Running it

This project is configured for a native dev/build workflow — `start` targets a
custom dev/native build (`expo start --dev-client`), not Expo Go, and running
it under Expo Go has not been validated. Install once from the repository
root (`npm ci`, Node 22.x), build and install that native build, then start
Metro:

```bash
npm run android --workspace @codigdex/mobile   # generate assets, expo run:android — build, install, launch
npm run ios --workspace @codigdex/mobile       # generate assets, expo run:ios — build, install, launch

npm run start --workspace @codigdex/mobile     # generate assets, expo start --dev-client
```

There is no tunnel script for this app anymore. To open the native IDE
projects directly instead of building from the CLI:

```bash
npm run open:android --workspace @codigdex/mobile   # opens android/ in Android Studio
npm run open:ios --workspace @codigdex/mobile        # opens ios/Codigdex.xcworkspace in Xcode
```

From the repository root, `npm run mobile:android` / `npm run mobile:ios` are
aliases for the two `open:*` scripts above. `prebuild` / `prebuild:clean`
regenerate the `android/`/`ios/` trees from `app.json` if they ever need to be
recreated from scratch.

## Checks

```bash
npm run typecheck --workspace @codigdex/mobile   # asset-map --check, then tsc --noEmit
npm test --workspace @codigdex/mobile            # vitest run
npm run export:android --workspace @codigdex/mobile
npm run export:ios --workspace @codigdex/mobile
```

`typecheck` and `test` are also covered by the root `npm run typecheck` and
`npm test`, which fan out across every workspace. The mobile workspace's own
Vitest suite is `src/game/battle.test.ts` — the pure capture-threshold and
percentage-formatting functions in `src/game/battle.ts`.

### Bundler checks (`export:android`, `export:ios`)

Both export scripts regenerate the asset map and then run `expo export` for
one platform:

| Script | Command it runs | Output |
| --- | --- | --- |
| `export:android` | `expo export --platform android --output-dir .tmp-expo-export/android` | `_expo/static/js/android/*.hbc` |
| `export:ios` | `expo export --platform ios --output-dir .tmp-expo-export/ios` | `_expo/static/js/ios/*.hbc` |

Each one produces a full Metro bundle plus Hermes bytecode for its platform.
They are the cheapest way to catch a bundler-level break — an unresolved
`require()` in the generated asset map, a module a shared package pulls in
that Metro cannot resolve, a platform-conditional import that only one
platform takes — without an Android SDK, Xcode, an emulator, or a device.

**What these verify, and what they do not.** `expo export` only bundles and
compiles JavaScript. No native code is compiled for either platform, so both
scripts run on Windows and Linux with no Android SDK installed, and
`export:ios` needs no macOS host, no Xcode, and no CocoaPods install. That
also bounds what a green run proves: it says the JS graph resolves and Hermes
accepts it for that platform. It says nothing about native modules linking,
`AndroidManifest.xml` or `Info.plist` / entitlement and permission
configuration, app startup, layout on a real screen, or anything in either
native runtime. Neither script **replaces** a development build (`expo
run:android`, `expo run:ios`, or EAS Build) or a run on an emulator,
simulator, or real device — do those before trusting a change on that
platform.

From the repository root, `npm run build:mobile` runs `export:android` then
`export:ios` — it is a bundle check, not an APK/IPA build.
`.github/workflows/ci.yml` runs it on every pull request touching `mobile/`,
`packages/`, or `web/`, after `typecheck`, `lint`, and `test`, and before the
web build.

## Verified this sprint

- `typecheck`, `lint`, and the full repository's 475 unit tests pass.
- Both `export:android` and `export:ios` succeed.
- Android: a native ARM64 debug build (`./gradlew :app:assembleDebug
  -PreactNativeArchitectures=arm64-v8a`), `adb install`, and Metro reached the
  title screen on a Pixel 8 emulator.
- iOS: an Xcode 27 / iOS 27 simulator build and install succeed, but the app
  exits immediately — see [Known limitations](#known-limitations).

## Known limitations

Accepted as next-sprint work, not blocking this sprint's completion:

- **iOS exits on launch.** `ios/Codigdex/Info.plist` has no
  `UIApplicationSceneManifest`; UIKit on this SDK requires UIScene lifecycle
  adoption, and the app crashes immediately after install on the Xcode 27 /
  iOS 27 simulator. Real devices are untested.
- **No full on-device validation yet** of movement, battle, capture, and
  save persistence end to end on either platform, and no check yet that the
  web (Phaser) and mobile (Skia) experiences look/feel consistent.
- **`BattleScreen`'s answer feedback `setTimeout`** (in
  `src/game/NativeGame.tsx`) is not cleared if the screen unmounts mid-delay.
- **Save-write failures are swallowed**, not surfaced to the player (see
  [Save persistence](#save-persistence)).
