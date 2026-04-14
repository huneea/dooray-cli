---
name: plan-and-build
description: AI 에이전트 하네스를 사용한 대규모 구현 자동화. 논의 → 계획 → task 생성 → 순차 실행. 새 기능 추가, 리팩토링 등 multi-phase 작업에 사용.
---

# plan-and-build

대규모 구현 작업을 phase 단위로 분리하고, `run-phases.py` 하네스를 통해 Claude Code가 자동으로 순차 실행하는 시스템.

## 핵심 원칙 — 사용자에게 묻지 말고 자동으로 따를 것

**모든 작업은 반드시 이 순서를 자동으로 따른다. 사용자가 매번 지시하지 않아도 된다:**

1. 논의가 필요하면 먼저 논의
2. **docs 반영 + 커밋** (task 생성 전 필수, 건너뛰기 금지)
3. **task 파일 생성 + 커밋** (실행 전 필수)
4. task 실행
5. 완료 후 검증

이 순서를 어기면 안 된다. "docs 반영해줘", "task 생성해줘"를 사용자가 반복 요청할 필요 없다.

## 언제 사용하는가

- 새 프로젝트를 처음부터 구축할 때
- 대규모 리팩토링이 여러 단계로 나뉠 때
- 반복 가능한 구현 파이프라인이 필요할 때
- 사람의 개입 없이 자동 실행하고 싶을 때

## 실행 절차

### 1. 문서 파악

`docs/` 하위 문서들을 읽어 프로젝트 기획·아키텍처·설계 의도를 파악한다.
필요 시 여러 Explore 에이전트를 병렬로 사용한다.

참조 문서:

- `docs/prd.md` — 제품 범위, MVP 기능 명세
- `docs/data-schema.md` — 데이터 스키마, 캐시 구조
- `docs/flow.md` — 사용자 플로우
- `docs/code-architecture.md` — 디렉터리 구조, 모듈 의존 관계
- `docs/adr.md` — 기술 결정 기록
- `CLAUDE.md` — 코딩 규칙, 금지사항

### 2. 논의

구체화가 필요한 점, 기술적으로 논의할 점을 사용자에게 제시한다.
사용자가 충분히 논의됐다고 판단하면 3단계로 넘어간다.

### 2.5. docs 최신화 + 커밋 (task 생성 전 필수)

논의 결과를 반드시 **task 생성 전에** docs에 반영한다. task 내부(phase)에서는 docs를 수정하지 않는다.

- `docs/adr.md` — 새 의사결정 기록 (ADR 추가)
- `docs/data-schema.md` — 스키마 변경 반영
- `docs/flow.md` — 플로우 변경 반영
- `docs/code-architecture.md` — 디렉터리/파이프라인 변경 반영

**순서**: docs 최신화 → **docs 별도 커밋 + push** → task 생성 → task 실행.

**docs-first 커밋 원칙**:
- docs 변경사항을 먼저 단독 커밋 (`docs: ...`)
- 그 후 task 파일 생성 및 실행
- 장점: task 실패 시에도 docs는 main에 남아있음, task 커밋과 분리되어 history 명확

### 3. 구현 계획 초안

`prompts/task-create.md`를 정확히 숙지한 후, 다음을 포함한 초안을 작성한다:

- phase별 분리 이유와 작업 목록
- 성공 기준 (실행 가능한 명령어)
- 논의 필요한 사항

사용자 피드백을 받아 계획을 확정한다.

### 4. Task 생성

`prompts/task-create.md` 형식에 따라 task와 phase 파일을 생성한다:

```
tasks/{task-name}/
  index.json
  phase-01.md
  phase-02.md
  ...
```

각 phase 프롬프트는 **자기완결적**이어야 한다 — 이전 대화 없이 독립 실행 가능.

### 5. 실행

**실행 전 필수 확인**: `git status --porcelain`으로 working directory 상태 확인.

- **이상적**: clean 상태 (docs 커밋 완료 후)
- **허용 가능**: task와 무관한 format-on-save만 존재 (추적 가능한 상태)
- **금지**: 같은 working directory에서 다른 task와 병렬 실행. git add/commit/push 충돌 발생

**병렬 실행 규칙**: 두 task를 동시에 실행하려면 반드시 **git worktree 분리** 또는 **claude teams**(subagent)를 사용. 같은 working directory에서 `run-phases.py`를 2개 동시 실행 금지.

