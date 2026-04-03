# Phase 3: 기존 코드 연동 + 빌드 검증

## 컨텍스트

dooray-cli는 TypeScript + Commander.js 기반 Dooray REST API CLI 도구이다.
`src/index.ts`를 읽어 CLI entrypoint 구조를 파악하라.
`src/config/store.ts`를 읽어 `getConfigOrThrow` 함수의 에러 메시지를 확인하라.

Phase 2에서 `src/commands/setup.ts`가 구현된 상태이다.

## 목표

1. `src/index.ts`에 setup 커맨드 등록
2. config 미설정 시 에러 메시지를 `dooray setup` 실행 유도로 변경
3. 전체 빌드 + CLI 동작 검증

## 작업 목록

- [ ] `src/index.ts`에서 `setupCommand`를 import하고 `program.addCommand(setupCommand)` 추가
  - setup은 최상위 커맨드로 등록 (config, doctor와 같은 레벨)
  - config보다 앞에 위치시켜 `dooray --help` 출력 시 가장 먼저 보이도록
- [ ] `src/config/store.ts`의 `getConfigOrThrow` 에러 메시지를 변경:
  - 기존: `"설정이 완료되지 않았습니다. 먼저 설정을 진행하세요:\n  dooray config set api-key ..."`
  - 변경: `"설정이 완료되지 않았습니다. 먼저 초기 설정을 진행하세요:\n  dooray setup"`
- [ ] `pnpm run build` 성공 확인
- [ ] `node dist/index.js --help` 실행하여 setup 커맨드가 목록에 표시되는지 확인
- [ ] `node dist/index.js setup --help` 실행하여 정상 출력 확인
- [ ] `node dist/index.js --version` 정상 출력 확인

## 성공 기준

- `pnpm run build` 성공
- `node dist/index.js --help` 출력에 `setup` 커맨드 표시
- `node dist/index.js --version` 정상 출력
- `src/config/store.ts`의 에러 메시지에 `dooray setup` 안내 포함

## 주의사항

- setup 커맨드는 config, doctor 등과 같은 최상위 레벨에 등록
- 기존 `dooray config set/get` 커맨드는 그대로 유지 (수동 설정 경로 보존)
- `dooray doctor` 커맨드의 미설정 안내도 `dooray setup` 으로 변경할 것:
  - `src/commands/doctor.ts`의 하단 `⚠ 설정이 필요합니다:` 부분도 `dooray setup`으로 안내 변경
- 버전 번호는 변경하지 말 것 (별도 릴리스에서 처리)
