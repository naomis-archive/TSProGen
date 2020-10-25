import fs from "fs";
import path from "path";

fs.readFile(path.join(__dirname, "./readme-copy.md"), "utf-8", (err, data) => {
  if (err) {
    return console.log(err);
  }
  fs.writeFile(path.join(process.cwd() + "/README.md"), data, (err) => {
    if (err) {
      return console.log(err);
    }
    console.log("Readme generated");
  });
});
