import fse from "fs-extra";

/* function getFiles(dir: string): string[][] {
  const files = [];
  const dirents = fs.readdirSync(dir, { withFileTypes: true });
  for (const dirent of dirents) {
    const res = path.resolve(dir, dirent.name);
    if (dirent.isDirectory()) {
      return files.concat(getFiles(res));
    } else {
      files.push([res, dir]);
    }
  }
  return files;
} */
try {
  const templateDir = `${__dirname}/../src/template`;
  const targetDir = process.cwd();
  if (!fse.existsSync(targetDir)) {
    fse.mkdirSync(targetDir, { recursive: true });
  }
  fse.copySync(templateDir, targetDir, {
    errorOnExist: true,
    overwrite: false,
  });
} catch (err) {
  console.error(err);
}
