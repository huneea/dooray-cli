# Phase 1: 프로젝트 초기화

## 컨텍스트

`dooray-cli`는 Dooray REST API를 CLI로 래핑하는 TypeScript 프로젝트다.
프로젝트 루트: `/Users/nhn/personal/dooray-cli`
현재 상태: 빈 프로젝트 (docs/, scripts/, prompts/, tasks/ 만 존재)

설계 문서:
- `docs/code-architecture.md` — 기술 스택, 디렉터리 구조, 빌드 설정
- `docs/adr.md` — ADR-001(TypeScript), ADR-002(ky), ADR-003(tsup) 참고

## 목표

TypeScript 프로젝트를 초기화하고, 빌드 파이프라인이 동작하며, `dooray --version` 이 출력되는 상태까지 만든다.

## 작업 목록

- [ ] `package.json` 생성
  - name: `@bifos/dooray-cli`
  - bin: `{ "dooray": "./dist/index.js" }`
  - engines: `{ "node": ">=18" }`
  - scripts: build (tsup), dev (tsup --watch)
  - version: `0.1.0`
- [ ] 의존성 설치
  - 런타임: `commander`, `ky`, `chalk`, `cli-table3`, `ora`, `js-yaml`, `tmp`
  - 개발: `typescript`, `tsup`, `@types/node`, `@types/js-yaml`, `@types/tmp`, `@types/cli-table3`
- [ ] `tsconfig.json` 생성 (target: ES2022, module: Node16, strict: true, outDir: dist)
- [ ] `tsup.config.ts` 생성 (format: cjs, target: node18, entry: src/index.ts, banner에 shebang 추가)
- [ ] `src/index.ts` 생성 — Commander 루트 프로그램 설정 (name, description, version)
- [ ] `src/utils/exit-codes.ts` 생성 — 상수: SUCCESS=0, API_ERROR=1, AUTH_ERROR=2, PARAM_ERROR=3, CONFIG_ERROR=4
- [ ] `src/utils/errors.ts` 생성 — `DoorayCliError` 클래스 (message, exitCode)
- [ ] `src/utils/spinner.ts` 생성 — ora 래퍼 (startSpinner, stopSpinner)

## 성공 기준

1. `npm install` 이 오류 없이 완료
2. `npm run build` 가 `dist/index.js` 파일 생성
3. `node dist/index.js --version` 이 `0.1.0` 출력
4. `node dist/index.js --help` 이 dooray 설명 출력
5. `dist/index.js` 첫 줄이 `#!/usr/bin/env node`

## 주의사항

- `ky`는 ESM 전용 패키지다. tsup bundler가 알아서 처리하지만, tsconfig의 module 설정에 주의
- chalk 5.x도 ESM 전용이므로 동일하게 tsup 번들링에 의존
- ora도 ESM 전용 — tsup이 CJS로 번들링
- `.gitignore`에 `node_modules/`, `dist/` 는 이미 추가되어 있음

## Blocked 조건

npm install이 네트워크 문제로 실패하면:
`PHASE_BLOCKED: npm install 실패 — 네트워크 연결 확인 필요`
