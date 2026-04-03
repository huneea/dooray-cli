import { DoorayApiClient } from "../api/client.js";
import type { CachedWorkflow } from "../cache/types.js";
import { getWorkflows, setWorkflows, isExpired } from "../cache/store.js";
import { WORKFLOWS_TTL_MS } from "../cache/types.js";
import { DoorayCliError } from "../utils/errors.js";
import { EXIT_PARAM_ERROR } from "../utils/exit-codes.js";

export async function ensureWorkflows(
  client: DoorayApiClient,
  projectId: string,
): Promise<CachedWorkflow[]> {
  const entry = await getWorkflows(projectId);
  if (entry && !isExpired(entry.updatedAt, WORKFLOWS_TTL_MS)) {
    return entry.data;
  }
  const res = await client.getProjectWorkflows(projectId);
  const items: CachedWorkflow[] = res.result.map((w) => ({
    id: w.id,
    name: w.name,
    class: w.class as CachedWorkflow["class"],
    order: w.order,
  }));
  await setWorkflows(projectId, items);
  return items;
}

export async function resolveWorkflow(
  client: DoorayApiClient,
  projectId: string,
  input: string,
): Promise<string> {
  const workflows = await ensureWorkflows(client, projectId);

  const match = workflows.find((w) => w.name === input || w.class === input);
  if (match) return match.id;

  throw new DoorayCliError(
    `워크플로우를 찾을 수 없습니다: ${input}`,
    EXIT_PARAM_ERROR,
  );
}
