import os from "node:os";
import { spawn } from "node:child_process";
const portable =
  process.platform === "darwin" && Number(os.release().split(".")[0]) < 22;
const api = spawn(
  portable ? "node" : "npx",
  portable ? ["scripts/preview.mjs"] : ["wrangler", "dev", "--port", "8787"],
  { stdio: "inherit", shell: false },
);
const web = spawn(
  "npx",
  ["next", "dev", "--webpack", "--hostname", "127.0.0.1"],
  {
    stdio: "inherit",
    shell: false,
    env: { ...process.env, NEXT_PUBLIC_API_BASE: "http://localhost:8787" },
  },
);
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () => {
    api.kill();
    web.kill();
    process.exit(0);
  });
