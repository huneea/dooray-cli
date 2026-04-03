# Phase 4: Formatters + Project 커맨드

## 컨텍스트

`dooray-cli`는 Dooray REST API를 CLI로 래핑하는 TypeScript 프로젝트다.
프로젝트 루트: `/Users/nhn/personal/dooray-cli`
이전 phase에서 API 클라이언트와 Resolvers 구현 완료.

설계 문서:
- `docs/code-architecture.md` — Formatters, 출력 원칙, 커맨드 실행 흐름
- `docs/flow.md` — 일반 조회 흐름

## 목표

테이블 포맷터를 구현하고, `dooray project list/members/workflows` 커맨드로 실제 Dooray API 호출이 동작하는 상태까지 만든다.

## 작업 목록

### Formatters
- [ ] `src/formatters/table.ts` — cli-table3 기반 공통 테이블 유틸
  - `printTable(headers, rows)`: 기본 테이블 출력
  - `--json` 글로벌 옵션 시 JSON.stringify 출력
  - `--quiet` 글로벌 옵션 시 첫 번째 컬럼(ID)만 줄바꿈 출력
  - stdout으로 데이터 출력, stderr로 스피너/에러 출력 (파이프 안전)
- [ ] `src/formatters/post.ts` — Post 전용 포맷
  - `formatPostList(posts)`: number, subject, workflow.name, priority, assignee 표시
  - `formatPostDetail(post)`: 상세 조회 포맷 (본문 포함)
- [ ] `src/formatters/wiki.ts` — Wiki 전용 포맷 (빈 스켈레톤, Phase 7에서 구현)

### 글로벌 옵션
- [ ] `src/index.ts`에 글로벌 옵션 추가:
  - `--json` : JSON 출력 모드
  - `--quiet` : ID만 출력
  - `--no-color` : chalk 비활성화 (NO_COLOR env도 자동 감지)
- [ ] 커맨드 핸들러에서 글로벌 옵션 접근 가능하게 구조화

### Project 커맨드
- [ ] `src/commands/project/list.ts` — `dooray project list [--search <keyword>]`
  - ProjectResolver를 통해 캐시 갱신
  - --search 옵션 시 code/description 필터링
  - 테이블 출력: id, code, description, state
- [ ] `src/commands/project/members.ts` — `dooray project members <project>`
  - ProjectResolver로 projectId 해석
  - MemberResolver 캐시 갱신 (API 호출)
  - 테이블 출력: organizationMemberId, name, emailAddress, department
- [ ] `src/commands/project/workflows.ts` — `dooray project workflows <project>`
  - ProjectResolver로 projectId 해석
  - WorkflowResolver 캐시 갱신 (API 호출)
  - 테이블 출력: id, name, class, order
- [ ] `src/index.ts`에 project 커맨드 그룹 등록

### doctor 보강
- [ ] `src/commands/doctor.ts`에 실제 API 연결 테스트 추가
  - getProjects(page=0, size=1) 호출 → 성공/실패 판정

## 성공 기준

1. `npm run build` 성공
2. `node dist/index.js project list` 가 실제 Dooray 프로젝트 목록을 테이블로 출력
3. `node dist/index.js project list --json` 이 JSON 배열 출력
4. `node dist/index.js project members <코드>` 가 멤버 목록 출력
5. `node dist/index.js project workflows <코드>` 가 워크플로우 목록 출력
6. `node dist/index.js doctor` 가 API 연결 상태까지 검증
7. `~/.dooray/cache.json`에 프로젝트/멤버/워크플로우 캐시 저장 확인

## 주의사항

- 이 phase부터 실제 API 호출이 발생한다. `~/.dooray/config.json`에 api-key와 base-url이 설정되어 있어야 한다.
- config 미설정 시 `getConfigOrThrow()`가 exitCode 4로 종료하며 설정 안내를 출력해야 한다.
- 스피너는 stderr로 출력, 데이터는 stdout으로 출력 — `--json` 파이프 시 스피너가 JSON을 오염시키면 안 됨.
- chalk는 `NO_COLOR` 환경변수와 `--no-color` 플래그 모두 존중해야 한다.

## Blocked 조건

`~/.dooray/config.json`에 api-key 또는 base-url이 설정되어 있지 않으면:
`PHASE_BLOCKED: ~/.dooray/config.json에 api-key와 base-url 설정 필요 — dooray config set api-key <key> && dooray config set base-url <url> 실행 필요`