**반드시 `run-phases.py`를 Bash `run_in_background: true`로 실행한다.**
사용자 개입 없이 자기 완결적으로 동작해야 한다.

```bash
# 전체 실행 (백그라운드)
python3 scripts/run-phases.py tasks/{task-name}

# 특정 phase부터 재개
python3 scripts/run-phases.py tasks/{task-name} --from-phase 3
```

실행 중 `tasks/{task-name}/index.json`의 status가 자동 갱신된다.

**Task phase에서 파일 커밋 규칙**:
- 각 phase는 **자신의 변경 + 암묵적 의존성** 모두 커밋해야 함
- 예: cache/store.ts 변경 → 관련 types.ts도 수정됨 → 함께 커밋
- Phase 완료 시 **반드시 `git status --porcelain` 실행 후 task 관련 파일 모두 선별하여 add**
- 명시적 목록에 없더라도 task의 변경으로 수정된 파일은 포함

### 5.1. 실패 복구 — 반드시 실패한 phase부터 재시작

**Phase가 타임아웃/에러로 실패한 경우, 해당 phase를 "완료"로 판단하지 말 것.**

- 타임아웃은 "작업 중간"에서 끊긴 것이지 "완료 직전"이 보장되지 않음
- diff가 많아 보여도 일부 파일만 수정하고 나머지를 놓쳤을 수 있음
- **각 phase는 자기완결적으로 설계됨** — 이미 수정된 파일은 건너뛰고 놓친 파일을 잡아냄

**복구 절차**:
1. `--from-phase {실패한 phase 번호}`로 재시작 (다음 phase가 아닌 **실패한 phase**)
2. index.json의 해당 phase status를 `"pending"`으로 리셋 (completed로 마킹 금지)
3. phase가 스스로 현재 코드 상태를 읽고 남은 작업을 판단하게 위임

**금지**: 실패한 phase의 diff를 눈으로 보고 "거의 완료됐으니 다음으로 넘기자"는 판단.

### 6. 완료 후 처리

1. `index.json` status 확인 → `completed` 이면 성공
2. 사용자에게 로컬 테스트 요청
3. 사용자 확인 후 **git commit + push** 진행
4. 다음 plan으로 이동

### 7. 알림 (DOORAY_WEBHOOK_URL 설정 시 자동)

run-phases.py 종료 코드에 따라 웹훅 알림 발송:

| exit code | 의미    | 메시지                                       |
| --------- | ------- | -------------------------------------------- |
| 0         | 성공    | `✅ Task {name} 완료 (N phases)`             |
| 1         | 오류    | `❌ Task {name} phase {n} 실패: {error}`     |
| 2         | blocked | `⚠️ Task {name} phase {n} blocked: {reason}` |

---

## 구조

```
tasks/
  {task-name}/
    index.json        # task 메타데이터 + phase 목록
    phase-01.md       # 자기완결적 실행 프롬프트
    phase-02.md
    ...

scripts/
  run-phases.py       # phase 순차 실행기 (실시간 스트리밍, --from-phase 지원)

prompts/
  task-create.md      # task/phase 작성 가이드
```

## Phase 모델 라우팅 (토큰 효율 최우선)

**원칙**: 계획/설계는 Opus, 실제 구현은 Sonnet, 단순 작업은 Haiku.

Opus는 Sonnet의 약 5배 비싸고 Claude Code Max 5시간 한도를 빠르게 소모한다. 토큰 효율을 위해 **phase의 대부분은 sonnet**을 사용하고, opus는 설계/논의/복잡 디버깅에만 한정한다.

| 모델     | 용도                                                      | 예시                                                    |
| -------- | --------------------------------------------------------- | ------------------------------------------------------- |
| `haiku`  | 기계적 작업 (git commit+push, 빌드 검증, 파일 삭제)       | 빌드 검증 + 커밋 phase, 단순 삭제                      |
| `sonnet` | **실제 구현 대부분** — 코드 작성/수정/rename/리팩토링     | 함수 작성, 커맨드 추가, resolver 수정, UI              |
| `opus`   | **계획/설계/논의** (task 외부에서만) + 복잡 알고리즘 설계 | planner, architect, deep-interview, 복잡한 아키텍처 설계 |

