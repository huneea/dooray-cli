# CLAUDE.md — dooray-cli

## 프로젝트 개요

NHN Dooray REST API CLI 도구. TypeScript + Commander.js 기반.

## 빌드 & 실행

```bash
pnpm install          # 의존성 설치
pnpm run build        # tsup 빌드 (dist/index.js 단일 번들)
node dist/index.js    # 직접 실행
dooray                # 글로벌 링크 시
```

## 디렉토리 구조

```
src/
  index.ts              # CLI entrypoint
  api/client.ts         # DoorayApiClient (ky 기반)
  api/imapClient.ts     # IMAP 메일 조회 (imapflow + mailparser)
  api/types.ts          # API 요청/응답 타입
  cache/store.ts        # ~/.dooray/cache/ 디렉토리 기반 캐시 CRUD
  cache/types.ts        # CacheEntry, Cached* 타입
  resolvers/            # me, project, member, workflow, post, wiki resolver
  commands/             # Commander.js 커맨드 (project, post, post/file, wiki, mail, config, cache, doctor)
  editor/index.ts       # $EDITOR 연동 + YAML frontmatter 파싱
  formatters/           # 테이블/JSON/quiet 출력
  utils/                # errors, spinner, exit-codes
```

## 코드 컨벤션

- HTTP 클라이언트: `ky` (axios 사용 금지)
- 빌드: `tsup` (CJS 단일 번들, shebang 포함)
- 패키지 매니저: `pnpm`
- 캐시: `~/.dooray/cache/` 디렉토리에 파일별 분리 (me.json, projects.json, members/{id}.json, workflows/{id}.json)
- config: `~/.dooray/config.json` (env var 폴백 없음)
- 에러: `DoorayCliError(message, exitCode)` 로 통일
- 출력: 데이터는 stdout, 스피너/에러는 stderr

## 벤치마크

```bash
bash scripts/benchmark.sh [project] [post-number] [wiki-page-id]
# cold (캐시 없음, 3s) + warm (캐시 있음, 0.2s) 측정
```

## 주의사항

- `post edit`, `comment edit`은 `--subject`/`--body` 옵션으로 non-interactive 사용 가능
- `post create`는 `--subject` 필수
- 멤버 resolver는 이름 부분일치로 매칭, 모호하면 에러 + 후보 목록 출력
- post 목록은 최신순 정렬 (`-createdAt`)
