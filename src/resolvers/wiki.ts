import { DoorayApiClient } from "../api/client.js";
import { getProjects, isExpired } from "../cache/store.js";
import { PROJECTS_TTL_MS } from "../cache/types.js";
import { DoorayCliError } from "../utils/errors.js";
import { EXIT_PARAM_ERROR } from "../utils/exit-codes.js";
import { resolveProject } from "./project.js";

export async function resolveWiki(
  client: DoorayApiClient,
  projectCode: string,
): Promise<string> {
  // resolveProject ensures project cache is fresh
  await resolveProject(client, projectCode);

  const entry = await getProjects();
  const project = entry?.data.find(
    (p) => p.code === projectCode || p.id === projectCode,
  );

  if (!project?.wikiId) {
    throw new DoorayCliError(
      `프로젝트에 위키가 없습니다: ${projectCode}`,
      EXIT_PARAM_ERROR,
    );
  }

  return project.wikiId;
}
