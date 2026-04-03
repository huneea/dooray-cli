import { Command } from "commander";
import { getConfigOrThrow } from "../../config/store.js";
import { DoorayApiClient } from "../../api/client.js";
import { resolveProject } from "../../resolvers/project.js";
import { formatPostList } from "../../formatters/post.js";
import type { OutputOptions } from "../../formatters/table.js";
import type { Post } from "../../api/types.js";
import { startSpinner, stopSpinner } from "../../utils/spinner.js";

export const postListCommand = new Command("list")
  .description("업무 목록 조회")
  .argument("<project>", "프로젝트 코드 또는 ID")
  .option("--subject <keyword>", "제목 키워드 필터링")
  .option("--all", "전체 페이지네이션 (모든 결과 조회)")
  .option("--page <number>", "페이지 번호", "0")
  .option("--size <number>", "페이지 크기", "20")
  .action(async (project, opts) => {
    const globalOpts = postListCommand.optsWithGlobals() as OutputOptions;
    const config = await getConfigOrThrow();
    const client = new DoorayApiClient(config.apiKey, config.baseUrl);

    startSpinner("업무 목록 조회 중...");
    const projectId = await resolveProject(client, project);

    const params: { subjects?: string; page?: number; size?: number; order?: string } = {
      order: "-createdAt",
    };
    if (opts.subject) params.subjects = opts.subject;

    let posts: Post[];

    if (opts.all) {
      posts = [];
      let page = 0;
      const size = 100;
      while (true) {
        const res = await client.getPosts(projectId, { ...params, page, size });
        posts.push(...res.result);
        if (posts.length >= res.totalCount) break;
        page++;
      }
    } else {
      const res = await client.getPosts(projectId, {
        ...params,
        page: Number(opts.page),
        size: Number(opts.size),
      });
      posts = res.result;
    }

    stopSpinner(true, "업무 목록 조회 완료");
    formatPostList(posts, globalOpts);
  });
