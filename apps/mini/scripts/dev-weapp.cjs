const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

const taroJsPath = path.join(process.cwd(), "dist", "taro.js");
const patchScriptPath = path.join(process.cwd(), "scripts", "patch-taro-jsx.cjs");

let patchInFlight = false;
let patchPending = false;
let patchDebounceTimer = null;

const runPatch = () => {
  if (patchInFlight) {
    patchPending = true;
    return;
  }

  patchInFlight = true;
  patchPending = false;

  try {
    const child = spawn(process.execPath, [patchScriptPath], { stdio: "inherit" });
    child.on("exit", () => {
      patchInFlight = false;
      if (patchPending) {
        runPatch();
      }
    });
  } catch (e) {
    patchInFlight = false;
    console.error("[dev-weapp] patch failed", e);
  }
};

const schedulePatch = () => {
  if (patchDebounceTimer) {
    clearTimeout(patchDebounceTimer);
  }

  patchDebounceTimer = setTimeout(() => {
    patchDebounceTimer = null;
    runPatch();
  }, 300);
};

const watchTaroJs = () => {
  // Avoid aggressive polling: it can trigger DevTools reload loops.
  // Use fs.watch with debounce, and only run one patch at a time.
  const distDir = path.dirname(taroJsPath);

  if (!fs.existsSync(distDir)) {
    return;
  }

  try {
    fs.watch(distDir, { persistent: true }, (_eventType, filename) => {
      if (!filename) return;
      if (String(filename).replace(/\\/g, "/").endsWith("taro.js")) {
        schedulePatch();
      }
    });
  } catch (e) {
    console.error("[dev-weapp] fs.watch failed, fallback to slow polling", e);

    let lastMtimeMs = 0;
    setInterval(() => {
      try {
        if (!fs.existsSync(taroJsPath)) return;
        const stat = fs.statSync(taroJsPath);
        if (stat.mtimeMs !== lastMtimeMs) {
          lastMtimeMs = stat.mtimeMs;
          schedulePatch();
        }
      } catch (_) {}
    }, 2000);
  }
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

