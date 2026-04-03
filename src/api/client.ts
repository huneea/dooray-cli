import ky, { type KyInstance, HTTPError } from "ky";
import { DoorayCliError } from "../utils/errors.js";
import { EXIT_API_ERROR, EXIT_AUTH_ERROR } from "../utils/exit-codes.js";
import type {
  ProjectListResponse,
  PostListResponse,
  PostDetailResponse,
  CreatePostApiResponse,
  CreatePostRequest,
  UpdatePostRequest,
  UpdatePostResponse,
  SetWorkflowRequest,
  SetParentPostRequest,
  PostCommentListResponse,
  CreateCommentApiResponse,
  CreateCommentRequest,
  UpdateCommentRequest,
  UpdateCommentResponse,
  DeleteCommentResponse,
  ProjectMemberListResponse,
  ProjectWorkflowListResponse,
  MemberDetailResponse,
  WikiListResponse,
  WikiPagesResponse,
  WikiPageResponse,
  CreateWikiPageRequest,
  CreateWikiPageResponse,
  UpdateWikiPageRequest,
  DoorayApiUnitResponse,
  DoorayErrorResponse,
} from "./types.js";

export interface GetPostsParams {
  page?: number;
  size?: number;
  fromMemberIds?: string[];
  toMemberIds?: string[];
  ccMemberIds?: string[];
  tagIds?: string[];
  parentPostId?: string;
  postNumber?: string;
  postWorkflowClasses?: string[];
  postWorkflowIds?: string[];
  milestoneIds?: string[];
  subjects?: string;
  createdAt?: string;
  updatedAt?: string;
  dueAt?: string;
  order?: string;
}

export interface GetProjectsParams {
  page?: number;
  size?: number;
  type?: string;
  scope?: string;
  state?: string;
}

export interface GetPostCommentsParams {
  page?: number;
  size?: number;
  order?: string;
}

export interface GetMembersParams {
  page?: number;
  size?: number;
}

export interface GetWikisParams {
  page?: number;
  size?: number;
}

function joinIds(ids: string[] | undefined): string | undefined {
  return ids && ids.length > 0 ? ids.join(",") : undefined;
}

async function toDoorayCliError(error: unknown): Promise<never> {
  if (error instanceof HTTPError) {
    const status = error.response.status;
    const exitCode = status === 401 || status === 403 ? EXIT_AUTH_ERROR : EXIT_API_ERROR;
    try {
      const body = (await error.response.json()) as DoorayErrorResponse;
      throw new DoorayCliError(
        `API 호출 실패: ${body.header.resultMessage}`,
        exitCode,
      );
    } catch (e) {
      if (e instanceof DoorayCliError) throw e;
      throw new DoorayCliError(
        `API 호출 실패 (${status}): ${error.message}`,
        exitCode,
      );
    }
  }
  throw error;
}

export class DoorayApiClient {
  private readonly api: KyInstance;

  constructor(apiKey: string, baseUrl: string) {
    this.api = ky.create({
      prefixUrl: baseUrl,
      headers: {
        Authorization: `dooray-api ${apiKey}`,
      },
    });
  }

  // ─── Me ─────────────────────────────────────────────

  async getMe(): Promise<MemberDetailResponse> {
    try {
      return await this.api
        .get("common/v1/members/me")
        .json<MemberDetailResponse>();
    } catch (e) {
      return toDoorayCliError(e);
    }
  }

  // ─── Projects ───────────────────────────────────────

  async getProjects(params?: GetProjectsParams): Promise<ProjectListResponse> {
    try {
      return await this.api
        .get("project/v1/projects", {
          searchParams: {
            member: "me",
            ...(params?.page != null && { page: params.page }),
            ...(params?.size != null && { size: params.size }),
            ...(params?.type && { type: params.type }),
            ...(params?.scope && { scope: params.scope }),
            ...(params?.state && { state: params.state }),
          },
        })
        .json<ProjectListResponse>();
    } catch (e) {
      return toDoorayCliError(e);
    }
  }

  // ─── Posts ──────────────────────────────────────────

