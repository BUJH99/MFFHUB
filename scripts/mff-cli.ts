import { spawn, spawnSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, rmSync, statSync } from "node:fs";
import net from "node:net";
import path from "node:path";
import { pathToFileURL } from "node:url";

type CheckLevel = "ok" | "warn" | "fail";

type Check = {
  level: CheckLevel;
  label: string;
  detail: string;
};

type RunOptions = {
  cwd?: string;
  env?: NodeJS.ProcessEnv;
};

const ROOT = path.resolve(__dirname, "..");
const WEB_DIR = path.join(ROOT, "apps", "web");
const MOBILE_DIR = path.join(ROOT, "apps", "mobile");
const DEFAULT_HOST = process.env.MFF_DEV_HOST || "127.0.0.1";
const DEFAULT_PORT = Number(process.env.MFF_DEV_PORT || 3700);

const TEST_ALIASES: Record<string, string[]> = {
  all: [],
  account: ["packages/account/src/index.test.ts"],
  alliance: [
    "apps/web/src/lib/allianceBattle.test.ts",
    "apps/web/src/components/AllianceBattleSchedule.test.ts",
  ],
  analysis: ["apps/web/src/components/sections/AnalysisSection.test.ts"],
  catalog: ["packages/data/src/catalog.test.ts"],
  "character-db": ["apps/web/src/components/EnhancedCharacterDB.test.ts"],
  "character-names": ["packages/data/src/characterNames.test.ts"],
  "comic-card": ["apps/web/src/lib/comicCardEditor.test.ts"],
  ctp: ["apps/web/src/lib/ctpInventory.test.ts"],
  dashboard: [
    "apps/web/src/components/AccountInsights.test.ts",
    "apps/web/src/components/DashboardTextRemoval.test.ts",
  ],
  db: ["packages/db/src/schema.test.ts"],
  mobile: ["apps/web/src/components/MobileSidebarToggle.test.ts"],
  optimizer: ["packages/core/src/optimizer.test.ts"],
  pvp: ["apps/web/src/components/sections/PvpModeSection.test.ts"],
  record: ["apps/web/src/components/sections/RecordSection.test.ts"],
  sidebar: ["apps/web/src/components/Sidebar.test.ts"],
  "team-up": ["apps/web/src/lib/teamUpEditor.test.ts"],
  tier: [
    "packages/data/src/tierList.test.ts",
    "apps/web/src/lib/tierListResolver.test.ts",
    "apps/web/src/components/sections/TierListSection.test.ts",
  ],
  web: ["apps/web/src"],
  worldboss: [
    "packages/data/src/worldBoss.test.ts",
    "apps/web/src/components/sections/WorldBossSection.test.ts",
  ],
  xsword: ["apps/web/src/lib/xSwordEditor.test.ts"],
};

