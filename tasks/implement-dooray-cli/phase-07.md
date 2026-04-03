# Phase 7: Wiki 커맨드 전체

## 컨텍스트

`dooray-cli`는 Dooray REST API를 CLI로 래핑하는 TypeScript 프로젝트다.
프로젝트 루트: `/Users/nhn/personal/dooray-cli`
이전 phase에서 Post 읽기/쓰기 + Comment 전체 완료. Editor 모듈도 이미 구현됨.

설계 문서:
- `docs/data-schema.md` — WikiResolver 로직 (project.wiki.id 캐시 활용)
- `docs/adr.md` — ADR-009(WikiResolver는 ProjectCache 활용)

## 목표

Wiki 관련 커맨드 전체를 구현한다: list, pages, page get, page create, page edit.

## 작업 목록

- [ ] `src/formatters/wiki.ts` 구현
  - `formatWikiList(wikis)`: 테이블 — id, code, description
  - `formatWikiPages(pages)`: 테이블 — id, title, updatedAt
  - `formatWikiPageDetail(page)`: 상세 — title, body, updatedAt
- [ ] `src/commands/wiki/list.ts` — `dooray wiki list [--page N] [--size N]`
  - getWikis API 호출
  - formatWikiList로 테이블 출력
- [ ] `src/commands/wiki/pages.ts` — `dooray wiki pages <project> [--parent <page-id>]`
  - WikiResolver로 projectCode → wikiId 변환
  - --parent 옵션 시 getWikiPages(wikiId, parentPageId), 없으면 getWikiPages(wikiId)
  - formatWikiPages로 테이블 출력
- [ ] `src/commands/wiki/page-get.ts` — `dooray wiki page get <project> <page-id>`
  - WikiResolver로 wikiId 확보
  - getWikiPage(wikiId, pageId) 호출
  - formatWikiPageDetail로 상세 출력
- [ ] `src/commands/wiki/page-create.ts` — `dooray wiki page create <project> --title <title> [--parent <page-id>] [--body-file <path>] [--body -]`
  - WikiResolver로 wikiId 확보
  - createWikiPage API 호출
  - 성공 시 생성된 pageId 출력
- [ ] `src/commands/wiki/page-edit.ts` — `dooray wiki page edit <project> <page-id>`
  - WikiResolver로 wikiId 확보
  - getWikiPage로 현재 페이지 조회
  - editor/index.ts 활용:
    ```yaml
    ---
    title: 현재 제목
    ---
    본문 마크다운...
    ```
  - $EDITOR로 수정 → 파싱 → updateWikiPage API 호출
- [ ] editor/index.ts에 wiki용 frontmatter 직렬화·파싱 함수 추가
  - `serializeWikiFrontmatter(page)`: title만 frontmatter에 포함
  - `parseWikiFrontmatter(content)`: { title, body }
- [ ] `src/index.ts`에 wiki 커맨드 그룹 등록

## 성공 기준

1. `npm run build` 성공
2. `node dist/index.js wiki list` 가 위키 목록 출력
3. `node dist/index.js wiki pages <project>` 가 페이지 목록 출력
4. `node dist/index.js wiki page get <project> <pageId>` 가 페이지 상세 출력
5. `node dist/index.js wiki page get <project> <pageId> --json` 이 JSON 출력

## 주의사항

- WikiResolver는 project cache에서 wikiId를 가져온다. project cache가 비어있으면 자동으로 갱신한다.
- wikiId가 null인 프로젝트는 "이 프로젝트에 위키가 없습니다" 에러.
- wiki page의 body도 `text/x-markdown` mimeType.
- wiki page create에서 --parent 미지정 시 루트 페이지로 생성.

## Blocked 조건

없음 — 이전 phase 성공 시 모든 의존성 충족.
