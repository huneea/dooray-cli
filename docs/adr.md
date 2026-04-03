# ADR — dooray-cli 기술 결정 기록

## ADR-001: TypeScript (Node.js) 선택

**결정**: Kotlin(기존 MCP 서버) 대신 TypeScript로 새로 작성

**이유**:

- 팀의 주력 스택이 TypeScript → 개발 속도 우선
- npm 생태계로 `npx @bifos/dooray-cli` 즉시 배포 가능
- CLI 툴 생태계(Commander, chalk, ora 등)가 Node.js에서 가장 성숙

**트레이드오프**: Kotlin API 클라이언트 재사용 포기 → types.ts로 포팅 필요 (1일 내 완료 가능)

---

## ADR-002: ky (HTTP 클라이언트)

**결정**: axios 대신 ky 사용

**이유**:

- Node 18+ native fetch 기반 → 추가 의존성 없음
- 번들 크기 3KB vs axios 13KB
- TypeScript 타입 기본 제공
- CLI 툴에서 axios의 XMLHttpRequest 레거시 불필요

**제약**: Node 18+ 필수 (`engines: { node: ">=18" }` 명시)

---

## ADR-003: tsup (빌드 툴)

**결정**: tsc 대신 tsup 사용

**이유**:

- esbuild 기반으로 tsc 대비 10배 빠른 빌드
- 단일 번들 파일 출력 → npm 배포 단순화
- tsconfig.json 자동 인식, 설정 최소화

---

## ADR-004: 디스크 캐시 (project·member·workflow)

**결정**: `~/.dooray/cache.json`에 TTL 기반 캐시 저장

**이유**:

- CLI는 매 실행이 새 프로세스 → in-memory 캐시 불가
- project code·member 이름 → ID 변환 시 매번 API 호출 시 지연 발생
- TTL: projects·members 1h / workflows 24h (변경 빈도 기반)

**트레이드오프**: 캐시 stale 가능성 → `dooray cache refresh`로 수동 갱신 제공

---

## ADR-005: postNumber를 Post 식별자로 사용

**결정**: 내부 UUID(postId) 대신 `postNumber`(정수)를 CLI 인터페이스로 노출

**이유**:

- Dooray UI에서 표시되는 번호와 동일 → 사용자가 UI 보고 바로 CLI 사용 가능
- 숫자라 기억·입력 용이 (GitHub Issue number와 동일 패턴)
- API의 `postNumber` 필터 파라미터로 postId 변환 가능

---

## ADR-006: $EDITOR 기반 수정 플로우

**결정**: `dooray post edit` / `wiki page edit` 은 $EDITOR를 통한 수정

**이유**:

- `--body "..."` flag로 긴 마크다운 입력은 현실적으로 불가능
- `--body-file` + 별도 수정은 "기존 내용 조회 → 파일 저장 → 수정 → CLI 재실행" 4단계 필요
- $EDITOR 방식(`kubectl edit`, `git commit` 동일 패턴)은 1커맨드로 완결
- YAML frontmatter로 메타데이터(subject, priority, due_date, to, cc) + 본문 통합 편집

---

## ADR-007: config 파일 전용 (env var 폴백 없음)

**결정**: API key를 환경변수로 받지 않음. `~/.dooray/config.json`만 사용

**이유**:

- API key는 민감 정보 → env var 노출은 보안 위험 (shell history, ps 출력 등)
- 설정 미완료 시 명확한 에러 + 가이드 출력이 더 나은 UX
- CI 환경 지원은 v1 범위 외

---

## ADR-008: 멤버 모호성 — 에러 + 후보 출력

**결정**: 이름 검색 시 복수 매칭이면 인터랙티브 선택 대신 에러 출력

**이유**:

- AI 에이전트가 primary 사용자 → 인터랙티브 프롬프트는 자동화 파이프라인 차단
- 에러 메시지에 후보 목록 포함 → 에이전트가 다음 시도에 정확한 값 사용 가능

---

## ADR-009: WikiResolver는 ProjectCache 활용

**결정**: 별도 wiki API 호출 없이 `project.wiki.id`를 project 캐시에 저장해 사용

**이유**:

- Dooray Project 응답에 `wiki: { id }` 포함 → 추가 API 호출 0회
- project cache fetch 시 자동으로 wikiId도 확보
- Wiki가 없는 프로젝트는 명확한 에러 출력

---

## ADR-010: 캐시 파일 분리 (디렉토리 기반)

**결정**: 단일 `cache.json` 대신 `~/.dooray/cache/` 디렉토리에 타입별·프로젝트별 파일 분리

**이유**:

- 단일 파일 read-modify-write는 동시 CLI 실행 시 race condition 발생 가능
- 파일 분리로 members 쓰기가 projects를 덮어쓰지 않음
- 프로젝트별 멤버/워크플로우를 독립 파일로 관리 → 특정 프로젝트 캐시만 삭제 가능
- 파일별 `updatedAt`으로 TTL 독립 관리

**구조**: `me.json`, `projects.json`, `members/{projectId}.json`, `workflows/{projectId}.json`

---

## ADR-011: 내 정보(Me) 캐시

**결정**: `/common/v1/members/me` 응답을 `cache/me.json`에 캐시 (id, name)

**이유**:

- `doctor` 실행 시 자동 캐싱 → 이후 커맨드에서 현재 사용자 정보 즉시 참조 가능
- TTL 24h (사용자 정보는 거의 불변)
- post 생성 시 `from` 자동 설정 등 향후 확장 기반