const MAP_TOPICS: Record<string, { title: string; files: string[]; note?: string }> = {
  nav: {
    title: "Navigation and app shell",
    files: [
      "apps/web/src/lib/navigation.ts",
      "apps/web/src/components/AppShell.tsx",
      "apps/web/src/components/Sidebar.tsx",
      "apps/web/src/components/MobileNav.tsx",
      "apps/web/src/components/layout/Header.tsx",
    ],
  },
  dashboard: {
    title: "Dashboard and account panels",
    files: [
      "apps/web/src/components/sections/DashboardSection.tsx",
      "apps/web/src/components/AccountInsights.tsx",
      "packages/account/src/index.ts",
      "apps/web/src/lib/data.ts",
    ],
  },
  "character-db": {
    title: "Character DB Matrix and My Characters",
    files: [
      "apps/web/src/components/EnhancedCharacterDB.tsx",
      "packages/data/src/catalog.ts",
      "apps/web/src/lib/catalogCharacterPicker.ts",
    ],
    note: "Browser state is stored under localStorage key mff-data-hub:my-character-builds:v1.",
  },
  optimizer: {
    title: "Optimizer, rankings, damage math, roster coverage",
    files: [
      "packages/core/src/optimizer.ts",
      "packages/core/src/optimizer.test.ts",
      "apps/web/src/components/DamageCalculator.tsx",
    ],
  },
  abx: {
    title: "ABX / ABL schedule and rotations",
    files: [
      "apps/web/src/lib/allianceBattle.ts",
      "apps/web/src/components/AllianceBattleSchedule.tsx",
      "supabase/imports/alliance_battle_conditions.csv",
    ],
  },
  pvp: {
    title: "PVP restrictions and mode decks",
    files: [
      "apps/web/src/lib/data.ts",
      "apps/web/src/lib/pvpRestrictions.ts",
      "apps/web/src/components/sections/PvpModeSection.tsx",
    ],
  },
  db: {
    title: "Supabase / Drizzle schema",
    files: [
      "packages/db/src/schema.ts",
      "supabase/schema.sql",
      "drizzle.config.ts",
      ".env.example",
    ],
    note: "Drizzle commands need DATABASE_URL from the shell or root .env.local.",
  },
  sync: {
    title: "THANO$VIB$ sync and generated imports",
    files: [
      "packages/data/scripts/thanosvibs-sync.ts",
      "packages/data/scripts/thanosvibs/config.ts",
      "packages/data/scripts/thanosvibs/output.ts",
      "packages/data/generated/thanosvibs.json",
      "supabase/imports/*.csv",
      "apps/web/public/mff-assets/*",
    ],
  },
  worldboss: {
    title: "World Boss data flow",
    files: [
      "packages/data/scripts/worldboss-sync.ts",
      "packages/data/generated/worldboss.json",
      "packages/data/src/worldBoss.ts",
      "apps/web/src/components/sections/WorldBossSection.tsx",
    ],
  },
  tier: {
    title: "Tier list data and display",
    files: [
      "packages/data/src/tierList.ts",
      "apps/web/src/lib/tierListResolver.ts",
      "apps/web/src/components/sections/TierListSection.tsx",
    ],
  },
  mobile: {
    title: "Future Expo mobile shell",
    files: [
      "apps/mobile/package.json",
      "apps/mobile",
      "packages/types/src/index.ts",
      "packages/core/src/optimizer.ts",
      "packages/account/src/index.ts",
    ],
    note: "Mobile is intentionally outside the root npm workspaces.",
  },
  generated: {
    title: "Generated outputs that should not be hand-edited",
    files: [
      "packages/data/generated/thanosvibs.json",
      "packages/data/generated/worldboss.json",
      "packages/data/generated/debug/*.html",
      "supabase/imports/*.csv",
      "apps/web/public/mff-assets/*",
      "apps/web/out",
    ],
  },
};

function npmCommand(): string {
  return process.platform === "win32" ? "npm.cmd" : "npm";
}

function commandName(name: string): string {
  if (process.platform === "win32" && name === "npm") {
    return "npm.cmd";
  }
  return name;
}

function run(command: string, args: string[], options: RunOptions = {}): Promise<number> {
  return new Promise((resolve) => {
    const resolvedCommand = commandName(command);
    const child = spawn(resolvedCommand, args, {
      cwd: options.cwd ?? ROOT,
      env: { ...process.env, ...(options.env ?? {}) },
      shell: process.platform === "win32" && resolvedCommand.endsWith(".cmd"),
      stdio: "inherit",
      windowsHide: true,
    });

    child.on("error", (error) => {
      console.error(`[mff] Failed to start ${command}: ${error.message}`);
      resolve(1);
    });
    child.on("close", (code) => resolve(code ?? 1));
  });
}

function runNpm(args: string[], options: RunOptions = {}): Promise<number> {
  if (process.env.npm_execpath && existsSync(process.env.npm_execpath)) {
    return run(process.execPath, [process.env.npm_execpath, ...args], options);
  }
  return run("npm", args, options);
}

async function runSequence(steps: Array<{ label: string; args: string[]; cwd?: string; env?: NodeJS.ProcessEnv }>): Promise<number> {
  for (const step of steps) {
    console.log(`\n[mff] ${step.label}`);
    const code = await runNpm(step.args, { cwd: step.cwd, env: step.env });
    if (code !== 0) {
      console.error(`[mff] ${step.label} failed with exit code ${code}.`);
      return code;
    }
  }
  return 0;
}