  async getPosts(projectId: string, params?: GetPostsParams): Promise<PostListResponse> {
    try {
      return await this.api
        .get(`project/v1/projects/${projectId}/posts`, {
          searchParams: {
            ...(params?.page != null && { page: params.page }),
            ...(params?.size != null && { size: params.size }),
            ...(joinIds(params?.fromMemberIds) && { fromMemberIds: joinIds(params?.fromMemberIds) }),
            ...(joinIds(params?.toMemberIds) && { toMemberIds: joinIds(params?.toMemberIds) }),
            ...(joinIds(params?.ccMemberIds) && { ccMemberIds: joinIds(params?.ccMemberIds) }),
            ...(joinIds(params?.tagIds) && { tagIds: joinIds(params?.tagIds) }),
            ...(params?.parentPostId && { parentPostId: params.parentPostId }),
            ...(params?.postNumber && { postNumber: params.postNumber }),
            ...(joinIds(params?.postWorkflowClasses) && { postWorkflowClasses: joinIds(params?.postWorkflowClasses) }),
            ...(joinIds(params?.postWorkflowIds) && { postWorkflowIds: joinIds(params?.postWorkflowIds) }),
            ...(joinIds(params?.milestoneIds) && { milestoneIds: joinIds(params?.milestoneIds) }),
            ...(params?.subjects && { subjects: params.subjects }),
            ...(params?.createdAt && { createdAt: params.createdAt }),
            ...(params?.updatedAt && { updatedAt: params.updatedAt }),
            ...(params?.dueAt && { dueAt: params.dueAt }),
            ...(params?.order && { order: params.order }),
          },
        })
        .json<PostListResponse>();
    } catch (e) {
      return toDoorayCliError(e);
    }
  }

  async getPost(projectId: string, postId: string): Promise<PostDetailResponse> {
    try {
      return await this.api
        .get(`project/v1/projects/${projectId}/posts/${postId}`)
        .json<PostDetailResponse>();
    } catch (e) {
      return toDoorayCliError(e);
    }
  }

  async createPost(projectId: string, body: CreatePostRequest): Promise<CreatePostApiResponse> {
    try {
      return await this.api
        .post(`project/v1/projects/${projectId}/posts`, { json: body })
        .json<CreatePostApiResponse>();
    } catch (e) {
      return toDoorayCliError(e);
    }
  }

  async updatePost(projectId: string, postId: string, body: UpdatePostRequest): Promise<UpdatePostResponse> {
    try {
      return await this.api
        .put(`project/v1/projects/${projectId}/posts/${postId}`, { json: body })
        .json<UpdatePostResponse>();
    } catch (e) {
      return toDoorayCliError(e);
    }
  }

  async setPostDone(projectId: string, postId: string): Promise<DoorayApiUnitResponse> {
    try {
      return await this.api
        .post(`project/v1/projects/${projectId}/posts/${postId}/set-done`)
        .json<DoorayApiUnitResponse>();
    } catch (e) {
      return toDoorayCliError(e);
    }
  }

  async setPostWorkflow(projectId: string, postId: string, workflowId: string): Promise<DoorayApiUnitResponse> {
    try {
      return await this.api
        .post(`project/v1/projects/${projectId}/posts/${postId}/set-workflow`, {
          json: { workflowId } satisfies SetWorkflowRequest,
        })
        .json<DoorayApiUnitResponse>();
    } catch (e) {
      return toDoorayCliError(e);
    }
  }

  async setPostParent(projectId: string, postId: string, parentPostId: string): Promise<DoorayApiUnitResponse> {
    try {
      return await this.api
        .post(`project/v1/projects/${projectId}/posts/${postId}/set-parent-post`, {
          json: { parentPostId } satisfies SetParentPostRequest,
        })
        .json<DoorayApiUnitResponse>();
    } catch (e) {
      return toDoorayCliError(e);
    }
  }

  // ─── Post Comments ──────────────────────────────────

  async getPostComments(projectId: string, postId: string, params?: GetPostCommentsParams): Promise<PostCommentListResponse> {
    try {
      return await this.api
        .get(`project/v1/projects/${projectId}/posts/${postId}/logs`, {
          searchParams: {
            ...(params?.page != null && { page: params.page }),
            ...(params?.size != null && { size: params.size }),
            ...(params?.order && { order: params.order }),
          },
        })
        .json<PostCommentListResponse>();
    } catch (e) {
      return toDoorayCliError(e);
    }
  }

