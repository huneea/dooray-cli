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

---

## ADR-012: IMAP 메일 연동

**결정**: Dooray IMAP 서버(imap.dooray.com)를 통해 메일 조회 기능 추가

**이유**:

- Dooray는 공식 메일 API를 제공하지 않으나 IMAP/SMTP를 지원
- 주간 업무 알림, 일정 알림 등 메일을 CLI에서 확인하여 생산성 향상
- `imapflow` (IMAP) + `mailparser` (파싱) 조합으로 구현

**서버 특성**:

- `SINCE` 날짜 검색 미지원 (서버 파서 버그)
- `SORT` 미지원 → UID 역순(최신순)으로 대체
- `SUBJECT`, `FROM`, `TO`, `UNSEEN`, `SEEN` 검색은 지원

**기본값 전략**: imap-host, imap-port, smtp-host, smtp-port는 기본값 제공 (Dooray 사용자 대다수 동일). 사용자는 imap-username, imap-password만 설정하면 됨.

**트레이드오프**: imapflow + mailparser 의존성 추가 → tsup에서 external 처리 필요 (번들 미포함, node_modules에서 로드)

---

## ADR-013: SMTP 메일 발송

**결정**: nodemailer를 사용하여 Dooray SMTP(smtp.dooray.com:465)로 메일 발송

**이유**:

- 메일 조회(IMAP)만으로는 반쪽짜리 기능 → 발송까지 지원해야 CLI에서 메일 워크플로우 완결
- nodemailer는 Node.js 메일 발송 de facto 표준 (성숙, 안정)
- SMTP 인증은 IMAP과 동일한 자격증명 사용 → 추가 설정 불필요

**지원 기능**: send (to/cc/bcc/subject/body/html), reply (In-Reply-To로 스레드 유지)

**추후 고민**: 첨부파일(`--attach`) 지원

---

## ADR-014: TypeScript Path Alias 보류

**결정**: `@/` 등 path alias 도입 보류

**이유**:

- 현재 `src/` 최대 깊이 3단계 (`commands/post/comment/`) → `../../`까지가 최대로 관리 가능한 수준
- tsup(esbuild)이 `tsconfig.json` paths를 자동 resolve하지 않아 별도 플러그인 필요 → 빌드 파이프라인 복잡도 증가
- 프로젝트 규모 대비 실익이 크지 않음

**재검토 시점**: 디렉토리 깊이가 4단계 이상으로 증가하거나 대규모 리팩토링 시

## ADR-015: 파일 첨부 API 307 리다이렉트 수동 처리

**결정**: Dooray 파일 업로드/다운로드 시 307 리다이렉트를 수동 처리

**이유**:

- Dooray 파일 API는 307 Temporary Redirect로 실제 파일 서버 URL을 반환
- 브라우저/HTTP 클라이언트의 자동 리다이렉트는 Authorization 헤더와 요청 body를 strip → 인증 실패
- `redirect: "manual"`로 첫 응답의 Location 헤더를 캡처한 후, 해당 URL로 Auth 헤더를 포함한 2차 요청 필요

**구현**:

- 다운로드: `?media=raw` 쿼리 파라미터로 307 유도 → Location 헤더 캡처 → fetch로 2차 요청
- 업로드: `fetch` 직접 사용 (`ky`는 307 + `redirect: "manual"` 조합에서 정상 동작하지 않음)
- 2차 요청 시 동일한 Authorization 헤더 첨부
- 업로드: FormData + Blob, 다운로드: ArrayBuffer로 수신 후 파일 저장

## ADR-016: api/types.ts 단일 파일 유지

**결정**: `api/types.ts`를 도메인별로 분리하지 않고 단일 파일로 유지

**이유**:

- 현재 ~440줄으로 분리 임계점(~800줄+)에 미달
- 섹션 주석으로 Common / Project / Post / Comment / Member / Workflow / Wiki / File 구분이 충분
- `DoorayApiHeader`, `DoorayApiResponse<T>` 등 Common 타입을 거의 모든 도메인이 참조 → barrel export 관리 오버헤드 대비 실익 부족
- `client.ts`에서 한 파일로 모든 타입을 import하는 현재 구조가 간결

**재검토 시점**: 800줄 이상이거나 새 도메인(Drive 등)이 2개 이상 추가될 때