function hasFlag(args: string[], names: string[]): boolean {
  return args.some((arg) => names.includes(arg));
}

function getOption(args: string[], names: string[], fallback?: string): string | undefined {
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    for (const name of names) {
      if (arg === name) {
        return args[index + 1] ?? fallback;
      }
      if (arg.startsWith(`${name}=`)) {
        return arg.slice(name.length + 1);
      }
    }
  }
  return fallback;
}

function readEnvFile(filePath: string): Record<string, string> {
  if (!existsSync(filePath)) {
    return {};
  }

  const env: Record<string, string> = {};
  const lines = readFileSync(filePath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }
    const equalsIndex = trimmed.indexOf("=");
    if (equalsIndex < 1) {
      continue;
    }
    const key = trimmed.slice(0, equalsIndex).trim();
    let value = trimmed.slice(equalsIndex + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
  return env;
}

function projectEnv(): NodeJS.ProcessEnv {
  const rootEnv = readEnvFile(path.join(ROOT, ".env.local"));
  const webEnv = readEnvFile(path.join(WEB_DIR, ".env.local"));
  return { ...rootEnv, ...webEnv, ...process.env };
}

function resolveEnvValue(key: string): string | undefined {
  const env = projectEnv();
  return env[key];
}

function executablePath(name: string): string | undefined {
  const probe = process.platform === "win32"
    ? spawnSync("where.exe", [name], { encoding: "utf8" })
    : spawnSync("which", [name], { encoding: "utf8" });

  if (probe.status !== 0 || !probe.stdout.trim()) {
    return undefined;
  }
  return probe.stdout.trim().split(/\r?\n/)[0];
}

function getNpmVersion(): string | undefined {
  const userAgentMatch = process.env.npm_config_user_agent?.match(/npm\/([^\s]+)/);
  if (userAgentMatch) {
    return userAgentMatch[1];
  }

  const probe = spawnSync(npmCommand(), ["--version"], {
    encoding: "utf8",
    shell: process.platform === "win32",
  });
  if (probe.status !== 0 || !probe.stdout.trim()) {
    return undefined;
  }
  return probe.stdout.trim();
}

function formatDate(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function safeReadJson(filePath: string): unknown | undefined {
  try {
    return JSON.parse(readFileSync(filePath, "utf8"));
  } catch {
    return undefined;
  }
}

function countValue(value: unknown): number {
  if (Array.isArray(value)) {
    return value.length;
  }
  if (value && typeof value === "object") {
    return 1;
  }
  return value == null ? 0 : 1;
}

function countCsvRows(filePath: string): number {
  if (!existsSync(filePath)) {
    return 0;
  }
  const lines = readFileSync(filePath, "utf8")
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0);
  return Math.max(0, lines.length - 1);
}

function countFilesRecursive(dirPath: string): number {
  if (!existsSync(dirPath)) {
    return 0;
  }
  let count = 0;
  for (const entry of readdirSync(dirPath, { withFileTypes: true })) {
    const entryPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      count += countFilesRecursive(entryPath);
    } else {
      count += 1;
    }
  }
  return count;
}

function dataStatusObject() {
  const thanosPath = path.join(ROOT, "packages", "data", "generated", "thanosvibs.json");
  const worldbossPath = path.join(ROOT, "packages", "data", "generated", "worldboss.json");
  const importsDir = path.join(ROOT, "supabase", "imports");
  const assetsDir = path.join(ROOT, "apps", "web", "public", "mff-assets");
  const debugDir = path.join(ROOT, "packages", "data", "generated", "debug");

  const generated = [thanosPath, worldbossPath]
    .filter((filePath) => existsSync(filePath))
    .map((filePath) => {
      const json = safeReadJson(filePath);
      const counts = json && typeof json === "object"
        ? Object.fromEntries(Object.entries(json as Record<string, unknown>).map(([key, value]) => [key, countValue(value)]))
        : {};
      const stat = statSync(filePath);
      return {
        file: path.relative(ROOT, filePath),
        size: stat.size,
        modified: stat.mtime.toISOString(),
        counts,
      };
    });

  const csv = existsSync(importsDir)
    ? readdirSync(importsDir)
      .filter((name) => name.toLowerCase().endsWith(".csv"))
      .sort()
      .map((name) => {
        const filePath = path.join(importsDir, name);
        const stat = statSync(filePath);
        return {
          file: path.relative(ROOT, filePath),
          rows: countCsvRows(filePath),
          size: stat.size,
          modified: stat.mtime.toISOString(),
        };
      })
    : [];

  const assets = existsSync(assetsDir)
    ? readdirSync(assetsDir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => {
        const dirPath = path.join(assetsDir, entry.name);
        return {
          dir: path.relative(ROOT, dirPath),
          files: countFilesRecursive(dirPath),
        };
      })
    : [];

  const debugFiles = existsSync(debugDir)
    ? readdirSync(debugDir).filter((name) => name.toLowerCase().endsWith(".html")).length
    : 0;

  return { generated, csv, assets, debugFiles };
}

