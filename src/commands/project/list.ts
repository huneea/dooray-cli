import { Command } from "commander";
import { getConfigOrThrow } from "../../config/store.js";
import { DoorayApiClient } from "../../api/client.js";
import { ensureProjects } from "../../resolvers/project.js";
import { output, type OutputOptions } from "../../formatters/table.js";
import { startSpinner, stopSpinner } from "../../utils/spinner.js";

export const projectListCommand = new Command("list")
  .description("프로젝트 목록 조회")
  .option("-s, --search <keyword>", "code 필터링")
  .option("-t, --type <type>", "프로젝트 타입 필터 (public|private)", "public")
  .action(async (opts) => {
    const globalOpts = projectListCommand.optsWithGlobals() as OutputOptions;
    const config = await getConfigOrThrow();
    const client = new DoorayApiClient(config.apiKey, config.baseUrl);

    startSpinner("프로젝트 목록 조회 중...");
    const projects = await ensureProjects(client, {
      type: opts.type,
    });
    stopSpinner(true, "프로젝트 목록 조회 완료");

    let filtered = projects;
    if (opts.search) {
      const keyword = opts.search.toLowerCase();
      filtered = projects.filter((p) => p.code.toLowerCase().includes(keyword));
    }

    output(globalOpts, {
      headers: ["ID", "Code"],
      rows: filtered.map((p) => [p.id, p.code]),
      raw: filtered,
      ids: filtered.map((p) => p.id),
    });
  });
