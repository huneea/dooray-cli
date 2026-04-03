---
name: plan-and-build
description: AI 에이전트 하네스를 사용한 대규모 구현 자동화. task를 phase로 분리하고 Claude Code로 순차 실행. 프로젝트 구축, 리팩토링 등 multi-phase 작업에 사용.
---

# plan-and-build

대규모 구현 작업을 phase 단위로 분리하고, `run-phases.py` 하네스를 통해 Claude Code가 자동으로 순차 실행하는 시스템.

## 언제 사용하는가

- 새 프로젝트를 처음부터 구축할 때
- 대규모 리팩토링이 여러 단계로 나뉠 때
- 반복 가능한 구현 파이프라인이 필요할 때
- 사람의 개입 없이 자동 실행하고 싶을 때

## 구조

```
tasks/
  {task-name}/
    index.json        # task 메타데이터 + phase 목록
    phase-01.md       # 각 phase의 자기완결적 프롬프트
    phase-02.md
    ...

scripts/
  run-phases.py       # Claude Code phase 순차 실행기

prompts/
  task-create.md      # task/phase 작성 가이드
```

## 빠른 시작

### 1. task 구조 생성

```bash
mkdir -p tasks/my-feature
```

`tasks/my-feature/index.json`:
```json
{
  "name": "my-feature",
  "description": "기능 구현 설명",
  "created_at": "2026-04-03T00:00:00Z",
  "status": "pending",
  "current_phase": 0,
  "total_phases": 3,
  "phases": [
    {
      "number": 1,
      "title": "프로젝트 초기화",
      "file": "phase-01.md",
      "status": "pending",
      "allowedTools": ["Read", "Write", "Edit", "Bash", "Glob", "Grep"]
    },
    {
      "number": 2,
      "title": "핵심 기능 구현",
      "file": "phase-02.md",
      "status": "pending"
    },
    {
      "number": 3,
      "title": "빌드 검증",
      "file": "phase-03.md",
      "status": "pending"
    }
  ]
}
```

### 2. phase 프롬프트 작성

각 phase는 **자기완결적**이어야 한다. 이전 대화 컨텍스트 없이 독립 실행된다.

`tasks/my-feature/phase-01.md`:
```markdown
# Phase 1: 프로젝트 초기화

## 컨텍스트
이 프로젝트는 ... 을 구현한다. `docs/code-architecture.md`를 읽어 구조를 파악하라.

## 목표
package.json, tsconfig.json, 기본 디렉터리 구조 생성.

## 작업 목록
- [ ] package.json 생성
- [ ] tsconfig.json 설정
- [ ] src/ 디렉터리 구조 생성

## 성공 기준
- `pnpm install` 성공
- `pnpm run build` 성공 (빈 entrypoint)

## Blocked 조건
Node.js 18+ 미설치 시: `PHASE_BLOCKED: Node.js 18 이상이 필요합니다`
```

### 3. 실행

```bash
python scripts/run-phases.py tasks/my-feature
```

출력 예시:
```
🚀  Task: my-feature  (3 phases)

  ▶  Phase 1/3: 프로젝트 초기화
  ✓  Phase 1/3: 프로젝트 초기화  완료
  ▶  Phase 2/3: 핵심 기능 구현
  ✓  Phase 2/3: 핵심 기능 구현  완료
  ▶  Phase 3/3: 빌드 검증
  ✓  Phase 3/3: 빌드 검증  완료

✅ Task my-feature 완료 (3 phases)
```

## Phase 작성 규칙

### 핵심 원칙

| 원칙 | 설명 |
|------|------|
| 자기완결적 | 이전 phase 대화 없이 독립 실행 가능해야 한다 |
| 단일 책임 | 한 phase는 하나의 명확한 작업 단위 |
| 검증 가능 | 성공 기준을 명시하여 자동 검증 가능 |

### Phase 분리 기준

| 기준 | 설명 |
|------|------|
| 의존성 경계 | 이전 phase 결과물이 있어야 시작 가능 |
| 검증 가능 단위 | `npm install`, `tsc`, 테스트 등 독립 검증 |
| 실패 격리 | 실패 시 롤백 범위를 최소화 |

**권장 크기**: 30분 ~ 2시간 작업량.

### 특수 마커

phase 실행 중 출력하면 하네스가 감지:

```
PHASE_BLOCKED: {이유}    # 사용자 개입 필요 → exit 2
PHASE_FAILED: {오류}     # 복구 불가능 → exit 1
```

## 알림

`DOORAY_WEBHOOK_URL` 환경변수 설정 시 각 phase 완료/실패를 Dooray 메신저로 알림:

```bash
export DOORAY_WEBHOOK_URL="https://hook.dooray.com/services/..."
python scripts/run-phases.py tasks/my-feature
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

| 코드 | 의미 |
|------|------|
| 0 | 모든 phase 완료 |
| 1 | phase 실행 오류 (index.json의 error_message 참고) |
| 2 | 사용자 개입 필요 (index.json의 blocked_reason 참고) |
