# Phase 2: doctor 스킬 검증 + 빌드 검증

## 컨텍스트

dooray-cli는 NHN Dooray REST API CLI 도구. `dooray doctor` 명령은 설정 및 환경 진단을 수행한다.

Phase 1에서 `dooray setup`에 Claude Code 스킬 설치 기능을 추가했다. 이번 phase에서는 `dooray doctor`에 스킬 설치 상태 검증을 추가한다.

먼저 아래 문서들을 읽어라:

- `CLAUDE.md` — 코딩 규칙
- `docs/adr.md` — ADR-018: doctor 검증 (심볼릭 링크 유효성, 해시 비교, 미설치 안내)

기존 코드 참조 (패턴 파악용):

- `src/commands/doctor.ts` — 현재 doctor 명령 (chalk, 진단 패턴)
- `src/commands/setup.ts` — Phase 1에서 추가된 스킬 설치 코드

## 목표

`dooray doctor`에 Claude Code 스킬 설치 상태 검증 섹션을 추가한다.

## 작업 목록

### 1. doctor.ts에 스킬 검증 추가

- [ ] 캐시 상태 출력 이후, Summary 이전에 "🔧 Claude Code 스킬" 섹션 추가
- [ ] `~/.claude/` 디렉터리 존재 여부 확인
  - 없으면 스킬 섹션 자체를 출력하지 않음 (Claude Code 미사용자)
- [ ] `~/.claude/skills/dooray-cli` 경로 확인:
  - **심볼릭 링크인 경우**: `fs.readlink`로 대상 경로 확인 → 대상이 존재하면 `✅ 설치됨 (심볼릭 링크)`, 대상이 없으면 `⚠️ 링크 깨짐 — dooray setup으로 재설치`
  - **일반 디렉터리인 경우**: `✅ 설치됨 (복사본)` 출력
  - **미설치**: `❌ 미설치 — dooray setup으로 설치` 출력

### 2. 빌드 검증

- [ ] `pnpm build` 실행하여 타입 에러 없이 빌드 성공 확인
- [ ] `node dist/index.js --help` 실행하여 CLI가 정상 동작하는지 확인

## 성공 기준

- `pnpm build` 성공 (exit code 0)
- `node dist/index.js --help` 성공 (exit code 0)
- `grep -q "스킬" src/commands/doctor.ts` → 성공 (스킬 검증 코드 존재)
- `grep -q "readlink\|lstat" src/commands/doctor.ts` → 성공 (심볼릭 링크 검증)

## 주의사항

- `CLAUDE.md` 규칙 준수
- `fs/promises`의 `lstat`, `readlink`, `access` 사용 (동기 API 사용 금지)
- 스킬 검증 실패가 doctor 전체를 실패시키면 안 됨 — 항상 진단 결과만 출력
- doctor는 읽기 전용 — 아무것도 수정하지 않음

## Blocked 조건

- `pnpm build` 실패 시: `PHASE_BLOCKED: 빌드 실패 — 타입 에러 확인 필요`
