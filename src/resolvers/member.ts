import { DoorayApiClient } from "../api/client.js";
import type { CachedMember } from "../cache/types.js";
import { getMembers, setMembers, isExpired } from "../cache/store.js";
import { MEMBERS_TTL_MS } from "../cache/types.js";
import { DoorayCliError } from "../utils/errors.js";
import { EXIT_PARAM_ERROR } from "../utils/exit-codes.js";

async function fetchAllMembers(
  client: DoorayApiClient,
  projectId: string,
): Promise<CachedMember[]> {
  // Step 1: collect all member IDs from project member API (only returns id + role)
  const memberIds: string[] = [];
  let page = 0;
  const size = 100;

  while (true) {
    const res = await client.getProjectMembers(projectId, { page, size });
    for (const m of res.result) {
      memberIds.push(m.organizationMemberId);
    }
    const total = res.totalCount ?? memberIds.length;
    if (memberIds.length >= total) break;
    page++;
  }

  // Step 2: enrich with /common/v1/members/{id} (all parallel)
  const all = await Promise.all(
    memberIds.map(async (id) => {
      try {
        const detail = await client.getMemberDetail(id);
        return {
          organizationMemberId: id,
          name: detail.result.name,
        };
      } catch {
        return {
          organizationMemberId: id,
          name: "",
        };
      }
    }),
  );

  return all;
}

export async function ensureMembers(
  client: DoorayApiClient,
  projectId: string,
): Promise<CachedMember[]> {
  const entry = await getMembers(projectId);
  if (entry && !isExpired(entry.updatedAt, MEMBERS_TTL_MS)) {
    return entry.data;
  }
  const items = await fetchAllMembers(client, projectId);
  await setMembers(projectId, items);
  return items;
}

export async function resolveMember(
  client: DoorayApiClient,
  projectId: string,
  input: string,
): Promise<string> {
  const members = await ensureMembers(client, projectId);

  // name 부분일치
  const byName = members.filter((m) => m.name.includes(input));
  if (byName.length === 1) return byName[0].organizationMemberId;

  if (byName.length > 1) {
    const candidates = byName
      .map((m) => `  - ${m.name} (${m.organizationMemberId})`)
      .join("\n");
    throw new DoorayCliError(
      `복수의 멤버가 매칭됩니다: "${input}"\n${candidates}`,
      EXIT_PARAM_ERROR,
    );
  }

  throw new DoorayCliError(
    `멤버를 찾을 수 없습니다: ${input}`,
    EXIT_PARAM_ERROR,
  );
}