function printDataStatus(asJson: boolean): void {
  const status = dataStatusObject();
  if (asJson) {
    console.log(JSON.stringify(status, null, 2));
    return;
  }

  console.log("[mff] Generated JSON");
  if (status.generated.length === 0) {
    console.log("  none");
  }
  for (const item of status.generated) {
    console.log(`  ${item.file} (${formatBytes(item.size)}, ${formatDate(new Date(item.modified))})`);
    const visibleCounts = Object.entries(item.counts)
      .filter(([, value]) => typeof value === "number")
      .map(([key, value]) => `${key}:${value}`)
      .join(" ");
    if (visibleCounts) {
      console.log(`    ${visibleCounts}`);
    }
  }

  console.log("\n[mff] Supabase CSV imports");
  if (status.csv.length === 0) {
    console.log("  none");
  }
  for (const item of status.csv) {
    console.log(`  ${item.file}: ${item.rows} rows (${formatBytes(item.size)}, ${formatDate(new Date(item.modified))})`);
  }

  console.log("\n[mff] Cached asset files");
  if (status.assets.length === 0) {
    console.log("  none");
  }
  for (const item of status.assets) {
    console.log(`  ${item.dir}: ${item.files}`);
  }
  console.log(`\n[mff] Debug HTML files: ${status.debugFiles}`);
}

function addCheck(checks: Check[], level: CheckLevel, label: string, detail: string): void {
  checks.push({ level, label, detail });
}

async function isPortAvailable(host: string, port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once("error", () => resolve(false));
    server.once("listening", () => {
      server.close(() => resolve(true));
    });
    server.listen(port, host);
  });
}

