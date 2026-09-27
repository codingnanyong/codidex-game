# Monorepo architecture

[한국어](../kor/MONOREPO_ARCHITECTURE.md) · **English**

Codigdex uses independently owned packages inside one repository. This is a
modular monolith, not a set of networked microservices: web and mobile need the
same deterministic game rules and content, while their rendering and device
integration differ.

```text
codigdex/
├─ web/                       Next.js + Phaser web application
├─ mobile/                    Expo (SDK 57) + React Native application
└─ packages/
   ├─ game-assets/            art files + generated asset-key manifest
   ├─ game-core/              rules, domain types, save schema/migrations
   ├─ game-content/           monsters, quizzes, chapters, careers
   └─ game-i18n/              translated UI message catalogs
```

## Dependency direction

```text
web ────────┐
mobile ─────┼──> game-content ──> game-core
            ├──> game-i18n ─────> game-core
            ├───────────────────> game-core
            └───────────────────> game-assets
```

- `game-core` must stay platform-neutral and must not import another workspace.
- `game-content` may import only `game-core`.
- `game-i18n` may import only locale contracts from `game-core`.
- `game-assets` must not import another workspace.

## Assets

Art lives in `packages/game-assets/files/` and is referenced by an **asset
key**, the path relative to that folder (for example
`monsters/ch01.git/sprout-lv1.png`). Shared packages store asset keys only —
never `/assets/...` URLs or bundler imports — so each client can decide how to
serve them. `check:boundaries` rejects URL-style asset paths in shared
packages.

- **web** runs `web/scripts/sync-assets.mjs` before `dev` and `build`, which
  mirrors the files into the git-ignored `web/public/assets/`, and resolves
  keys with `assetUrl()` from `web/lib/assets.ts`.
- **mobile** runs `mobile/scripts/generate-asset-map.mjs`, which reads the key
  list from `packages/game-assets/src/manifest.generated.ts` and emits one
  static `require()` per key into the committed `mobile/src/assets.generated.ts`
  — Metro cannot resolve dynamic `require()` calls. `mobile/src/assets.ts`
  resolves a key through that map with `mobileAssetSource()`. Every mobile
  script that feeds the bundler — `start`, `android`, `ios`,
  `export:android`, `export:ios` — regenerates the map first, and the mobile
  `typecheck` runs the generator with `--check`, which fails while the committed
  map is stale.
- After adding, renaming, or removing art, run
  `npm run generate --workspace @codigdex/game-assets`; `typecheck` fails while
  the manifest is stale.
- Apps own rendering, navigation, input, audio, analytics, and persistence
  adapters. Shared packages must not import Phaser, React, Next.js, Expo,
  `window`, `document`, or a concrete device storage API.
- Prefer a new package only when code has a stable public contract and at least
  two consumers. Keep feature-specific UI inside its app.

## Mobile implementation

