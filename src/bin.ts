import fs from "fs-extra";
import inquirer from "inquirer";
import os from "os";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export interface Config {
  packageManager: string;
}

const createProject = async () => {
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
    return true;
  } catch (err) {
    console.error(`Failed to copy template files: ${err.message}`);
    return false;
  }
};

const configFile = `${os.homedir()}/.config/tsprogen.json`;
const getConfig = async (): Promise<Config> => {
  if (!(await fs.pathExists(configFile))) {
    const { pm } = await inquirer.prompt([
      {
        type: "list",
        name: "pm",
        message: "What package manager would you like to use?",
        default: "npm",
        choices: ["pnpm", "npm", "yarn"],
      },
    ]);
    await fs.writeFile(configFile, JSON.stringify({ packageManager: pm }), {
      encoding: "utf-8",
    });
  }
  return JSON.parse(await fs.readFile(configFile, { encoding: "utf-8" }));
};

getConfig()
  .then(async ({ packageManager }) => {
    const result = await createProject();
    if (!result) {
      return;
    }
    const { stdout, stderr } = await execAsync(`${packageManager} install`, {
      cwd: process.cwd(),
    });
    if (stderr) {
      console.error(`Install error: ${stderr}`);
    }
    console.log(`Install log: ${stdout}`);
  })
  .catch(() => {
    console.error(`Could not read config file ${configFile}!`);
  });