  async createPostComment(projectId: string, postId: string, body: CreateCommentRequest): Promise<CreateCommentApiResponse> {
    try {
      return await this.api
        .post(`project/v1/projects/${projectId}/posts/${postId}/logs`, { json: body })
        .json<CreateCommentApiResponse>();
    } catch (e) {
      return toDoorayCliError(e);
    }
  }

  async updatePostComment(projectId: string, postId: string, logId: string, body: UpdateCommentRequest): Promise<UpdateCommentResponse> {
    try {
      return await this.api
        .put(`project/v1/projects/${projectId}/posts/${postId}/logs/${logId}`, { json: body })
        .json<UpdateCommentResponse>();
    } catch (e) {
      return toDoorayCliError(e);
    }
  }

  async deletePostComment(projectId: string, postId: string, logId: string): Promise<DeleteCommentResponse> {
    try {
      return await this.api
        .delete(`project/v1/projects/${projectId}/posts/${postId}/logs/${logId}`)
        .json<DeleteCommentResponse>();
    } catch (e) {
      return toDoorayCliError(e);
    }
  }

  // ─── Members ────────────────────────────────────────

  async getProjectMembers(projectId: string, params?: GetMembersParams): Promise<ProjectMemberListResponse> {
    try {
      return await this.api
        .get(`project/v1/projects/${projectId}/members`, {
          searchParams: {
            member: "me",
            ...(params?.page != null && { page: params.page }),
            ...(params?.size != null && { size: params.size }),
          },
        })
        .json<ProjectMemberListResponse>();
    } catch (e) {
      return toDoorayCliError(e);
    }
  }

  async getMemberDetail(memberId: string): Promise<MemberDetailResponse> {
    try {
      return await this.api
        .get(`common/v1/members/${memberId}`)
        .json<MemberDetailResponse>();
    } catch (e) {
      return toDoorayCliError(e);
    }
  }

  // ─── Workflows ──────────────────────────────────────

  async getProjectWorkflows(projectId: string): Promise<ProjectWorkflowListResponse> {
    try {
      return await this.api
        .get(`project/v1/projects/${projectId}/workflows`)
        .json<ProjectWorkflowListResponse>();
    } catch (e) {
      return toDoorayCliError(e);
    }
  }

  // ─── Wiki ───────────────────────────────────────────

  async getWikis(params?: GetWikisParams): Promise<WikiListResponse> {
    try {
      return await this.api
        .get("wiki/v1/wikis", {
          searchParams: {
            ...(params?.page != null && { page: params.page }),
            ...(params?.size != null && { size: params.size }),
          },
        })
        .json<WikiListResponse>();
    } catch (e) {
      return toDoorayCliError(e);
    }
  }

  async getWikiPages(wikiId: string, parentPageId?: string): Promise<WikiPagesResponse> {
    try {
      return await this.api
        .get(`wiki/v1/wikis/${wikiId}/pages`, {
          searchParams: {
            ...(parentPageId && { parentPageId }),
          },
        })
        .json<WikiPagesResponse>();
    } catch (e) {
      return toDoorayCliError(e);
    }
  }

  async getWikiPage(wikiId: string, pageId: string): Promise<WikiPageResponse> {
    try {
      return await this.api
        .get(`wiki/v1/wikis/${wikiId}/pages/${pageId}`)
        .json<WikiPageResponse>();
    } catch (e) {
      return toDoorayCliError(e);
    }
  }

  async createWikiPage(wikiId: string, body: CreateWikiPageRequest): Promise<CreateWikiPageResponse> {
    try {
      return await this.api
        .post(`wiki/v1/wikis/${wikiId}/pages`, { json: body })
        .json<CreateWikiPageResponse>();
    } catch (e) {
      return toDoorayCliError(e);
    }
  }

  async updateWikiPage(wikiId: string, pageId: string, body: UpdateWikiPageRequest): Promise<DoorayApiUnitResponse> {
    try {
      return await this.api
        .put(`wiki/v1/wikis/${wikiId}/pages/${pageId}`, { json: body })
        .json<DoorayApiUnitResponse>();
    } catch (e) {
      return toDoorayCliError(e);
    }
  }
}