`mobile/` is an Expo SDK 57 application (React Native 0.86, React 19) that
consumes the workspace packages directly. Entry point is `App.tsx`, which
renders `NativeGame` — a native title/world/battle/result/dex/settings game
built from plain React Native views plus a
[React Native Skia](https://shopify.github.io/react-native-skia/) canvas for
the world scene. See `mobile/README.md` for the full walkthrough.

- **Navigation** is an in-memory route state machine in
  `mobile/src/game/NativeGame.tsx` (`"title" | "world" | "battle" | "result" |
  "dex" | "settings"`), not file-based routing — Expo Router and the earlier
  read-only dex-only slice were replaced by this sprint's playable loop.
- **Phaser is not reused.** Mobile screens are plain React Native components;
  there is no WebView or Phaser dependency in the workspace. Web scene
  classes stay in `web/`. Behavior that must match both clients belongs in
  `game-core` or `game-content`, not in a ported scene.
- **Shared packages in use:** `game-core` for the save schema, migrations,
  locale contracts, and quiz drawing; `game-content` for `CHAPTERS` and
  `DEX_MONSTERS`; `quiz-content` for `loadQuizPack()` in the battle screen —
  the battle and capture-quiz loop now runs on mobile as well as web;
  `game-assets` for art through the generated `require()` map.
- **Persistence** is `@react-native-async-storage/async-storage` bound to the
  shared `SaveStorage` contract in `mobile/src/storage/`. `load()` reads
  `codigdex:save:v3`, then `:v2`, then `:v1`; `parseSave()` from `game-core`
  migrates v1 and v2 payloads to `StoredGameStateV3`, and a migrated result is
  written back to the v3 key. Corrupt data or a read failure falls back to
  `createEmptySave()`. Writes only ever target the v3 key, and every write is
  currently `.catch(() => undefined)` — a failure is swallowed rather than
  surfaced (accepted next-sprint work).
- **Native projects are committed.** This sprint moved `android/` and `ios/`
  from generated-on-demand to checked-in source trees; only build output and
  Pods are git-ignored. `app.json`'s `"orientation": "landscape"` is baked
  into both via `expo prebuild`. iOS currently exits immediately on launch —
  `Info.plist` has no `UIApplicationSceneManifest`, and UIKit on this SDK
  requires UIScene lifecycle adoption — which is also accepted next-sprint
  work; Android has been confirmed to build, install, and reach the title
  screen on a physical device.
- **Typography** is the system monospace font (`mobile/src/ui/theme.ts`); the
  earlier Galmuri14 bitmap font and its `expo-font` loading gate were dropped
  this sprint.

## Commands

Run commands from the repository root:

```bash
npm ci
npm run check:boundaries
npm run typecheck
npm run lint
npm test
npm run build:web
```

`typecheck` and `test` fan out across every workspace, mobile included. To work
on mobile alone:

```bash
npm run typecheck --workspace @codigdex/mobile   # asset-map --check, then tsc --noEmit
npm test --workspace @codigdex/mobile            # vitest run
npm run generate:assets --workspace @codigdex/mobile
npm run export:android --workspace @codigdex/mobile
npm run export:ios --workspace @codigdex/mobile
```

The app depends on native modules Expo Go does not ship
(`@shopify/react-native-skia`, `react-native-reanimated`,
`react-native-worklets`), so there is no Expo Go / QR-code path. Build and
install a native dev build first, then start Metro against it:

```bash
npm run android --workspace @codigdex/mobile   # build, install, and launch on Android
npm run ios --workspace @codigdex/mobile       # build, install, and launch on iOS

npm run start --workspace @codigdex/mobile     # expo start --dev-client
```

`start`, `android`, and `ios` all regenerate the asset map before Expo starts,
so a separate `generate:assets` run is no longer needed after changing art.

`export:android` and `export:ios` are the bundler-level checks for mobile. Each
regenerates the asset map and then runs `expo export` for one platform, into its
own sibling directory under `.tmp-expo-export/`:

| Script | Command it runs | Output |
| --- | --- | --- |
| `export:android` | `expo export --platform android --output-dir .tmp-expo-export/android` | `_expo/static/js/android/entry-*.hbc` |
| `export:ios` | `expo export --platform ios --output-dir .tmp-expo-export/ios` | `_expo/static/js/ios/entry-*.hbc` |

Each produces a full Metro bundle plus Hermes bytecode for its platform and
catches what `typecheck` and Vitest never exercise — an unresolved `require()`,
a shared-package import Metro cannot follow, a platform-conditional import only
one platform takes. `expo export` compiles JavaScript only: no native build
happens, so both run with no Android SDK installed and `export:ios` needs no
macOS host, Xcode, or CocoaPods. That bounds what a green run proves — the JS
graph resolves and Hermes accepts it for that platform, and nothing more. It
says nothing about native module linking, manifest/entitlement or permission
configuration, app startup, or on-device layout, and it does **not** replace a
native development build (`expo run:android`, `expo run:ios`, or EAS Build) or a
run on an emulator, simulator, or real device.

Because the two output directories are siblings, the scripts are independent and
can run in either order without clobbering each other. Expo CLI replaces its own
output directory at the start of every run, so no manual pre-clean is needed;
the generated bundles remain there afterward and `.tmp-expo-export/` is
git-ignored in full. `.github/workflows/ci.yml` runs **both** exports
sequentially in the same job — after `typecheck`, `lint`, and `test`, before the
web build, with `CI=true` set — so the iOS run reuses the Metro transform cache
the Android run warmed.

Vercel should use `web` as its Root Directory. Because the web application
imports workspace packages outside that directory, keep **Include source files
outside of the Root Directory in the Build Step** enabled. The default
`npm run build` command is sufficient because the web package's `prebuild`
script synchronizes `@codigdex/game-assets` first.
