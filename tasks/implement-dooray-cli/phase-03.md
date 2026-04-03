# Phase 3: API 클라이언트 + Resolvers

## 컨텍스트

`dooray-cli`는 Dooray REST API를 CLI로 래핑하는 TypeScript 프로젝트다.
프로젝트 루트: `/Users/nhn/personal/dooray-cli`
이전 phase에서 config/cache 레이어 완료. `~/.dooray/config.json`으로 apiKey, baseUrl 관리 가능.

기존 Kotlin MCP 서버의 API 타입을 TypeScript로 포팅한다:
- Kotlin 타입 경로: `/Users/nhn/personal/dooray-mcp-server/src/main/kotlin/com/bifos/dooray/mcp/types/`
- Kotlin HTTP 클라이언트: `/Users/nhn/personal/dooray-mcp-server/src/main/kotlin/com/bifos/dooray/mcp/client/DoorayHttpClient.kt`
- Kotlin 인터페이스: `/Users/nhn/personal/dooray-mcp-server/src/main/kotlin/com/bifos/dooray/mcp/client/DoorayClient.kt`

설계 문서:
- `docs/data-schema.md` — Resolver 로직 상세
- `docs/code-architecture.md` — API Client 구조, 모듈 의존 관계
- `docs/adr.md` — ADR-002(ky), ADR-004(디스크 캐시), ADR-005(postNumber), ADR-009(WikiResolver)

## 목표

1. Kotlin 타입을 TypeScript 인터페이스로 포팅 (`src/api/types.ts`)
2. ky 기반 HTTP 클라이언트 구현 (`src/api/client.ts`) — DoorayClient 인터페이스의 모든 메서드
3. 5개 Resolver 구현 (project, member, workflow, post, wiki)

## 작업 목록

### api/types.ts — Kotlin 타입 포팅
- [ ] 반드시 Kotlin 소스 파일들을 읽어서 포팅할 것:
  - `/Users/nhn/personal/dooray-mcp-server/src/main/kotlin/com/bifos/dooray/mcp/types/DoorayApiSuccessType.kt`
  - `/Users/nhn/personal/dooray-mcp-server/src/main/kotlin/com/bifos/dooray/mcp/types/DoorayApiErrorType.kt`
  - `/Users/nhn/personal/dooray-mcp-server/src/main/kotlin/com/bifos/dooray/mcp/types/ProjectPostResponse.kt`
  - `/Users/nhn/personal/dooray-mcp-server/src/main/kotlin/com/bifos/dooray/mcp/types/ProjectMemberResponse.kt`
  - `/Users/nhn/personal/dooray-mcp-server/src/main/kotlin/com/bifos/dooray/mcp/types/ProjectWorkflowResponse.kt`
  - `/Users/nhn/personal/dooray-mcp-server/src/main/kotlin/com/bifos/dooray/mcp/types/WikiListResponse.kt`
  - `/Users/nhn/personal/dooray-mcp-server/src/main/kotlin/com/bifos/dooray/mcp/types/WikiPageResponse.kt`
  - `/Users/nhn/personal/dooray-mcp-server/src/main/kotlin/com/bifos/dooray/mcp/types/WikiPagesResponse.kt`
  - `/Users/nhn/personal/dooray-mcp-server/src/main/kotlin/com/bifos/dooray/mcp/types/ToolResponseTypes.kt`
- [ ] 공통: DoorayApiHeader, DoorayApiResponse<T>, DoorayApiNullableResponse<T>, DoorayErrorResponse
- [ ] Project: Project, ProjectListResponse
- [ ] Post: Post, PostDetail, PostBody, PostUsers, PostUser, PostComment, 그리고 모든 Request/Response 타입
- [ ] Member: ProjectMember, ProjectMemberListResponse
- [ ] Workflow: ProjectWorkflow, ProjectWorkflowListResponse
- [ ] Wiki: Wiki, WikiPage, 그리고 모든 Request/Response 타입

