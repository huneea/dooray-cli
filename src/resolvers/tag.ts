import { DoorayApiClient } from "../api/client.js";
import type { CachedTag } from "../cache/types.js";
import { getTags, setTags, isExpired } from "../cache/store.js";
import { TAGS_TTL_MS } from "../cache/types.js";
import { DoorayCliError } from "../utils/errors.js";
import { EXIT_PARAM_ERROR } from "../utils/exit-codes.js";

export async function ensureTags(
  client: DoorayApiClient,
  projectId: string,
): Promise<CachedTag[]> {
  const entry = await getTags(projectId);
  if (entry && !isExpired(entry.updatedAt, TAGS_TTL_MS)) {
    return entry.data;
  }
  const res = await client.getProjectTags(projectId);
  const items: CachedTag[] = res.result.map((t) => ({
    id: t.id,
    name: t.name,
    prefix: t.prefix,
    color: t.color,
  }));
  await setTags(projectId, items);
  return items;
}

export async function resolveTag(
  client: DoorayApiClient,
  projectId: string,
  input: string,
): Promise<string> {
  const tags = await ensureTags(client, projectId);

  // ID 직접 매칭
  const byId = tags.find((t) => t.id === input);
  if (byId) return byId.id;

  // 이름 완전 일치 (prefix/name 또는 name만)
  const byExact = tags.find(
    (t) =>
      t.name === input ||
      (t.prefix && `${t.prefix}/${t.name}` === input),
  );
  if (byExact) return byExact.id;

  // 이름 부분 일치
  const lower = input.toLowerCase();
  const matches = tags.filter(
    (t) =>
      t.name.toLowerCase().includes(lower) ||
      (t.prefix && `${t.prefix}/${t.name}`.toLowerCase().includes(lower)),
  );

  if (matches.length === 1) return matches[0].id;

  if (matches.length > 1) {
    const list = matches
      .map((t) => (t.prefix ? `  - ${t.prefix}/${t.name}` : `  - ${t.name}`))
      .join("\n");
    throw new DoorayCliError(
      `태그가 모호합니다: ${input}\n후보:\n${list}`,
      EXIT_PARAM_ERROR,
    );
  }

  throw new DoorayCliError(
    `태그를 찾을 수 없습니다: ${input}`,
    EXIT_PARAM_ERROR,
  );
}
