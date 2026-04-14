# Phase 3: 커밋 + push

## 컨텍스트

dooray-cli v0.5.0 구현이 완료되었다. Phase 1에서 setup 스킬 설치, Phase 2에서 doctor 스킬 검증 + 빌드 검증을 수행했다. 이제 변경사항을 커밋하고 push한다.

## 목표

모든 v0.5.0 관련 변경 파일을 선별하여 커밋 + push.

## 작업 목록

- [ ] `git status --porcelain`으로 전체 수정/신규 파일 확인
- [ ] task 관련 파일만 선별하여 `git add`:
  - `src/commands/setup.ts` — 스킬 설치 추가
  - `src/commands/doctor.ts` — 스킬 검증 추가
  - `package.json` — files 필드에 skills 추가
  - 그 외 task 변경으로 인해 수정된 파일 (타입, 의존성 등)
  - `tasks/v0.5.0-setup-skill-install/` — task 파일 자체
- [ ] `git add -A` 금지 — task와 무관한 파일(format-on-save 등) 제외
- [ ] 커밋 메시지: `feat(setup): Claude Code 스킬 설치 + doctor 검증`
- [ ] `git push` 실행

## 성공 기준

- `git status` clean (커밋 후)
- `git log -1 --oneline`에 커밋 메시지 확인
- push 성공

## 주의사항

- format-on-save나 task와 무관한 변경이 `git status`에 있으면 로그에 명시하고 제외
- push 실패 시 `PHASE_BLOCKED: push 실패 — 원격 변경사항 확인 필요`

## Blocked 조건

- push 실패 시: `PHASE_BLOCKED: push 실패 — 원격 변경사항 확인 필요`
