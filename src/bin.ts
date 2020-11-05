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

// generate mandatory files
const createProject = async () => {
  try {
    const templateDir = `${__dirname}/template`;
    const targetDir = process.cwd();

    if (!fs.pathExists(targetDir)) {
      await fs.mkdir(targetDir);
    }
    await fs.mkdir(`${targetDir}/src`);
    await fs.copy(templateDir, targetDir, {
      errorOnExist: true,
      overwrite: false,
    });
    fs.writeFile(
      `${targetDir}/src/index.ts`,
      `console.log("index.ts works!")`,
      (err) => {
        if (err) {
          console.error(err);
          return;
        }
      }
    );
  } catch (err) {
    throw new Error(`Failed to copy template files: ${err.message}`);
  }
};

// select package manager
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

//save selection locally
const configFile = `${os.homedir()}/.config/tsprogen.json`;

// check for package manager selection
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

// prompt for optional files individually
const createOptionalFiles = async (
  ctx: TaskCtx,
  task: ListrTaskWrapper<TaskCtx, typeof ListrRenderer>
) => {
  try {
    const templateDir = `${__dirname}/optional`;
    const targetDir = process.cwd();

    //eslint config
    const linter = await task.prompt([
      {
        type: "autocomplete",
        name: "linter",
        message: "Generate .eslintrc.json?",
        default: "yes",
        choices: ["yes", "no"],
      },
    ]);
    if (linter === "yes") {
      const data = await fs.readFile(`${templateDir}/.eslintrc.json`);
      fs.writeFile(`${targetDir}/.eslintrc.json`, data, (err) => {
        if (err) {
          console.error(err);
        }
      });
    }

    // gitignore
    const gitIgnore = await task.prompt([
      {
        type: "autocomplete",
        name: "gitignore",
        message: "Generate .gitignore?",
        default: "yes",
        choices: ["yes", "no"],
      },
    ]);
    if (gitIgnore === "yes") {
      const data = `/node_modules/\n/prod/\n`;
      fs.writeFile(`${targetDir}/.gitignore`, data, (err) => {
        if (err) {
          console.error(err);
        }
      });
    }

    // editorconfig
    const edConfig = await task.prompt([
      {
        type: "autocomplete",
        name: "editor config",
        message: "Generate .editorconfig?",
        default: "yes",
        choices: ["yes", "no"],
      },
    ]);
    if (edConfig === "yes") {
      const data = await fs.readFile(`${templateDir}/.editorconfig`);
      fs.writeFile(`${targetDir}/.editorconfig`, data, (err) => {
        if (err) {
          console.error(err);
        }
      });
    }

    //husky config
    const husky = await task.prompt([
      {
        type: "autocomplete",
        name: "husky",
        message: "Generate .huskyrc?",
        default: "yes",
        choices: ["yes", "no"],
      },
    ]);
    if (husky === "yes") {
      const data = await fs.readFile(`${templateDir}/.huskyrc`);
      fs.writeFile(`${targetDir}/.huskyrc`, data, (err) => {
        if (err) {
          console.error(err);
        }
      });
    }
  } catch (err) {
    console.error(err);
  }
};

//automatically install the dependencies
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

//generates task list in console
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
      title: "Create Optional Files",
      task: createOptionalFiles,
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
