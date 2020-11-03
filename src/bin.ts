import fs from "fs-extra";
import os from "os";
import { exec } from "child_process";
import { promisify } from "util";
import { Listr, ListrRenderer, ListrTaskWrapper } from "listr2";

const execAsync = promisify(exec);

export interface Config {
  packageManager: string;
}

export interface TaskCtx {
  config: Config;
}

const createProject = async () => {
  try {
    const templateDir = `${__dirname}/template`;
    const targetDir = process.cwd();
    if (!fs.pathExists(targetDir)) {
      await fs.mkdir(targetDir);
    }
    await fs.copy(templateDir, targetDir, {
      errorOnExist: true,
      overwrite: false,
    });
  } catch (err) {
    throw new Error(`Failed to copy template files: ${err.message}`);
  }
};

const promptConfig = async (
  ctx: TaskCtx,
  task: ListrTaskWrapper<TaskCtx, typeof ListrRenderer>
) => {
  ctx.config = {
    packageManager: await task.prompt([
      {
        type: "autocomplete",
        name: "packageManager",
        message: "What package manager would you like to use?",
        default: "npm",
        choices: ["pnpm", "npm", "yarn"],
      },
    ]),
  };
  await fs.writeFile(configFile, JSON.stringify(ctx.config), {
    encoding: "utf-8",
  });
};

const configFile = `${os.homedir()}/.config/tsprogen.json`;
const getConfig = async (
  ctx: TaskCtx,
  task: ListrTaskWrapper<TaskCtx, typeof ListrRenderer>
): Promise<void> => {
  if (!(await fs.pathExists(configFile))) {
    await promptConfig(ctx, task);
  }
  ctx.config = JSON.parse(await fs.readFile(configFile, { encoding: "utf-8" }));

  if (
    !ctx.config.packageManager ||
    (ctx.config.packageManager &&
      !["npm", "pnpm", "yarn"].includes(ctx.config.packageManager.trim()))
  ) {
    await promptConfig(ctx, task);
  }
};

const installDependencies = async (ctx: TaskCtx) => {
  if (!["npm", "pnpm", "yarn"].includes(ctx.config.packageManager.trim())) {
    throw new Error(`Install error: Invalid package manager in ${configFile}`);
  }
  const { stderr } = await execAsync(
    `${ctx.config.packageManager.trim()} install`,
    {
      cwd: process.cwd(),
    }
  );
  if (stderr) {
    throw new Error(`Install error: ${stderr}`);
  }
};

const tasks = new Listr<TaskCtx>(
  [
    {
      title: "Retrieve Config",
      task: getConfig,
    },
    {
      title: "Create Project Files",
      task: createProject,
    },
    {
      title: "Install Dependencies",
      task: installDependencies,
    },
  ],
  { concurrent: 1 }
);

// Run all project tasks
tasks.run().catch(() => {
  // do nothing
});
