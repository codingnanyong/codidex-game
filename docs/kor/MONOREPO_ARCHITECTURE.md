# 모노레포 아키텍처

**한국어** · [English](../eng/MONOREPO_ARCHITECTURE.md)

Codigdex는 하나의 저장소 안에서 패키지마다 소유 범위를 나눠 관리합니다. 네트워크로
연결된 마이크로서비스가 아니라 모듈형 모놀리식 구조입니다. web과 mobile은 동일하게
결정적인 게임 규칙과 콘텐츠를 사용해야 하지만, 렌더링과 디바이스 연동 방식은 서로
다르기 때문입니다.

```text
codigdex/
├─ web/                       Next.js + Phaser 웹 애플리케이션
├─ mobile/                    Expo(SDK 57) + React Native 애플리케이션
└─ packages/
   ├─ game-assets/            아트 원본 파일 + 생성된 에셋 키 매니페스트
   ├─ game-core/              규칙, 도메인 타입, 세이브 스키마/마이그레이션
   ├─ game-content/           몬스터, 퀴즈, 챕터, 직업
   └─ game-i18n/              번역된 UI 메시지 카탈로그
```

## 의존성 방향

```text
web ────────┐
mobile ─────┼──> game-content ──> game-core
            ├──> game-i18n ─────> game-core
            ├───────────────────> game-core
            └───────────────────> game-assets
```

- `game-core`는 플랫폼 중립을 유지해야 하며, 다른 워크스페이스를 import할 수 없습니다.
- `game-content`는 `game-core`만 import할 수 있습니다.
- `game-i18n`은 `game-core`의 로케일 계약만 import할 수 있습니다.
- `game-assets`는 다른 워크스페이스를 import할 수 없습니다.

## 에셋

아트는 `packages/game-assets/files/`에 두고 **에셋 키**(해당 폴더 기준 상대 경로,
예: `monsters/ch01.git/sprout-lv1.png`)로 참조합니다. 공유 패키지는 에셋 키만
저장하고 `/assets/...` URL이나 번들러 import는 절대 저장하지 않으므로, 각 클라이언트가
에셋을 어떻게 제공할지 스스로 결정할 수 있습니다. `check:boundaries`는 공유 패키지에
들어온 URL 형태의 에셋 경로를 거부합니다.

- **web**은 `dev`와 `build` 전에 `web/scripts/sync-assets.mjs`를 실행해 파일을
  git에서 무시되는 `web/public/assets/`로 복사하고, `web/lib/assets.ts`의
  `assetUrl()`로 키를 해석합니다.
- **mobile**은 Metro가 동적 `require()` 호출을 해석하지 못하므로
  `mobile/scripts/generate-asset-map.mjs`를 실행합니다. 이 스크립트는
  `packages/game-assets/src/manifest.generated.ts`에서 키 목록을 읽어 키마다
  정적 `require()`를 만들고, 저장소에 커밋되는
  `mobile/src/assets.generated.ts`로 출력합니다. `mobile/src/assets.ts`의
  `mobileAssetSource()`가 그 맵으로 키를 해석합니다. 번들러를 띄우는 모바일
  스크립트(`start`, `android`, `ios`, `export:android`,
  `export:ios`)는 모두
  실행 전에 이 맵을 다시 생성하고, 모바일 `typecheck`는 생성기를 `--check`로
  돌려 커밋된 맵이 낡았으면 실패합니다.
- 아트를 추가·이름 변경·삭제한 뒤에는
  `npm run generate --workspace @codigdex/game-assets`를 실행합니다. 매니페스트가
  낡은 상태면 `typecheck`가 실패합니다.
- 렌더링, 내비게이션, 입력, 오디오, 분석, 영속성 어댑터는 앱이 담당합니다. 공유
  패키지는 Phaser, React, Next.js, Expo, `window`, `document`, 특정 디바이스 저장소
  API를 import해서는 안 됩니다.
- 새 패키지는 코드가 안정적인 공개 계약을 갖추고 소비자가 둘 이상일 때만 만듭니다.
  기능 전용 UI는 해당 앱 안에 둡니다.

## 모바일 구현

