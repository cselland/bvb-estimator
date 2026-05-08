/**
 * pnpm keeps the real generated client under `.pnpm/.../node_modules/.prisma/client`.
 * Hoisted `node_modules/.prisma/client` can be missing or stale (breaks Next/OpenNext + Prisma).
 */
const fs = require("fs");
const path = require("path");

function getGeneratedPrismaClientDir() {
  const prismaClientPkg = path.dirname(require.resolve("@prisma/client/package.json"));
  const prismaRoot = fs.realpathSync(prismaClientPkg);
  return path.join(prismaRoot, "..", "..", ".prisma", "client");
}

function copyRecursive(src, dest) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.rmSync(dest, { recursive: true, force: true });
  fs.cpSync(src, dest, { recursive: true });
}

function copyEngineArtifacts(srcDir, destDir) {
  fs.mkdirSync(destDir, { recursive: true });
  const files = fs.readdirSync(srcDir);
  const wanted = files.filter(
    (name) =>
      name === "schema.prisma" ||
      name === "query_engine_bg.js" ||
      name === "query_engine_bg.wasm" ||
      name === "wasm-worker-loader.mjs" ||
      name === "wasm-edge-light-loader.mjs" ||
      /^libquery_engine-.*\.(so\.node|dylib\.node)$/.test(name),
  );
  for (const name of wanted) {
    fs.copyFileSync(path.join(srcDir, name), path.join(destDir, name));
  }
}

function findLinuxEngineFile(srcDir) {
  const files = fs.readdirSync(srcDir);
  return files.find((name) => /^libquery_engine-debian-openssl-1\.1\.x\.so\.node$/.test(name)) || null;
}

const src = getGeneratedPrismaClientDir();
if (!fs.existsSync(src)) {
  console.error(`[sync-prisma-client] Run prisma generate first. Missing: ${src}`);
  process.exit(1);
}

const mode = process.argv[2] || "hoist";

if (mode === "hoist") {
  const dest = path.join(__dirname, "..", "node_modules", ".prisma", "client");
  copyRecursive(src, dest);
  console.log(`[sync-prisma-client] hoist -> ${dest}`);
} else if (mode === "opennext") {
  const serverRoot = path.join(
    __dirname,
    "..",
    ".open-next",
    "server-functions",
    "default",
  );
  const dest = path.join(
    serverRoot,
    "node_modules",
    ".prisma",
    "client",
  );
  if (!fs.existsSync(path.dirname(dest))) {
    console.error(`[sync-prisma-client] Run opennextjs-cloudflare build first. Missing: ${path.dirname(dest)}`);
    process.exit(1);
  }
  copyRecursive(src, dest);
  // Some bundlers drop dot-directories; mirror engine artifacts into @prisma/client too.
  const visibleClientPath = path.join(serverRoot, "node_modules", "@prisma", "client");
  if (fs.existsSync(visibleClientPath)) {
    copyEngineArtifacts(src, visibleClientPath);
  }
  const pnpmStoreRoot = path.join(serverRoot, "node_modules", ".pnpm");
  if (fs.existsSync(pnpmStoreRoot)) {
    const entries = fs.readdirSync(pnpmStoreRoot).filter((name) => name.startsWith("@prisma+client@"));
    for (const entry of entries) {
      const pnpmClientPath = path.join(pnpmStoreRoot, entry, "node_modules", "@prisma", "client");
      if (fs.existsSync(pnpmClientPath)) {
        copyEngineArtifacts(src, pnpmClientPath);
      }
    }
  }
  const linuxEngine = findLinuxEngineFile(src);
  if (linuxEngine) {
    fs.copyFileSync(path.join(src, linuxEngine), path.join(serverRoot, linuxEngine));
  }
  console.log(`[sync-prisma-client] opennext -> ${dest}`);
} else {
  console.error("[sync-prisma-client] Usage: node sync-prisma-client.cjs hoist|opennext");
  process.exit(1);
}
