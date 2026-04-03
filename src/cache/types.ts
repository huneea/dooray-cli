export const PROJECTS_TTL_MS = 3_600_000; // 1h
export const MEMBERS_TTL_MS = 3_600_000; // 1h
export const WORKFLOWS_TTL_MS = 86_400_000; // 24h
export const ME_TTL_MS = 86_400_000; // 24h

export interface CacheEntry<T> {
  updatedAt: string;
  data: T;
}

export interface CachedMe {
  id: string;
  name: string;
}

export interface CachedProject {
  id: string;
  code: string;
  wikiId?: string;
}

export interface CachedMember {
  organizationMemberId: string;
  name: string;
}

export interface CachedWorkflow {
  id: string;
  name: string;
  class: "backlog" | "registered" | "working" | "closed";
  order?: number;
}