`mobile/`은 워크스페이스 패키지를 직접 사용하는 Expo SDK 57 애플리케이션입니다
(React Native 0.86, React 19). 진입점은 `App.tsx`이며, 타이틀/월드/배틀/결과/
도감/설정으로 이어지는 네이티브 게임 `NativeGame`을 렌더링합니다 — 순수 React
Native 뷰와 월드 화면용 [React Native
Skia](https://shopify.github.io/react-native-skia/) 캔버스로 만들어졌습니다.
자세한 내용은 `mobile/README.md`를 참고하세요.

- **내비게이션**은 `mobile/src/game/NativeGame.tsx`의 메모리 내 라우트 상태
  머신입니다(`"title" | "world" | "battle" | "result" | "dex" | "settings"`).
  파일 기반 라우팅이 아닙니다 — 이번 스프린트에서 Expo Router와 기존의 읽기
  전용 도감 전용 슬라이스를 실제로 플레이 가능한 루프로 교체했습니다.
- **Phaser는 재사용하지 않습니다.** 모바일 화면은 순수 React Native
  컴포넌트이며, 이 워크스페이스에는 WebView도 Phaser 의존성도 없습니다.
  웹의 씬 클래스는 `web/`에 그대로 둡니다. 두 클라이언트가 동일하게 동작해야 하는
  로직은 씬을 이식하지 말고 `game-core`나 `game-content`에 둡니다.
- **사용 중인 공유 패키지:** 세이브 스키마·마이그레이션·로케일 계약·퀴즈 뽑기는
  `game-core`, `CHAPTERS`와 `DEX_MONSTERS`는 `game-content`, 배틀 화면의
  `loadQuizPack()`은 `quiz-content` — 전투와 포획 퀴즈 흐름이 이제 웹뿐 아니라
  모바일에서도 동작합니다 — 아트는 생성된 `require()` 맵을 통해 `game-assets`를
  사용합니다.
- **영속성**은 `@react-native-async-storage/async-storage`를 `mobile/src/storage/`
  에서 공유 `SaveStorage` 계약에 연결한 구조입니다. `load()`는
  `codigdex:save:v3` → `:v2` → `:v1` 순서로 읽고, `game-core`의 `parseSave()`가
  v1·v2 데이터를 `StoredGameStateV3`로 마이그레이션하며, 마이그레이션된 결과는
  다시 v3 키에 기록됩니다. 데이터가 손상되었거나 읽기에 실패하면
  `createEmptySave()`로 되돌아갑니다. 쓰기는 항상 v3 키에만 이뤄지고, 현재 모든
  쓰기는 `.catch(() => undefined)`로 실패를 그대로 삼킵니다 — 플레이어에게
  드러나지 않는 이 문제는 다음 스프린트 작업으로 남겨두었습니다.
- **네이티브 프로젝트가 저장소에 커밋됩니다.** 이번 스프린트에서 `android/`와
  `ios/`를 필요할 때 생성하는 방식에서 커밋된 소스 트리로 바꿨습니다 — 빌드
  산출물과 Pods만 git에서 무시됩니다. `app.json`의 `"orientation": "landscape"`는
  `expo prebuild`로 두 플랫폼 모두에 반영됩니다. iOS는 현재 실행 즉시 종료됩니다 —
  `Info.plist`에 `UIApplicationSceneManifest`가 없어 이 SDK의 UIKit이 요구하는
  UIScene 라이프사이클 채택이 되어 있지 않기 때문이며, 이 역시 다음 스프린트로
  넘겼습니다. Android는 Pixel 8 에뮬레이터에서 빌드·설치 후 타이틀 화면까지
  도달하는 것을 확인했습니다.
- **서체**는 시스템 모노스페이스 폰트입니다(`mobile/src/ui/theme.ts`). 기존
  Galmuri14 비트맵 폰트와 `expo-font` 로딩 게이트는 이번 스프린트에서
  제거했습니다.

## 명령어

저장소 루트에서 실행합니다.

```bash
npm ci
npm run check:boundaries
npm run typecheck
npm run lint
npm test
npm run build:web
```

`typecheck`와 `test`는 모바일을 포함한 모든 워크스페이스로 퍼집니다. 모바일만
확인하려면 다음을 실행합니다.

```bash
npm run typecheck --workspace @codigdex/mobile   # 에셋 맵 --check 후 tsc --noEmit
npm test --workspace @codigdex/mobile            # vitest run
npm run generate:assets --workspace @codigdex/mobile
npm run export:android --workspace @codigdex/mobile
npm run export:ios --workspace @codigdex/mobile
```

이 프로젝트는 Expo Go가 아니라 네이티브 개발/빌드 워크플로(`expo run`,
`expo start --dev-client`)로 구성되어 있으며, Expo Go로 실행하는 경로는
검증되지 않았습니다. 먼저 네이티브 개발 빌드를 빌드·설치한 뒤 Metro를
띄웁니다.

```bash
npm run android --workspace @codigdex/mobile   # 빌드·설치 후 Android에서 실행
npm run ios --workspace @codigdex/mobile       # 빌드·설치 후 iOS에서 실행

npm run start --workspace @codigdex/mobile     # expo start --dev-client
```

`start`, `android`, `ios`는 모두 Expo를 띄우기 전에 에셋 맵을
다시 생성하므로, 아트가 바뀌어도 `generate:assets`를 따로 실행할 필요가
없습니다.

`export:android`와 `export:ios`는 모바일의 번들러 단계 점검입니다. 둘 다 에셋 맵을
다시 생성한 뒤 한 플랫폼에 대해 `expo export`를 실행하며, 결과물은
`.tmp-expo-export/` 아래 각자의 디렉터리에 들어갑니다.

| 스크립트 | 실행되는 명령 | 산출물 |
| --- | --- | --- |
| `export:android` | `expo export --platform android --output-dir .tmp-expo-export/android` | `_expo/static/js/android/entry-*.hbc` |
| `export:ios` | `expo export --platform ios --output-dir .tmp-expo-export/ios` | `_expo/static/js/ios/entry-*.hbc` |

각 명령은 해당 플랫폼의 Metro 번들과 Hermes 바이트코드를 만들며, `typecheck`와
Vitest가 검사하지 못하는 문제 — 해석되지 않는 `require()`, Metro가 따라가지 못하는
공유 패키지 import, 한쪽 플랫폼만 타는 조건부 import — 를 잡아냅니다.
`expo export`는 JavaScript만 컴파일하고 네이티브 빌드는 하지 않으므로, 둘 다
Android SDK 없이 실행되고 `export:ios`도 macOS 호스트나 Xcode, CocoaPods 설치가
필요 없습니다. 그만큼 통과가 보장하는 범위도 제한됩니다. 해당 플랫폼에서 JS 그래프가
해석되고 Hermes가 이를 받아들인다는 사실만 말해 줄 뿐, 네이티브 모듈 링크,
매니페스트·엔타이틀먼트·권한 설정, 앱 시작, 실제 화면에서의 레이아웃에 대해서는
아무것도 검증하지 않습니다. 따라서 네이티브 개발 빌드(`expo run:android`,
`expo run:ios`, EAS Build)나 에뮬레이터·시뮬레이터·실기기 확인을 **대체하지
않습니다**.

두 출력 디렉터리가 서로 분리되어 있어 실행 순서에 상관없이 서로의 번들을 덮어쓰지
않습니다. Expo CLI가 실행할 때마다 자신의 출력 디렉터리를 먼저 교체하므로 수동으로
미리 비울 필요는 없습니다. 실행이 끝나면 생성된 번들이 그대로 남지만,
`.tmp-expo-export/` 전체가 git에서 무시됩니다. `.github/workflows/ci.yml`은
`typecheck`·`lint`·`test` 뒤, 웹 빌드 앞에서 **두 명령 모두**를 같은 잡에서 연달아
`CI=true`와 함께 실행하므로, iOS 실행은 Android 실행이 데워 둔 Metro 변환 캐시를
재사용합니다.

Vercel에서는 Root Directory를 `web`으로 설정합니다. 웹 애플리케이션이 그 디렉터리
바깥의 워크스페이스 패키지를 import하므로 **Include source files outside of the Root
Directory in the Build Step** 옵션을 켠 상태로 유지하세요. 웹 패키지의 `prebuild`
스크립트가 `@codigdex/game-assets`를 먼저 동기화하기 때문에 기본
`npm run build` 명령으로 충분합니다.