async function collectDoctorChecks(host: string, port: number): Promise<Check[]> {
  const checks: Check[] = [];
  const npmVersion = getNpmVersion();
  const ffmpeg = executablePath("ffmpeg");
  const nodeModules = path.join(ROOT, "node_modules");
  const rootEnvPath = path.join(ROOT, ".env.local");
  const webEnvPath = path.join(WEB_DIR, ".env.local");
  const packageJson = path.join(ROOT, "package.json");
  const webPackageJson = path.join(WEB_DIR, "package.json");
  const mobilePackageJson = path.join(MOBILE_DIR, "package.json");
  const thanosGenerated = path.join(ROOT, "packages", "data", "generated", "thanosvibs.json");
  const worldbossGenerated = path.join(ROOT, "packages", "data", "generated", "worldboss.json");
  const csvDir = path.join(ROOT, "supabase", "imports");
  const preview = path.join(ROOT, "OPEN_ME_FIRST.html");
  const standalone = path.join(ROOT, "standalone", "index.html");
  const portAvailable = await isPortAvailable(host, port);

  addCheck(checks, existsSync(packageJson) ? "ok" : "fail", "repo root", existsSync(packageJson) ? ROOT : "package.json not found");
  addCheck(checks, "ok", "node", process.version);
  addCheck(
    checks,
    npmVersion ? "ok" : "fail",
    "npm",
    npmVersion ?? "npm not found",
  );
  addCheck(checks, existsSync(nodeModules) ? "ok" : "fail", "dependencies", existsSync(nodeModules) ? "node_modules exists" : "run npm install");
  addCheck(checks, existsSync(webPackageJson) ? "ok" : "fail", "web workspace", existsSync(webPackageJson) ? "apps/web/package.json exists" : "missing apps/web package");
  addCheck(checks, existsSync(mobilePackageJson) ? "ok" : "warn", "mobile shell", existsSync(mobilePackageJson) ? "apps/mobile/package.json exists" : "mobile shell missing");
  addCheck(checks, ffmpeg ? "ok" : "warn", "ffmpeg", ffmpeg ?? "needed for new THANO$VIB$ image asset sync");
  addCheck(checks, portAvailable ? "ok" : "warn", `port ${host}:${port}`, portAvailable ? "available" : "busy or unavailable");
  addCheck(checks, existsSync(rootEnvPath) ? "ok" : "warn", "root .env.local", existsSync(rootEnvPath) ? "present" : "missing; copy .env.example when DB/Supabase is needed");
  addCheck(checks, existsSync(webEnvPath) ? "ok" : "warn", "web .env.local", existsSync(webEnvPath) ? "present" : "optional if root .env.local is used through CLI");

  for (const key of ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "DATABASE_URL", "THANOSVIBS_BASE_URL"]) {
    const value = resolveEnvValue(key);
    addCheck(checks, value ? "ok" : "warn", `env ${key}`, value ? "set" : "not set");
  }

  addCheck(checks, existsSync(thanosGenerated) ? "ok" : "warn", "thanosvibs.json", existsSync(thanosGenerated) ? "present" : "run mff sync thanosvibs");
  addCheck(checks, existsSync(worldbossGenerated) ? "ok" : "warn", "worldboss.json", existsSync(worldbossGenerated) ? "present" : "run mff sync worldboss");
  addCheck(checks, existsSync(csvDir) ? "ok" : "warn", "supabase imports", existsSync(csvDir) ? `${readdirSync(csvDir).filter((name) => name.endsWith(".csv")).length} csv files` : "missing supabase/imports");
  addCheck(checks, existsSync(preview) ? "ok" : "warn", "root preview", existsSync(preview) ? "OPEN_ME_FIRST.html exists" : "missing");
  addCheck(checks, existsSync(standalone) ? "ok" : "warn", "standalone preview", existsSync(standalone) ? "standalone/index.html exists" : "missing");

  return checks;
}

function printChecks(checks: Check[], asJson: boolean): void {
  if (asJson) {
    console.log(JSON.stringify(checks, null, 2));
    return;
  }

  for (const check of checks) {
    const prefix = check.level === "ok" ? "[OK]" : check.level === "warn" ? "[WARN]" : "[FAIL]";
    console.log(`${prefix} ${check.label}: ${check.detail}`);
  }
}

async function commandDoctor(args: string[]): Promise<number> {
  const host = getOption(args, ["--host"], DEFAULT_HOST) ?? DEFAULT_HOST;
  const port = Number(getOption(args, ["--port", "-p"], String(DEFAULT_PORT)));
  const asJson = hasFlag(args, ["--json"]);
  const strict = hasFlag(args, ["--strict"]);
  const checks = await collectDoctorChecks(host, port);
  printChecks(checks, asJson);
  const hasFailure = checks.some((check) => check.level === "fail");
  const hasWarning = checks.some((check) => check.level === "warn");
  return hasFailure || (strict && hasWarning) ? 1 : 0;
}

async function commandDev(args: string[]): Promise<number> {
  const host = getOption(args, ["--host"], DEFAULT_HOST) ?? DEFAULT_HOST;
  const port = Number(getOption(args, ["--port", "-p"], String(DEFAULT_PORT)));
  const shouldOpen = hasFlag(args, ["--open"]);
  if (shouldOpen) {
    openTarget(`http://${host}:${port}`);
  }
  return runNpm(
    ["run", "dev", "-w", "@mff-data-hub/web", "--", "--hostname", host, "-p", String(port)],
    { env: projectEnv() },
  );
}