**Task phase에서 opus 사용 금지 원칙** (예외만 허용):
- ❌ 기계적 rename/이동: sonnet으로 충분
- ❌ 파일 수가 많다는 이유만으로 opus: sonnet으로 충분 (패턴이 같으면 파일 수는 무관)
- ✅ 새로운 아키텍처 설계가 phase 안에 포함된 경우: opus 허용
- ✅ 복잡한 알고리즘 구현: opus 허용

**판단 기준**: "이 phase는 *무엇을 할지 결정*하는 작업인가, *이미 결정된 것을 수행*하는 작업인가?"
- 결정 = opus / 수행 = sonnet

**세션 외부 opus 사용**: 사용자와의 논의, docs 작성, task 계획 수립은 main 세션(opus)에서 수행. task phase는 sonnet으로 실행하여 토큰을 절약.

## Phase 프롬프트 작성 핵심 규칙

1. **원자적 단일 책임**: 성격이 다른 작업(기능 추가 vs 버그 수정)은 반드시 별도 phase로 분리
2. **작업 항목 5개 이하**: 하나의 phase에 작업 항목이 5개를 초과하면 반드시 분리. 너무 많은 항목을 담으면 AI 에이전트가 뒤쪽 항목을 누락한다
3. **자기완결적**: 이전 대화 컨텍스트 없이 `claude --print`로 독립 실행
4. **먼저 읽을 문서 명시**: 각 phase 상단에 반드시 참조할 파일 경로 나열
5. **기존 코드 참조 섹션**: 패턴 파악용 기존 파일 경로 명시 (새 코드가 기존 패턴과 일관되도록)
6. **구체적 시그니처**: 생성할 함수의 이름, 파라미터, 반환 타입을 phase에 명시
7. **성공 기준에 모든 작업 검증 포함**: 성공 기준의 grep/ls 검증이 작업 목록의 모든 항목을 커버해야 함. 검증이 빠지면 누락을 감지할 수 없다
8. **Blocked 조건**: 자동 복구 불가능한 상황의 마커 (`PHASE_BLOCKED: ...`)

## Phase 분리 기준

| 기준 | 설명 |
|------|------|
| 의존성 경계 | 이전 phase 결과물이 있어야 시작 가능 |
| 검증 가능 단위 | `pnpm run build`, 테스트 등 독립 검증 |
| 실패 격리 | 실패 시 롤백 범위를 최소화 |

**권장 크기**: 30분 ~ 2시간 작업량.

## 특수 마커

phase 실행 중 출력하면 하네스가 감지:

```
PHASE_BLOCKED: {이유}    # 사용자 개입 필요 → exit 2
PHASE_FAILED: {오류}     # 복구 불가능 → exit 1
```

## 실행 흐름 요약

```
[문서 파악] → [사용자와 논의] → [계획 확정]
    → [docs 최신화] → [docs 커밋 + push]        ← docs-first
    → [task 파일 생성] → [git status 확인]       ← clean working dir 확인
    → [run-phases.py 백그라운드 실행]
    → [완료 확인] → [사용자 로컬 테스트]
    → [다음 plan]
```

## 실제 사용 예시

이 프로젝트(`dooray-cli`) 자체가 이 하네스로 구축되었다:

```
tasks/implement-dooray-cli/
  index.json       # 8 phases
  phase-01.md      # 프로젝트 초기화
  phase-02.md      # Config · Cache · Doctor 레이어
  phase-03.md      # API 클라이언트 + Resolvers
  phase-04.md      # Formatters + Project 커맨드
  phase-05.md      # Post 읽기 커맨드 + Editor
  phase-06.md      # Post 쓰기 커맨드 + Comment
  phase-07.md      # Wiki 커맨드 전체
  phase-08.md      # 빌드 최적화 + npm 배포 준비
```

`tasks/implement-dooray-cli/` 디렉터리를 참고하여 실제 phase 프롬프트 작성법을 확인할 수 있다.

## Exit Codes

| 코드 | 의미                                              |
| ---- | ------------------------------------------------- |
| 0    | 모든 phase 완료                                   |
| 1    | phase 실행 오류 (index.json error_message 참고)   |
| 2    | 사용자 개입 필요 (index.json blocked_reason 참고) |
