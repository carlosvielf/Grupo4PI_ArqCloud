import { spawn } from "node:child_process";
import process from "node:process";

const children = [
  spawn(process.execPath, ["server/index.js"], { stdio: "inherit" }),
  spawn(process.execPath, ["node_modules/vite/bin/vite.js", "--configLoader", "runner", "--host", "127.0.0.1"], {
    stdio: "inherit",
  }),
];
const stop = () => children.forEach((child) => child.kill("SIGTERM"));
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
for (const child of children) child.on("exit", (code) => {
  if (code) process.exitCode = code;
});