async function commandCheck(args: string[]): Promise<number> {
  const fast = hasFlag(args, ["--fast"]);
  const full = hasFlag(args, ["--full"]);
  const steps = fast
    ? [
      { label: "typecheck", args: ["run", "typecheck"] },
      { label: "test", args: ["test"] },
    ]
    : [
      { label: "typecheck", args: ["run", "typecheck"] },
      { label: "lint", args: ["run", "lint"] },
      { label: "test", args: ["test"] },
      ...(full ? [{ label: "build", args: ["run", "build"] }] : []),
    ];
  return runSequence(steps);
}

async function commandSync(args: string[]): Promise<number> {
  const target = args.find((arg) => !arg.startsWith("-")) ?? "thanosvibs";
  const skipFfmpegCheck = hasFlag(args, ["--skip-ffmpeg-check"]);
  if ((target === "thanosvibs" || target === "all") && !skipFfmpegCheck && !executablePath("ffmpeg")) {
    console.error("[mff] ffmpeg was not found in PATH. Install ffmpeg or pass --skip-ffmpeg-check.");
    return 1;
  }

  if (target === "thanosvibs") {
    return runNpm(["run", "sync:thanosvibs"], { env: projectEnv() });
  }
  if (target === "worldboss") {
    return runNpm(["run", "sync:worldboss"], { env: projectEnv() });
  }
  if (target === "all") {
    return runSequence([
      { label: "sync:thanosvibs", args: ["run", "sync:thanosvibs"], env: projectEnv() },
      { label: "sync:worldboss", args: ["run", "sync:worldboss"], env: projectEnv() },
    ]);
  }

  console.error(`[mff] Unknown sync target "${target}". Use thanosvibs, worldboss, or all.`);
  return 1;
}

async function commandData(args: string[]): Promise<number> {
  const subcommand = args.find((arg) => !arg.startsWith("-")) ?? "status";
  if (subcommand !== "status") {
    console.error(`[mff] Unknown data command "${subcommand}". Use: mff data status`);
    return 1;
  }
  printDataStatus(hasFlag(args, ["--json"]));
  return 0;
}

async function commandDb(args: string[]): Promise<number> {
  const subcommand = args.find((arg) => !arg.startsWith("-")) ?? "check";
  const env = projectEnv();
  const hasDatabaseUrl = Boolean(env.DATABASE_URL);

  if (subcommand === "check") {
    console.log(hasDatabaseUrl ? "[OK] DATABASE_URL is set." : "[WARN] DATABASE_URL is not set.");
    console.log(existsSync(path.join(ROOT, ".env.local")) ? "[OK] root .env.local exists." : "[WARN] root .env.local is missing.");
    console.log("Schema: packages/db/src/schema.ts");
    console.log("SQL snapshot: supabase/schema.sql");
    return 0;
  }

  if (!hasDatabaseUrl) {
    console.error("[mff] DATABASE_URL is required. Set it in the shell or root .env.local.");
    return 1;
  }

  if (subcommand === "push") {
    return runNpm(["run", "db:push"], { env });
  }
  if (subcommand === "studio") {
    return runNpm(["run", "db:studio"], { env });
  }

  console.error(`[mff] Unknown db command "${subcommand}". Use check, push, or studio.`);
  return 1;
}

async function commandTest(args: string[]): Promise<number> {
  if (hasFlag(args, ["--list"])) {
    console.log(Object.keys(TEST_ALIASES).sort().join("\n"));
    return 0;
  }

  const target = args.find((arg) => !arg.startsWith("-")) ?? "all";
  if (target === "all") {
    return runNpm(["test"]);
  }

  const alias = TEST_ALIASES[target];
  if (alias) {
    return runNpm(["test", "--", ...alias]);
  }

  const candidate = path.resolve(ROOT, target);
  if (existsSync(candidate)) {
    return runNpm(["test", "--", target]);
  }

  console.error(`[mff] Unknown test alias or path "${target}". Run "mff test --list".`);
  return 1;
}

function openTarget(target: string): void {
  if (process.platform === "win32") {
    spawn("cmd", ["/c", "start", "", target], { detached: true, stdio: "ignore" }).unref();
    return;
  }
  if (process.platform === "darwin") {
    spawn("open", [target], { detached: true, stdio: "ignore" }).unref();
    return;
  }
  spawn("xdg-open", [target], { detached: true, stdio: "ignore" }).unref();
}

