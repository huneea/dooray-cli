# Task 생성 가이드

이 문서는 AI 에이전트가 구현 task를 생성할 때 따르는 규칙이다.

## 디렉터리 구조

```
tasks/
  {task-name}/
    index.json        # task 메타데이터 및 phase 목록
    phase-01.md       # phase 1 프롬프트 (Claude에게 전달되는 실행 지시)
    phase-02.md
    ...
```

## index.json 스키마

```json
{
  "name": "task-name",
  "description": "무엇을 구현하는 task인지 한 줄 설명",
  "created_at": "2026-04-02T00:00:00Z",
  "updated_at": "2026-04-02T00:00:00Z",
  "status": "pending",
  "current_phase": 0,
  "total_phases": 3,
  "error_message": null,
  "blocked_reason": null,
  "phases": [
    {
      "number": 1,
      "title": "phase 제목",
      "file": "phase-01.md",
      "status": "pending",
      "allowedTools": ["Read", "Write", "Edit", "Bash", "Glob", "Grep"]
    }
  ]
}
```

### status 값

- `pending` — 아직 실행 전
- `running` — 현재 실행 중
- `completed` — 성공 완료
- `failed` — 오류 발생 (error_message 참고)
- `blocked` — 사용자 개입 필요 (blocked_reason 참고)

### allowedTools

각 phase에서 Claude가 사용할 수 있는 도구 목록. 생략 시 기본값:
`["Read", "Write", "Edit", "Bash", "Glob", "Grep"]`

---

## phase 파일 작성 규칙

### 핵심 원칙

1. **자기완결적** — 각 phase 프롬프트는 이전 대화 컨텍스트 없이 독립 실행된다. 필요한 모든 맥락을 프롬프트 안에 포함해야 한다.
2. **단일 책임** — 한 phase는 명확히 하나의 작업 단위를 담당한다.
3. **검증 가능** — phase 마지막에 성공 기준을 명시한다.

### phase 파일 구조

```markdown
# Phase N: {제목}

## 컨텍스트

이 프로젝트가 무엇인지, 현재 상태가 어떤지 간략히 설명.
관련 문서 경로 명시 (e.g., `docs/code-architecture.md` 읽어서 구조 파악).

## 목표

이 phase에서 구현해야 할 것을 명확히 서술.

## 작업 목록

- [ ] 구체적인 작업 1
- [ ] 구체적인 작업 2

## 성공 기준

- 어떤 파일이 생성/수정되어야 하는가
- 어떤 커맨드가 성공적으로 실행되어야 하는가

## 주의사항

- 하지 말아야 할 것
- 특별히 신경 써야 할 것

## Blocked 조건

다음 상황이 발생하면 아래 형식으로 출력하고 종료:
`PHASE_BLOCKED: {사용자에게 전달할 이유}`
```

### PHASE_BLOCKED / PHASE_FAILED 마커

phase 실행 중 run-phases.py가 감지하는 특수 마커:

```
# 사용자 개입이 필요할 때 (exit 2)
PHASE_BLOCKED: {이유}

# 복구 불가능한 오류 발생 시 (exit 1)
PHASE_FAILED: {오류 내용}
```

stdout 또는 stderr 어디에 출력해도 감지됨.

---

## Phase 분리 기준

| 기준             | 설명                                                |
| ---------------- | --------------------------------------------------- |
| 의존성 경계      | 이전 phase 결과물이 있어야 시작 가능한 작업         |
| 검증 가능한 단위 | `npm install`, `tsc`, 테스트 실행 등 독립 검증 가능 |
| 실패 격리        | 실패 시 롤백 범위를 최소화할 수 있는 단위           |

**권장 phase 크기**: 30분 ~ 2시간 작업량. 너무 크면 실패 시 롤백 비용이 크고, 너무 작으면 오버헤드가 증가한다.

---

## 예시: 3-phase task

```
tasks/implement-api-client/
  index.json
  phase-01.md   # 프로젝트 초기화 (package.json, tsconfig, 의존성 설치)
  phase-02.md   # API 클라이언트 구현 (src/api/client.ts, types.ts)
  phase-03.md   # 빌드 검증 (tsc 통과, tsup 번들 생성)
```

phase-01은 phase-02가 의존하는 파일 구조를 만들고, phase-03은 전체를 검증한다.
