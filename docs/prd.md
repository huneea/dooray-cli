# PRD — dooray-cli

## 한 줄 정의

Dooray REST API를 CLI로 래핑해 AI 에이전트와 터미널 사용자가 자연어로 Dooray를 조작할 수 있게 한다.

## 문제

MCP 도구는 AI가 API 결과를 수동으로 가공해야 하고, 반복 작업·파이프라인·스크립팅에 부적합하다.
CLI는 터미널이 있는 환경이면 어디서든 동작하고, 자연스러운 반복 작업·파이프라인·자동화가 가능하다.

## 타겟

- AI 에이전트 (Claude Code 등) — Dooray 작업 자동화
- 터미널 사용자 — Dooray UI 없이 빠른 조작
- Dooray를 사용하는 한국 회사 개발자

## 핵심 가치

1. **자연어 식별자** — 숫자 ID 대신 프로젝트 코드·멤버 이름·업무 번호로 조작
2. **단일 바이너리 배포** — `npm i -g @bifos/dooray-cli` 또는 `npx @bifos/dooray-cli`
3. **파이프라인 친화** — `--json` flag로 raw output, `--quiet`로 ID만 출력

## MVP 범위 (v1)

### 포함

- `dooray config` — API key·base URL·IMAP/SMTP 설정
- `dooray doctor` — 설정·연결 검증
- `dooray cache` — 캐시 관리
- `dooray project` — 목록·멤버·워크플로우 조회
- `dooray post` — 목록·검색·조회·생성·수정($EDITOR)·완료·상태변경
- `dooray post comment` — 목록·추가·수정($EDITOR)·삭제
- `dooray post file` — 목록·다운로드·전체다운로드·업로드·삭제 (v0.3.0)
- `dooray wiki` — 목록·페이지 조회·생성·수정($EDITOR)
- `dooray mail` — 목록·조회·검색·발송·답장 (v0.2.0)

### 제외 (v1)

- 마일스톤·태그 관리
- 알림 설정
- 멀티 계정·프로파일

## 성공 지표

- `dooray post list my-project` 3초 이내 응답 (캐시 히트 기준)
- 숫자 ID 없이 주요 CRUD 전부 완료 가능