async function commandOpen(args: string[]): Promise<number> {
  const host = getOption(args, ["--host"], DEFAULT_HOST) ?? DEFAULT_HOST;
  const port = Number(getOption(args, ["--port", "-p"], String(DEFAULT_PORT)));
  openTarget(`http://${host}:${port}`);
  return 0;
}

async function commandPreview(args: string[]): Promise<number> {
  const target = args.find((arg) => !arg.startsWith("-")) ?? "root";
  const previewPath = target === "standalone"
    ? path.join(ROOT, "standalone", "index.html")
    : target === "web"
      ? path.join(WEB_DIR, "OPEN_ME_FIRST.html")
      : path.join(ROOT, "OPEN_ME_FIRST.html");

  if (!existsSync(previewPath)) {
    console.error(`[mff] Preview file not found: ${path.relative(ROOT, previewPath)}`);
    return 1;
  }

  console.log(`[mff] Opening static preview: ${path.relative(ROOT, previewPath)}`);
  openTarget(pathToFileURL(previewPath).href);
  return 0;
}

async function commandMobile(args: string[]): Promise<number> {
  const subcommand = args.find((arg) => !arg.startsWith("-")) ?? "start";
  if (!existsSync(path.join(MOBILE_DIR, "package.json"))) {
    console.error("[mff] apps/mobile/package.json was not found.");
    return 1;
  }

  if (subcommand === "note") {
    return runNpm(["run", "ios:note"]);
  }
  if (subcommand === "install") {
    return runNpm(["install"], { cwd: MOBILE_DIR });
  }
  if (["start", "ios", "android", "typecheck"].includes(subcommand)) {
    return runNpm(["run", subcommand], { cwd: MOBILE_DIR, env: projectEnv() });
  }

  console.error(`[mff] Unknown mobile command "${subcommand}". Use note, install, start, ios, android, or typecheck.`);
  return 1;
}

function assertInsideRoot(targetPath: string): string {
  const resolved = path.resolve(targetPath);
  if (resolved !== ROOT && !resolved.startsWith(`${ROOT}${path.sep}`)) {
    throw new Error(`Refusing to clean outside repo: ${resolved}`);
  }
  return resolved;
}

function cleanTargets(target: string): string[] {
  const targets: string[] = [];
  const debugDir = path.join(ROOT, "packages", "data", "generated", "debug");
  const generatedDir = path.join(ROOT, "packages", "data", "generated");
  const importsDir = path.join(ROOT, "supabase", "imports");
  const assetsDir = path.join(ROOT, "apps", "web", "public", "mff-assets");

  if (target === "debug" || target === "generated") {
    if (existsSync(debugDir)) {
      for (const name of readdirSync(debugDir)) {
        targets.push(path.join(debugDir, name));
      }
    }
  }

  if (target === "generated") {
    for (const name of ["thanosvibs.json", "worldboss.json"]) {
      const filePath = path.join(generatedDir, name);
      if (existsSync(filePath)) {
        targets.push(filePath);
      }
    }
    if (existsSync(importsDir)) {
      for (const name of readdirSync(importsDir).filter((entry) => entry.toLowerCase().endsWith(".csv"))) {
        targets.push(path.join(importsDir, name));
      }
    }
  }

  if (target === "assets") {
    if (existsSync(assetsDir)) {
      for (const name of readdirSync(assetsDir)) {
        targets.push(path.join(assetsDir, name));
      }
    }
  }

  return targets.map(assertInsideRoot);
}

