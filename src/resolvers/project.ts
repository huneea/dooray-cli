import { DoorayApiClient } from "../api/client.js";
import type { CachedProject } from "../cache/types.js";
import { getProjects, setProjects, isExpired } from "../cache/store.js";
import { PROJECTS_TTL_MS } from "../cache/types.js";
import { DoorayCliError } from "../utils/errors.js";
import { EXIT_PARAM_ERROR } from "../utils/exit-codes.js";

async function fetchAllProjects(
  client: DoorayApiClient,
  options?: { type?: string },
): Promise<CachedProject[]> {
  const all: CachedProject[] = [];
  let page = 0;
  const size = 100;

  while (true) {
    const res = await client.getProjects({ page, size, type: options?.type });
    for (const p of res.result) {
      all.push({
        id: p.id,
        code: p.code,
        wikiId: p.wiki?.id ?? undefined,
      });
    }
    if (all.length >= res.totalCount) break;
    page++;
  }

  return all;
}

export async function ensureProjects(
  client: DoorayApiClient,
  options?: { type?: string },
): Promise<CachedProject[]> {
  // public이 아닌 타입(private 등) 조회 시 캐시 우회
  if (options?.type && options.type !== "public") {
    return fetchAllProjects(client, options);
  }
  const entry = await getProjects();
  if (entry && !isExpired(entry.updatedAt, PROJECTS_TTL_MS)) {
    return entry.data;
  }
  const items = await fetchAllProjects(client);
  await setProjects(items);
  return items;
}

export async function resolveProject(
  client: DoorayApiClient,
  input: string,
): Promise<string> {
  // public 프로젝트에서 먼저 검색
  const projects = await ensureProjects(client);
  const match = projects.find((p) => p.code === input || p.id === input);
  if (match) return match.id;

  // private 프로젝트에서 검색
  const privateProjects = await ensureProjects(client, { type: "private" });
  const privateMatch = privateProjects.find((p) => p.code === input || p.id === input);
  if (privateMatch) return privateMatch.id;

  throw new DoorayCliError(
    `프로젝트를 찾을 수 없습니다: ${input}`,
    EXIT_PARAM_ERROR,
  );
}
