import git from "isomorphic-git";
import http from "isomorphic-git/http/node";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dir = path.join(__dirname, "..");
const remoteUrl = "https://github.com/yaswanth3987/sri-vishnu-priya.git";

async function pushToGithub() {
  console.log("1. Initializing Git repository in:", dir);
  await git.init({ fs, dir });

  console.log("2. Configuring Remote:", remoteUrl);
  try {
    await git.addRemote({ fs, dir, remote: "origin", url: remoteUrl, force: true });
  } catch (e) {
    // remote may already exist
  }

  console.log("3. Staging files...");
  const matrix = await git.statusMatrix({ fs, dir });
  for (const [filepath, head, workdir, stage] of matrix) {
    if (filepath.startsWith("node_modules") || filepath.startsWith(".git/")) continue;
    if (workdir === 0) {
      await git.remove({ fs, dir, filepath });
    } else {
      await git.add({ fs, dir, filepath });
    }
  }

  console.log("4. Committing changes...");
  try {
    const sha = await git.commit({
      fs,
      dir,
      author: {
        name: "yaswanth3987",
        email: "yaswanth@srivishnupriya.com",
      },
      message: "feat: Supabase live database sync, bulk stock import, daily bill reset & POS business date synchronization",
    });
    console.log("Committed with SHA:", sha);
  } catch (err) {
    console.log("Commit notice:", err.message);
  }

  console.log("5. Git staging and commit complete!");
}

pushToGithub().catch(console.error);
