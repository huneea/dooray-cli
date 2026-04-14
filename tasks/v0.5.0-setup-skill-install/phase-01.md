# Phase 1: setup 스킬 설치 + package.json files 필드

## 컨텍스트

dooray-cli는 NHN Dooray REST API CLI 도구(TypeScript + Commander.js). `dooray setup` 명령으로 대화형 초기 설정을 진행한다.

이번 phase에서는 setup 마법사 마지막 단계에 "Claude Code 스킬 설치" 옵션을 추가한다.

먼저 아래 문서들을 읽어라:

- `CLAUDE.md` — 코딩 규칙
- `docs/adr.md` — ADR-018: setup에서 Claude Code 스킬 설치 (심볼릭 링크 메커니즘, npx 감지)
- `docs/flow.md` — setup 플로우 (스텝 6: 스킬 설치 여부)
- `docs/code-architecture.md` — 디렉터리 구조

기존 코드 참조 (패턴 파악용):

- `src/commands/setup.ts` — 현재 setup 명령 (inquirer 사용 패턴)
- `skills/dooray-cli/SKILL.md` — 설치 대상 스킬 파일

## 목표

`dooray setup` 마지막 단계에서 Claude Code 스킬을 심볼릭 링크로 설치하는 기능 추가.

## 작업 목록

### 1. setup.ts에 스킬 설치 단계 추가

- [ ] 메일 설정(step 5~6) 이후, config 저장(step 7) 이전에 스킬 설치 단계 추가
- [ ] `~/.claude/` 디렉터리 존재 여부로 Claude Code 사용자인지 감지
  - 존재하지 않으면 스킬 설치 단계를 건너뛰고 (질문하지 않음)
  - 존재하면 `confirm`으로 설치 여부 질문 (기본값: true)
- [ ] 설치 시 심볼릭 링크 생성:
  - 원본: `__dirname` 기반 `path.resolve(__dirname, '../skills/dooray-cli')` (tsup이 `dist/`에 번들)
  - 대상: `~/.claude/skills/dooray-cli`
  - 이미 존재하면 기존 삭제 후 재생성 (idempotent)
  - `~/.claude/skills/` 디렉터리 없으면 `mkdir -p` 생성
- [ ] npx 환경 감지: `__dirname`에 `_npx/`, `.npm/_npx`, `npx-` 패턴 포함 시 경고 출력 + 스킬 설치 건너뛰기
  - 경고 메시지: "npx 환경에서는 스킬 설치가 불가합니다. npm i -g @bifos/dooray-cli 후 다시 시도하세요."

### 2. package.json files 필드에 skills/ 추가

- [ ] `package.json`의 `files` 배열에 `"skills"` 추가 (npm publish 시 skills/ 디렉터리 포함)

## 성공 기준

- `pnpm build` 성공 (타입 에러 없음)
- `grep -q "skills" package.json` → 성공 (files 필드에 포함)
- `grep -q "claude" src/commands/setup.ts` → 성공 (스킬 설치 코드 존재)
- `grep -q "__dirname" src/commands/setup.ts` → 성공 (경로 계산 코드 존재)
- `grep -q "_npx" src/commands/setup.ts` → 성공 (npx 감지 코드 존재)

## 주의사항

- `CLAUDE.md` 규칙 준수: ky 사용, pnpm, DoorayCliError 패턴
- `import { fileURLToPath } from 'url'` + `import.meta.url` 패턴으로 `__dirname` 계산하지 말 것 — tsup CJS 번들에서는 `__dirname` 직접 사용 가능
- 스킬 설치는 config 저장과 독립적 — config 저장 실패해도 스킬은 이미 설치됨 (이것은 의도된 동작)
- 스킬 설치 실패는 전체 setup을 실패시키지 않음 — catch로 감싸서 경고만 출력

## Blocked 조건

- `skills/dooray-cli/SKILL.md` 파일이 존재하지 않으면: `PHASE_BLOCKED: skills/dooray-cli/SKILL.md 파일이 없습니다`
