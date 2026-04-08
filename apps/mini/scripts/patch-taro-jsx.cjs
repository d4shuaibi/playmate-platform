const fs = require("fs");
const path = require("path");

const taroJsPath = path.join(process.cwd(), "dist", "taro.js");

const patchExports = (source) => {
  if (!source.includes("exports.jsxRuntimeExports")) {
    return { patched: false, reason: "missing jsxRuntimeExports" };
  }

  if (source.includes("exports.jsx=") || source.includes("exports.jsxs=")) {
    return { patched: false, reason: "already patched" };
  }

  const patch = [
    "",
    ";(() => {",
    "  try {",
    "    const r = exports.jsxRuntimeExports;",
    "    if (r) {",
    "      if (typeof exports.jsx !== 'function') exports.jsx = r.jsx;",
    "      if (typeof exports.jsxs !== 'function') exports.jsxs = r.jsxs;",
    "      if (!exports.Fragment) exports.Fragment = r.Fragment;",
    "    }",
    "  } catch (_) {}",
    "})();",
    ""
  ].join("\n");

  return { patched: true, next: source + patch };
};

const run = () => {
  if (!fs.existsSync(taroJsPath)) {
    console.log(`[patch-taro-jsx] skip: not found: ${taroJsPath}`);
    return;
  }

  const source = fs.readFileSync(taroJsPath, "utf8");
  const result = patchExports(source);
  if (!result.patched) {
    console.log(`[patch-taro-jsx] skip: ${result.reason}`);
    return;
  }

  fs.writeFileSync(taroJsPath, result.next, "utf8");
  console.log("[patch-taro-jsx] patched dist/taro.js exports: jsx/jsxs/Fragment");
};

run();