### api/client.ts — DoorayApiClient
- [ ] 반드시 Kotlin HTTP 클라이언트를 읽어서 포팅할 것:
  - `/Users/nhn/personal/dooray-mcp-server/src/main/kotlin/com/bifos/dooray/mcp/client/DoorayClient.kt`
  - `/Users/nhn/personal/dooray-mcp-server/src/main/kotlin/com/bifos/dooray/mcp/client/DoorayHttpClient.kt`
- [ ] constructor(apiKey, baseUrl): ky 인스턴스 생성 (prefixUrl, Authorization 헤더)
- [ ] 프로젝트: getProjects(params?)
- [ ] 업무: getPosts(projectId, params?), getPost(projectId, postId), createPost(projectId, body), updatePost(projectId, postId, body), setPostDone(projectId, postId), setPostWorkflow(projectId, postId, workflowId), setPostParent(projectId, postId, parentPostId)
- [ ] 댓글: getPostComments(projectId, postId, params?), createPostComment(projectId, postId, body), updatePostComment(projectId, postId, logId, body), deletePostComment(projectId, postId, logId)
- [ ] 멤버: getProjectMembers(projectId, params?)
- [ ] 워크플로우: getProjectWorkflows(projectId)
- [ ] 위키: getWikis(params?), getWikiPages(wikiId), getWikiPages(wikiId, parentPageId), getWikiPage(wikiId, pageId), createWikiPage(wikiId, body), updateWikiPage(wikiId, pageId, body)
- [ ] 에러 처리: ky HTTPError → DoorayCliError 변환 (401/403은 AUTH_ERROR, 그 외는 API_ERROR)

### resolvers/* — 5개 Resolver
- [ ] `resolvers/project.ts` — ProjectResolver
  - `resolve(input)`: cache에서 code/id 매칭 → 없으면 API 호출 후 캐시 갱신 → 반환
  - 페이지네이션 처리: page 0부터 size 100으로 전체 프로젝트 가져오기
- [ ] `resolvers/member.ts` — MemberResolver
  - `resolve(projectId, input)`: cache에서 name(부분일치) 또는 email(정확일치) 매칭
  - 복수 매칭 시 DoorayCliError + 후보 목록 메시지 (ADR-008)
  - 페이지네이션 처리: 전체 멤버 가져오기
- [ ] `resolvers/workflow.ts` — WorkflowResolver
  - `resolve(projectId, input)`: cache에서 name 또는 class 매칭
- [ ] `resolvers/post.ts` — PostResolver
  - `resolve(projectId, postNumber)`: API getPosts(projectId, { postNumber }) → 첫 결과의 id
  - 캐시 없음 (포스트는 수시로 변경)
- [ ] `resolvers/wiki.ts` — WikiResolver
  - `resolve(projectCode)`: ProjectResolver로 project 캐시 조회 → wikiId 반환
  - wikiId null이면 에러

## 성공 기준

1. `npm run build` 성공 — 타입 에러 없음
2. `src/api/types.ts`가 Kotlin 소스의 모든 타입을 포함
3. `src/api/client.ts`가 DoorayHttpClient.kt의 모든 메서드에 대응

## 주의사항

- ky는 ESM 전용이므로 `import ky from 'ky'` 사용. tsup이 CJS로 번들링
- Dooray API 인증 헤더: `Authorization: dooray-api {apiKey}` (Bearer가 아님)
- API base URL 뒤에 슬래시 처리 주의 (ky의 prefixUrl 특성)
- PostResolver는 캐시를 사용하지 않는다 (ADR-005)
- MemberResolver에서 name 매칭은 부분일치(includes), email은 정확일치
- 이 phase에서는 실제 API 호출 테스트를 하지 않는다 — tsc 빌드 통과만 검증

## Blocked 조건

Kotlin 소스 파일이 경로에 존재하지 않으면:
`PHASE_BLOCKED: dooray-mcp-server 소스가 /Users/nhn/personal/dooray-mcp-server에 없음`
