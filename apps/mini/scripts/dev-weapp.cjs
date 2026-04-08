const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

const taroJsPath = path.join(process.cwd(), "dist", "taro.js");
const patchScriptPath = path.join(process.cwd(), "scripts", "patch-taro-jsx.cjs");

const runPatch = () => {
  try {
    // Use node to reuse the same patch logic.
    spawn(process.execPath, [patchScriptPath], { stdio: "inherit" });
  } catch (e) {
    console.error("[dev-weapp] patch failed", e);
  }
};

const watchTaroJs = () => {
  let lastSize = 0;
  const tick = () => {
    try {
      if (!fs.existsSync(taroJsPath)) return;
      const stat = fs.statSync(taroJsPath);
      if (stat.size !== lastSize) {
        lastSize = stat.size;
        runPatch();
      }
    } catch (_) {}
  };

  setInterval(tick, 800);
};

const main = () => {
  watchTaroJs();

  const args = ["exec", "taro", "build", "--type", "weapp", "--watch"];
  const child = spawn("pnpm", args, {
    stdio: "inherit",
    shell: true,
    env: {
      ...process.env,
      NODE_ENV: process.env.NODE_ENV || "development"
    }
  });

  child.on("exit", (code) => {
    process.exit(code ?? 0);
  });
};

main();

