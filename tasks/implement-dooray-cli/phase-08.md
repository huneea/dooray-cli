# Phase 8: 빌드 최적화 + npm 배포 준비

## 컨텍스트

`dooray-cli`는 Dooray REST API를 CLI로 래핑하는 TypeScript 프로젝트다.
프로젝트 루트: `/Users/nhn/personal/dooray-cli`
이전 phase까지 모든 커맨드(config, doctor, cache, project, post, comment, wiki) 구현 완료.

## 목표

npm에 `@bifos/dooray-cli`로 배포 가능한 상태를 만든다. 패키지 메타데이터, 빌드 최적화, 동작 최종 검증.

## 작업 목록

- [ ] `package.json` 메타데이터 보강
  - description: "CLI tool for Dooray project management — AI agent & terminal friendly"
  - keywords: ["dooray", "cli", "project-management", "nhn", "task"]
  - repository, homepage, bugs URL (GitHub repo URL)
  - license: "MIT"
  - files: ["dist"] — 배포 시 dist만 포함
  - type 필드 확인 (tsup CJS 번들이므로 "commonjs" 또는 미지정)
- [ ] 빌드 최종 확인
  - `npm run build` → `dist/index.js` 생성
  - 첫 줄 shebang `#!/usr/bin/env node` 확인
  - 파일 크기 확인 (합리적인 범위)
- [ ] 실행 권한 확인
  - `chmod +x dist/index.js` (npm publish 시 자동이지만 로컬 테스트용)
- [ ] `npm pack` 실행 → `.tgz` 파일 생성
  - `.tgz` 내용물에 `dist/index.js`, `package.json`만 포함 확인
  - `.env`, `node_modules/`, `src/`, `tasks/`, `docs/` 가 포함되지 않음 확인
- [ ] 로컬 설치 테스트
  - `npm install -g ./bifos-dooray-cli-*.tgz`
  - `dooray --version` → 0.1.0 출력
  - `dooray --help` → 전체 커맨드 목록 출력
  - `dooray config get` → 설정 출력
  - `dooray project list` → 동작 확인
- [ ] 로컬 설치 정리
  - `npm uninstall -g @bifos/dooray-cli`

## 성공 기준

1. `npm run build` 오류 없이 완료
2. `npm pack` 이 `.tgz` 파일 생성
3. `.tgz` 로 전역 설치 후 `dooray --version` 이 `0.1.0` 출력
4. `dooray --help` 가 config, doctor, cache, project, post, wiki 커맨드 목록 표시
5. `dooray project list` 가 실제 API 결과 출력 (config 설정된 상태)

## 주의사항

- npm publish는 하지 않는다 — 로컬 검증까지만. publish는 사용자가 수동으로 진행.
- `.tgz` 에 `.env` 파일이 절대 포함되면 안 됨 (API 키 유출)
- files 필드에 "dist"만 명시하면 package.json, README.md는 자동 포함됨
- npm pack 실행 후 로컬 전역 설치가 실패하면 shebang 또는 bin 경로 확인

## Blocked 조건

없음 — 이전 phase 성공 시 모든 의존성 충족.
