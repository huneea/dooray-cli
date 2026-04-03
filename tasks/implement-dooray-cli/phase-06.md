# Phase 6: Post 쓰기 커맨드 + Comment

## 컨텍스트

`dooray-cli`는 Dooray REST API를 CLI로 래핑하는 TypeScript 프로젝트다.
프로젝트 루트: `/Users/nhn/personal/dooray-cli`
이전 phase에서 Post 읽기 커맨드(list, search, get)와 Editor 모듈, post edit 커맨드 완료.

설계 문서:
- `docs/flow.md` — 업무 생성 흐름
- `docs/data-schema.md` — MemberResolver 로직 (이름 부분일치, 이메일 정확일치, 모호성 에러)
- `docs/adr.md` — ADR-008(멤버 모호성 에러+후보 출력)

## 목표

Post 쓰기 커맨드(create, done, workflow)와 Comment 전체 CRUD를 구현한다.

## 작업 목록

### Post 쓰기 커맨드
- [ ] `src/commands/post/create.ts` — `dooray post create <project> --subject <title> --to <member> [--to <member2>] [--cc <member>] [--body-file <path>] [--body -] [--priority <level>] [--due-date <date>]`
  - ProjectResolver로 projectId 해석
  - MemberResolver로 --to, --cc의 이름/이메일 → organizationMemberId 변환
  - --body-file: 파일에서 본문 읽기
  - --body -: stdin에서 본문 읽기
  - --body-file도 --body도 없으면: 빈 본문으로 생성
  - createPost API 호출
  - 성공 시 생성된 postId 출력
- [ ] `src/commands/post/done.ts` — `dooray post done <project> <post-number>`
  - ProjectResolver → PostResolver
  - setPostDone API 호출
  - 성공 메시지 출력
- [ ] `src/commands/post/workflow.ts` — `dooray post workflow <project> <post-number> <workflow>`
  - ProjectResolver → PostResolver
  - WorkflowResolver로 workflow 이름/class → workflowId 변환
  - setPostWorkflow API 호출
  - 성공 메시지 출력

### Comment 커맨드
- [ ] `src/commands/post/comment/list.ts` — `dooray post comment list <project> <post-number> [--page N] [--size N]`
  - ProjectResolver → PostResolver
  - getPostComments API 호출
  - 테이블 출력: id, creator.name, body (truncated), createdAt
- [ ] `src/commands/post/comment/add.ts` — `dooray post comment add <project> <post-number> [--body "..."] [--body-file <path>] [--body -]`
  - --body: 짧은 인라인 텍스트
  - --body-file: 파일에서 읽기
  - --body -: stdin에서 읽기
  - 셋 다 없으면: $EDITOR로 입력 (editor/index.ts 활용)
  - createPostComment API 호출 (mimeType: "text/x-markdown")
- [ ] `src/commands/post/comment/edit.ts` — `dooray post comment edit <project> <post-number> <comment-id>`
  - getPostComment으로 현재 댓글 조회
  - $EDITOR로 본문 수정 (frontmatter 없이 본문만)
  - updatePostComment API 호출
- [ ] `src/commands/post/comment/delete.ts` — `dooray post comment delete <project> <post-number> <comment-id>`
  - deletePostComment API 호출
  - 성공 메시지 출력

- [ ] `src/index.ts`에 post create, done, workflow, comment 서브커맨드 그룹 등록

## 성공 기준

1. `npm run build` 성공
2. `node dist/index.js post create <project> --subject "테스트" --to <member-name> --body-file test.md` 가 업무 생성
3. `node dist/index.js post done <project> <number>` 가 업무 완료 처리
4. `node dist/index.js post workflow <project> <number> "진행 중"` 이 워크플로우 변경
5. `node dist/index.js post comment list <project> <number>` 가 댓글 목록 출력
6. `node dist/index.js post comment add <project> <number> --body "댓글"` 이 댓글 생성
7. `--to "김"` 처럼 모호한 이름 입력 시 에러 + 후보 목록 출력

## 주의사항

- `--to`는 Commander에서 `.option('--to <members...>')` 로 여러 값 받기 (배열)
- `--cc`도 동일하게 배열
- comment의 body는 frontmatter 없이 순수 마크다운 — post edit과 다름
- comment-id는 Dooray의 `logId` — 댓글 목록 조회 시 `id` 필드에 해당
- stdin 읽기: `process.stdin.isTTY`가 false일 때만 stdin에서 읽기 시도
- 댓글 삭제는 확인 프롬프트 없이 바로 실행 (AI 에이전트 사용 고려, ADR-008)

## Blocked 조건

없음 — 이전 phase 성공 시 모든 의존성 충족.
