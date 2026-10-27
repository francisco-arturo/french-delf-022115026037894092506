import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import { extname, resolve, sep } from "node:path";
import { runInNewContext, Script } from "node:vm";

const root = process.cwd();
const passes = [];
const failures = [];

function check(name, condition, detail) {
  if (condition) {
    passes.push(name + (detail ? " (" + detail + ")" : ""));
  } else {
    failures.push(name + (detail ? " (" + detail + ")" : ""));
  }
}

function read(name) {
  try {
    return readFileSync(resolve(root, name), "utf8");
  } catch (error) {
    return "";
  }
}

function fileExists(name) {
  try {
    readFileSync(resolve(root, name));
    return true;
  } catch (error) {
    return false;
  }
}

const requiredFiles = [
  "index.html",
  "styles.css",
  "data.js",
  "app.js",
  "dev-server.mjs",
  "manifest.webmanifest",
  "icon.svg",
  "DEMO.md",
  "README.md"
];
requiredFiles.forEach(function (name) {
  check("required file " + name, fileExists(name));
});

const dataCode = read("data.js");
let data = null;
try {
  const sandbox = { window: {} };
  runInNewContext(dataCode, sandbox, { filename: "data.js" });
  data = sandbox.window.CEDILLE_DATA;
  check("data.js exposes CEDILLE_DATA", Boolean(data));
} catch (error) {
  check("data.js parses", false, error.message);
}

if (data) {
  check("brand is Cedille", data.brand && data.brand.name === "Cedille");
  check("seeded user is a B1 candidate", data.user && data.user.level === "B1");
  check("target is DELF B1", data.user && data.user.target === "DELF B1");
  check("path has at least four modules", Array.isArray(data.path) && data.path.length >= 4);
  check("at least two playable lessons", data.lessons && Object.keys(data.lessons).length >= 2);

  ["cafe", "market"].forEach(function (id) {
    const lesson = data.lessons && data.lessons[id];
    check("lesson " + id + " exists", Boolean(lesson));
    if (!lesson) return;
    check("lesson " + id + " has three parts", Array.isArray(lesson.parts) && lesson.parts.length === 3);
    check("lesson " + id + " starts with vocabulary", lesson.parts[0] && lesson.parts[0].type === "vocab");
    check("lesson " + id + " has four words", lesson.parts[0] && lesson.parts[0].words.length === 4);
    lesson.parts.forEach(function (part, index) {
      if (part.type === "vocab") return;
      check(
        "lesson " + id + " part " + (index + 1) + " answer is in range",
        Number.isInteger(part.answer) && part.answer >= 0 && part.answer < part.options.length
      );
    });
  });

  ["B1", "B2", "C1"].forEach(function (level) {
    const bank = data.exam && data.exam.levels && data.exam.levels[level];
    check("exam bank " + level + " exists", Boolean(bank));
    if (!bank) return;
    check("exam bank " + level + " has six questions", bank.questions.length === 6);
    bank.questions.forEach(function (question, index) {
      check(
        "exam " + level + " question " + (index + 1) + " answer is in range",
        Number.isInteger(question.answer) && question.answer >= 0 && question.answer < question.options.length
      );
      check("exam " + level + " question " + (index + 1) + " has a section", Boolean(question.section));
    });
  });

  check("placement has five questions", data.placement && data.placement.questions.length === 5);
  if (data.placement) {
    data.placement.questions.forEach(function (question, index) {
      check(
        "placement question " + (index + 1) + " answer is in range",
        Number.isInteger(question.answer) && question.answer >= 0 && question.answer < question.options.length
      );
    });
  }
}

try {
  new Script(read("app.js"), { filename: "app.js" });
  check("app.js parses", true);
} catch (error) {
  check("app.js parses", false, error.message);
}

const html = read("index.html");
const css = read("styles.css");
const app = read("app.js");

check("index has a view root", html.includes('id="view"'));
check("index loads data.js before app.js", html.indexOf("data.js") !== -1 && html.indexOf("data.js") < html.indexOf("app.js"));
check("index loads the manifest", html.includes("manifest.webmanifest"));
check("index has mobile viewport metadata", html.includes("width=device-width"));
check("css has a mobile breakpoint", css.includes("@media (max-width: 900px)"));
check("css has a bottom tab bar", css.includes(".tabbar"));
check("app uses speech synthesis", app.includes("speechSynthesis"));
check("app persists progress", app.includes("localStorage"));
check("app has the exam timer", app.includes("exam-timer"));
check("app has the placement flow", app.includes("placement-next"));
check("app supports resetting the demo", app.includes("reset-demo"));

let manifest = null;
try {
  manifest = JSON.parse(read("manifest.webmanifest"));
  check("manifest is valid JSON", true);
  check("manifest is installable", manifest.display === "standalone" && Array.isArray(manifest.icons));
} catch (error) {
  check("manifest is valid JSON", false, error.message);
}

const demo = read("DEMO.md");
check("DEMO records the local URL", demo.includes("http://127.0.0.1:5055"));
check("DEMO records the deploy command", demo.includes("node .harness/deploy.mjs"));

const server = createServer(function (request, response) {
  try {
    const pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
    const requested = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
    const file = resolve(root, requested);
    if (file !== root && !file.startsWith(root + sep)) {
      response.writeHead(403);
      response.end();
      return;
    }
    const body = readFileSync(file);
    const type = {
      ".html": "text/html; charset=utf-8",
      ".css": "text/css; charset=utf-8",
      ".js": "text/javascript; charset=utf-8",
      ".webmanifest": "application/manifest+json; charset=utf-8",
      ".svg": "image/svg+xml"
    }[extname(file).toLowerCase()] || "application/octet-stream";
    response.writeHead(200, { "Content-Type": type });
    response.end(body);
  } catch (error) {
    response.writeHead(error && error.code === "ENOENT" ? 404 : 500);
    response.end();
  }
});

await new Promise(function (resolveReady) {
  server.listen(0, "127.0.0.1", resolveReady);
});

const address = server.address();
const base = "http://127.0.0.1:" + address.port;

try {
  const routes = [
    { path: "/", type: "text/html" },
    { path: "/styles.css", type: "text/css" },
    { path: "/app.js", type: "text/javascript" },
    { path: "/data.js", type: "text/javascript" },
    { path: "/manifest.webmanifest", type: "application/manifest+json" },
    { path: "/icon.svg", type: "image/svg+xml" }
  ];

  for (const route of routes) {
    const response = await fetch(base + route.path);
    check("route " + route.path + " returns 200", response.status === 200, String(response.status));
    const type = response.headers.get("content-type") || "";
    check("route " + route.path + " content type", type.indexOf(route.type) === 0, type);
    const body = await response.text();
    check("route " + route.path + " has content", body.length > 100, body.length + " bytes");
  }

  const home = await (await fetch(base + "/")).text();
  check("served home includes the app shell", home.includes('class="app-shell"'));
  check("served home includes the view root", home.includes('id="view"'));
} finally {
  await new Promise(function (resolveClose) {
    server.close(resolveClose);
  });
}

console.log("Cedille verification");
console.log("====================");
passes.forEach(function (line) {
  console.log("PASS  " + line);
});
if (failures.length) {
  console.log("");
  failures.forEach(function (line) {
    console.log("FAIL  " + line);
  });
}
console.log("");
console.log(passes.length + " checks passed, " + failures.length + " failed.");
if (failures.length) process.exitCode = 1;
