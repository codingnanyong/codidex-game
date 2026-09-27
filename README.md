<!-- markdownlint-disable MD033 MD041 -->
<p align="center">
  <img src="packages/game-assets/files/icons/codigdex-main-icon.png" width="120" alt="Codigdex 게임 아이콘">
</p>

<h1 align="center">Codigdex</h1>

<p align="center">버그 몬스터를 물리치고, 나만의 코딩 도감을 완성하는 픽셀 아트 교육 게임</p>
<p align="center"><b>한국어</b> · <a href="README.en.md">English</a></p>
<!-- markdownlint-enable MD033 MD041 -->

[![CI](https://github.com/codingnanyong/codigdex/actions/workflows/ci.yml/badge.svg)](https://github.com/codingnanyong/codigdex/actions/workflows/ci.yml)
[![PR policy](https://github.com/codingnanyong/codigdex/actions/workflows/pr-policy.yml/badge.svg)](https://github.com/codingnanyong/codigdex/actions/workflows/pr-policy.yml)
[![Claude Code Review](https://github.com/codingnanyong/codigdex/actions/workflows/claude-review.yml/badge.svg)](https://github.com/codingnanyong/codigdex/actions/workflows/claude-review.yml)
[![Live demo](https://img.shields.io/badge/demo-codigdex.vercel.app-black?logo=vercel&logoColor=white)](https://codigdex.vercel.app)
[![License](https://img.shields.io/github/license/codingnanyong/codigdex)](LICENSE)

## Codigdex란?

서버 구름 위 픽셀 마을 **코드빌(Codeville)** 에는 코드 속 개념이 버그 몬스터가 되어 돌아다닙니다. 막 첫 모험을 떠난 주니어 개발자가 되어 몬스터와 맞서고, 그 개념을 정말 이해했는지 증명해 나만의 도감 **Codigdex**를 채워 보세요.

읽고 넘어가는 공부 대신, 한 마리씩 잡아서 모으는 코딩 공부입니다.

![필드 가이드를 든 주니어 개발자와 버그 몬스터 지역](packages/game-assets/files/wallpapers/codigdex-field-guide-wallpaper-v3.png)

## 이렇게 플레이해요

1. **의뢰 받기** — 안내 NPC가 지역에 나타난 버그 몬스터를 알려 줍니다.
2. **문제 배틀** — 몬스터가 내는 코딩 문제를 풀어 공격합니다. 문제를 맞힐수록 몬스터가 약해져요.
3. **도감 등록** — 60% 이상 맞히면 몬스터를 포획해 도감에 카드로 남깁니다. 실패해도 잃는 건 없고, 다시 도전하면 새로운 문제가 나옵니다.
4. **다음 지역으로** — 한 단계를 잡으면 더 강한 몬스터가, 챕터를 끝내면 새 지역이 열립니다.

## 모험의 흐름

```text
튜토리얼 · 반복문의 숲
  → CH.01 Git · 기록의 들판
  → CH.02 Linux · 셸 동굴
  → 1차 전직: 웹 프론트엔드 · 백엔드 · DevOps · 데이터 엔지니어 · 데이터 분석가
  → 2차 전직: 두 직업을 잇는 하이브리드 직업
  → 3차 전직: 마스터 직업
```

모든 개발자가 알아야 할 Git과 Linux를 먼저 익힌 뒤, 원하는 직업을 골라 그 직업만의 지도를 탐험합니다. 직업마다 길을 안내하는 선배 NPC가 있고, 풀스택 엔지니어나 ML Developer 같은 상위 직업은 `???`로 가려진 채 여러분이 두 직업의 길을 모두 걸어오기를 기다립니다.

![주니어부터 3차 전직까지의 플레이어 캐릭터와 가이드 NPC](packages/game-assets/files/characters/career-path/career-character-guide-v2.png)

## 모으는 재미

- **몬스터 도감** — 반복문 버그부터 깃새싹, 커널 수호자까지. 기술마다 Lv.1에서 Lv.5로 진화하는 몬스터가 있습니다. 아직 발견하지 못한 몬스터는 `???`로 남아 있어요.
- **직업 도감** — 주니어 개발자부터 3차 마스터 직업까지 16종의 직업 심볼을 모읍니다. 처음 전직한 날과 마스터한 날이 기록됩니다.

![주니어부터 3차 전직까지의 직업 심볼](packages/game-assets/files/career-emblems/career-emblem-archive-v1.png)

## 지금 플레이할 수 있는 것

- 튜토리얼, Git, Linux 챕터의 몬스터 11종 수집
- 5개 1차 직업 전직과 직업별 지도 탐험
- 몬스터 도감과 직업 도감
- 설정에서 한국어·영어 전환

직업별 전문 챕터(HTML/CSS, Docker, SQL 등)는 지도와 몬스터가 준비되어 있고, 배틀을 순서대로 여는 중입니다. 진행 상황은 브라우저에 자동 저장됩니다.

👉 **[codigdex.vercel.app](https://codigdex.vercel.app)에서 바로 플레이하기**

## 로컬에서 실행하기

Next.js, Phaser, TypeScript로 만들었습니다.

```bash
npm install
npm run dev --workspace @codigdex/web
```

브라우저에서 [http://localhost:3001](http://localhost:3001)을 엽니다. 테스트는 `npm run test`로 실행합니다.

## 문서

- [게임 기획서](docs/kor/GAME_DESIGN.md) — 게임 규칙, 화면, 비주얼 가이드
- [직업 전직 Path 설계](docs/kor/CAREER_PATH_DESIGN.md) — 커리큘럼, 전직 조건, 저장 구조
- [Git 작업 흐름](docs/kor/GIT_WORKFLOW.md) — 브랜치 전략, PR·이슈 자동화
- [모노레포 아키텍처](docs/kor/MONOREPO_ARCHITECTURE.md) — web/mobile 앱과 공유 패키지 경계
- [계정 연동과 클라우드 세이브](docs/kor/ACCOUNT_LINKING_AND_CLOUD_SAVE.md) — Google·GitHub·Apple 로그인, Web/Mobile 저장 귀속·병합
- [기여 가이드](CONTRIBUTING.md) · [프로젝트 및 PR 정책](AGENTS.md)

## 기여

개인이 만들고 검토하는 프로젝트라 외부 Pull Request는 받지 않지만, 버그나 틀린 설명을 발견하면 Issue로 알려 주세요. 자세한 내용은 [기여 가이드](CONTRIBUTING.md)를 참고하세요.

## 라이선스

[MIT](LICENSE) © codingnanyong
