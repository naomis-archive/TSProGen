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

const createProject = async (
  _: TaskCtx,
  task: ListrTaskWrapper<TaskCtx, typeof ListrRenderer>
) => {
  try {
    const templateDir = `${__dirname}/../src/template`;
    const targetDir = process.cwd();
    if (!fs.pathExists(targetDir)) {
      await fs.mkdir(targetDir);
    }
    await fs.copy(templateDir, targetDir, {
      errorOnExist: true,
      overwrite: false,
    });
  } catch (err) {
    task.output = `Failed to copy template files: ${err.message}`;
    throw err;
  }
};

const configFile = `${os.homedir()}/.config/tsprogen.json`;
const getConfig = async (
  ctx: TaskCtx,
  task: ListrTaskWrapper<TaskCtx, typeof ListrRenderer>
): Promise<void> => {
  if (!(await fs.pathExists(configFile))) {
    ctx.config = await task.prompt([
      {
        type: "list",
        name: "packageManager",
        message: "What package manager would you like to use?",
        default: "npm",
        choices: ["pnpm", "npm", "yarn"],
      },
    ]);
    await fs.writeFile(configFile, JSON.stringify(ctx.config), {
      encoding: "utf-8",
    });
  }
  ctx.config = JSON.parse(await fs.readFile(configFile, { encoding: "utf-8" }));
};

const installDependencies = async (
  ctx: TaskCtx,
  task: ListrTaskWrapper<TaskCtx, typeof ListrRenderer>
) => {
  const { stderr } = await execAsync(`${ctx.config.packageManager} install`, {
    cwd: process.cwd(),
  });
  if (stderr) {
    task.output = `Install error: ${stderr}`;
    throw new Error(stderr);
  }
};

const tasks = new Listr<TaskCtx>([
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
]);

// Run all project tasks
tasks.run().catch(() => null);