async function commandClean(args: string[]): Promise<number> {
  const target = args.find((arg) => !arg.startsWith("-")) ?? "debug";
  if (!["debug", "generated", "assets"].includes(target)) {
    console.error(`[mff] Unknown clean target "${target}". Use debug, generated, or assets.`);
    return 1;
  }

  const confirmed = hasFlag(args, ["--confirm", "--yes"]);
  const targets = cleanTargets(target);
  if (targets.length === 0) {
    console.log(`[mff] Nothing to clean for ${target}.`);
    return 0;
  }

  console.log(`[mff] ${confirmed ? "Cleaning" : "Dry run for"} ${target}:`);
  for (const filePath of targets) {
    console.log(`  ${path.relative(ROOT, filePath)}`);
  }

  if (!confirmed) {
    console.log("\n[mff] Pass --confirm to delete these files.");
    return 0;
  }

  for (const filePath of targets) {
    rmSync(filePath, { recursive: true, force: true });
  }
  console.log("[mff] Clean complete.");
  return 0;
}

async function commandMap(args: string[]): Promise<number> {
  const topic = args.find((arg) => !arg.startsWith("-")) ?? "all";
  if (topic === "all" || topic === "list") {
    console.log("Available map topics:");
    for (const key of Object.keys(MAP_TOPICS).sort()) {
      console.log(`  ${key} - ${MAP_TOPICS[key].title}`);
    }
    return 0;
  }

  const map = MAP_TOPICS[topic];
  if (!map) {
    console.error(`[mff] Unknown map topic "${topic}". Run "mff map list".`);
    return 1;
  }

  console.log(`[mff] ${map.title}`);
  for (const file of map.files) {
    console.log(`  ${file}`);
  }
  if (map.note) {
    console.log(`\n${map.note}`);
  }
  return 0;
}

function printHelp(): void {
  console.log(`MFF Data Hub CLI

Usage:
  npm run hub -- <command> [options]
  .\\mff.bat <command> [options]

Core:
  doctor [--strict] [--json] [--host 127.0.0.1] [--port 3700]
  dev [--host 127.0.0.1] [--port 3700] [--open]
  open [--host 127.0.0.1] [--port 3700]
  preview [root|web|standalone]
  install
  build
  start [--port 3700]

Validation:
  check [--fast] [--full]
  typecheck
  lint
  test [alias|path|--list]

Data and DB:
  sync [thanosvibs|worldboss|all] [--skip-ffmpeg-check]
  data status [--json]
  db check
  db push
  db studio

Mobile:
  ios note
  mobile [note|install|start|ios|android|typecheck]

Maintenance:
  map [topic|list]
  routes [topic|list]
  clean [debug|generated|assets] [--confirm]
`);
}

async function main(): Promise<number> {
  const [rawCommand, ...args] = process.argv.slice(2);
  const command = rawCommand ?? "help";

  if (["help", "-h", "--help"].includes(command)) {
    printHelp();
    return 0;
  }

  if (command === "doctor" || command === "status") {
    return commandDoctor(args);
  }
  if (command === "dev") {
    return commandDev(args);
  }
  if (command === "install") {
    return runNpm(["install"]);
  }
  if (command === "build") {
    return runNpm(["run", "build"]);
  }
  if (command === "start") {
    const port = getOption(args, ["--port", "-p"]);
    return port
      ? runNpm(["run", "start", "-w", "@mff-data-hub/web", "--", "-p", port], { env: projectEnv() })
      : runNpm(["run", "start"], { env: projectEnv() });
  }
  if (command === "typecheck") {
    return runNpm(["run", "typecheck"]);
  }
  if (command === "lint") {
    return runNpm(["run", "lint"]);
  }
  if (command === "check") {
    return commandCheck(args);
  }
  if (command === "sync") {
    return commandSync(args);
  }
  if (command === "data") {
    return commandData(args);
  }
  if (command === "db") {
    return commandDb(args);
  }
  if (command === "test") {
    return commandTest(args);
  }
  if (command === "open") {
    return commandOpen(args);
  }
  if (command === "preview") {
    return commandPreview(args);
  }
  if (command === "ios") {
    const [subcommand = "note"] = args;
    return commandMobile([subcommand]);
  }
  if (command === "mobile") {
    return commandMobile(args);
  }
  if (command === "clean") {
    return commandClean(args);
  }
  if (command === "map" || command === "routes") {
    return commandMap(args);
  }

  console.error(`[mff] Unknown command "${command}". Run "mff help".`);
  return 1;
}

main()
  .then((code) => {
    process.exitCode = code;
  })
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
