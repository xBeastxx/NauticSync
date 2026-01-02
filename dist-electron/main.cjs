var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// electron/services/conflictService.ts
var conflictService_exports = {};
__export(conflictService_exports, {
  ConflictService: () => ConflictService,
  conflictService: () => conflictService
});
var import_fs5, path5, CONFLICT_REGEX, ConflictService, conflictService;
var init_conflictService = __esm({
  "electron/services/conflictService.ts"() {
    import_fs5 = require("fs");
    path5 = __toESM(require("path"), 1);
    CONFLICT_REGEX = /^(.*)\.sync-conflict-(\d{8}-\d{6}-\w+)(\.[^.]+)?$/;
    ConflictService = class {
      async scanFolder(folderPath) {
        const conflicts = [];
        try {
          await this.scanRecursively(folderPath, folderPath, conflicts);
        } catch (error) {
          console.error(`Error scanning for conflicts in ${folderPath}:`, error);
        }
        return conflicts;
      }
      async scanRecursively(currentPath, rootFolder, results) {
        const entries = await import_fs5.promises.readdir(currentPath, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path5.join(currentPath, entry.name);
          if (entry.isDirectory()) {
            if (entry.name === ".stfolder" || entry.name === ".git" || entry.name === "node_modules") continue;
            await this.scanRecursively(fullPath, rootFolder, results);
          } else if (entry.isFile()) {
            if (entry.name.includes(".sync-conflict-")) {
              const match = entry.name.match(CONFLICT_REGEX);
              if (match) {
                try {
                  const originalBase = match[1];
                  const ext = match[3] || "";
                  const originalFilename = originalBase + ext;
                  const originalPath = path5.join(currentPath, originalFilename);
                  const stats = await import_fs5.promises.stat(fullPath);
                  results.push({
                    id: fullPath,
                    path: fullPath,
                    originalPath,
                    filename: originalFilename,
                    // The name of the file it conflicts with
                    folderPath: rootFolder,
                    modificationTime: stats.mtime,
                    size: stats.size,
                    conflictType: "sync-conflict"
                  });
                } catch (err) {
                  console.warn("Failed to process potential conflict file:", fullPath, err);
                }
              }
            }
          }
        }
      }
      async resolveConflict(conflictPath, strategy) {
        const match = path5.basename(conflictPath).match(CONFLICT_REGEX);
        if (!match) throw new Error("Invalid conflict file path");
        if (strategy === "keep-mine") {
          await import_fs5.promises.unlink(conflictPath);
        } else if (strategy === "keep-theirs") {
          const originalBase = match[1];
          const ext = match[3] || "";
          const originalFilename = originalBase + ext;
          const originalPath = path5.join(path5.dirname(conflictPath), originalFilename);
          await import_fs5.promises.rename(conflictPath, originalPath);
        }
      }
    };
    conflictService = new ConflictService();
  }
});

// electron/services/profileService.ts
var profileService_exports = {};
__export(profileService_exports, {
  detectProfile: () => detectProfile,
  detectProfilesForFolders: () => detectProfilesForFolders
});
async function detectProfile(folderPath) {
  try {
    const files = await fs6.promises.readdir(folderPath);
    const fileSet = new Set(files);
    for (const profile of PROFILE_DETECTIONS) {
      for (const detectFile of profile.detectFiles) {
        if (fileSet.has(detectFile)) {
          console.log(`Detected ${profile.id} profile in ${folderPath} (found ${detectFile})`);
          return profile.id;
        }
      }
    }
    return "generic";
  } catch (error) {
    console.error(`Error detecting profile for ${folderPath}:`, error);
    return "generic";
  }
}
async function detectProfilesForFolders(folderPaths) {
  const results = {};
  for (const folderPath of folderPaths) {
    results[folderPath] = await detectProfile(folderPath);
  }
  return results;
}
var fs6, PROFILE_DETECTIONS;
var init_profileService = __esm({
  "electron/services/profileService.ts"() {
    fs6 = __toESM(require("fs"), 1);
    PROFILE_DETECTIONS = [
      { id: "node", detectFiles: ["package.json"] },
      { id: "python", detectFiles: ["requirements.txt", "pyproject.toml", "setup.py", "Pipfile"] },
      { id: "rust", detectFiles: ["Cargo.toml"] },
      { id: "go", detectFiles: ["go.mod"] }
    ];
  }
});

// electron/services/ignoreParser.ts
var ignoreParser_exports = {};
__export(ignoreParser_exports, {
  applyProfileIgnores: () => applyProfileIgnores,
  convertToStignore: () => convertToStignore,
  getStignore: () => getStignore,
  importGitignore: () => importGitignore,
  mergeIgnores: () => mergeIgnores,
  parseGitignore: () => parseGitignore,
  writeStignore: () => writeStignore
});
async function parseGitignore(folderPath) {
  const gitignorePath = path6.join(folderPath, ".gitignore");
  try {
    const content = await fs7.promises.readFile(gitignorePath, "utf-8");
    return content.split("\n").map((line) => line.trim()).filter((line) => line && !line.startsWith("#"));
  } catch {
    return [];
  }
}
function convertToStignore(patterns) {
  return patterns.filter((p) => !p.startsWith("!")).map((pattern) => {
    return pattern;
  });
}
async function getStignore(folderPath) {
  const stignorePath = path6.join(folderPath, ".stignore");
  try {
    const content = await fs7.promises.readFile(stignorePath, "utf-8");
    return content.split("\n").map((line) => line.trim()).filter((line) => line && !line.startsWith("//"));
  } catch {
    return [];
  }
}
async function writeStignore(folderPath, patterns) {
  const stignorePath = path6.join(folderPath, ".stignore");
  const header = "// Auto-generated by SyncMaster\n// https://docs.syncthing.net/users/ignoring.html\n\n";
  const content = header + patterns.join("\n") + "\n";
  await fs7.promises.writeFile(stignorePath, content, "utf-8");
}
async function mergeIgnores(folderPath, additionalPatterns) {
  const existing = await getStignore(folderPath);
  const converted = convertToStignore(additionalPatterns);
  const combined = [.../* @__PURE__ */ new Set([...existing, ...converted])];
  await writeStignore(folderPath, combined);
  return combined;
}
async function importGitignore(folderPath) {
  const gitPatterns = await parseGitignore(folderPath);
  if (gitPatterns.length === 0) {
    return { imported: 0, total: 0 };
  }
  const merged = await mergeIgnores(folderPath, gitPatterns);
  return { imported: gitPatterns.length, total: merged.length };
}
async function applyProfileIgnores(folderPath, patterns) {
  const merged = await mergeIgnores(folderPath, patterns);
  return { applied: patterns.length, total: merged.length };
}
var fs7, path6;
var init_ignoreParser = __esm({
  "electron/services/ignoreParser.ts"() {
    fs7 = __toESM(require("fs"), 1);
    path6 = __toESM(require("path"), 1);
  }
});

// electron/services/mediaService.ts
var mediaService_exports = {};
__export(mediaService_exports, {
  findDuplicates: () => findDuplicates,
  hashFile: () => hashFile,
  scanMediaFiles: () => scanMediaFiles
});
async function scanMediaFiles(folderPath, ignorePatterns = []) {
  const results = [];
  async function scan(dir) {
    try {
      const entries = await fs8.promises.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path7.join(dir, entry.name);
        const relativePath = path7.relative(folderPath, fullPath);
        if (entry.name.startsWith(".") || entry.name === "node_modules" || entry.name === "__pycache__") {
          continue;
        }
        let isIgnored = false;
        try {
          const normalizedPath = relativePath.split(path7.sep).join("/");
          isIgnored = ignorePatterns.some((pattern) => {
            return minimatch(normalizedPath, pattern, { dot: true, matchBase: true });
          });
        } catch (err) {
          console.error("Error checking ignore pattern:", err);
        }
        if (entry.isDirectory()) {
          await scan(fullPath);
        } else if (entry.isFile()) {
          const ext = path7.extname(entry.name).toLowerCase();
          let type = null;
          if (IMAGE_EXTENSIONS.includes(ext)) {
            type = "image";
          } else if (VIDEO_EXTENSIONS.includes(ext)) {
            type = "video";
          }
          if (type) {
            try {
              const stats = await fs8.promises.stat(fullPath);
              results.push({
                id: Buffer.from(fullPath).toString("base64"),
                path: fullPath,
                name: entry.name,
                type,
                extension: ext,
                size: stats.size,
                modifiedTime: stats.mtime,
                isIgnored
                // Now correctly populated
              });
            } catch {
            }
          }
        }
      }
    } catch (error) {
      console.error(`Error scanning ${dir}:`, error);
    }
  }
  await scan(folderPath);
  return results;
}
async function hashFile(filePath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash("md5");
    const stream = fs8.createReadStream(filePath);
    stream.on("data", (data) => hash.update(data));
    stream.on("end", () => resolve(hash.digest("hex")));
    stream.on("error", reject);
  });
}
async function findDuplicates(files) {
  const hashMap = /* @__PURE__ */ new Map();
  for (const file of files) {
    try {
      const hash = await hashFile(file.path);
      if (!hashMap.has(hash)) {
        hashMap.set(hash, []);
      }
      hashMap.get(hash).push(file);
    } catch (error) {
      console.error(`Error hashing ${file.path}:`, error);
    }
  }
  const duplicates = /* @__PURE__ */ new Map();
  for (const [hash, files2] of hashMap) {
    if (files2.length > 1) {
      duplicates.set(hash, files2);
    }
  }
  return duplicates;
}
var fs8, path7, crypto, minimatch, IMAGE_EXTENSIONS, VIDEO_EXTENSIONS;
var init_mediaService = __esm({
  "electron/services/mediaService.ts"() {
    fs8 = __toESM(require("fs"), 1);
    path7 = __toESM(require("path"), 1);
    crypto = __toESM(require("crypto"), 1);
    ({ minimatch } = require("minimatch"));
    IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp", ".svg", ".ico"];
    VIDEO_EXTENSIONS = [".mp4", ".webm", ".mov", ".avi", ".mkv", ".wmv", ".flv"];
  }
});

// electron/services/backupService.ts
var backupService_exports = {};
__export(backupService_exports, {
  getFileHistory: () => getFileHistory,
  getVersionedFiles: () => getVersionedFiles,
  moveToVersions: () => moveToVersions,
  restoreVersion: () => restoreVersion
});
function parseVersionTimestamp(filename) {
  const match = filename.match(VERSION_PATTERN);
  if (!match) return null;
  const [, baseName, timestampStr, ext = ""] = match;
  const year = parseInt(timestampStr.slice(0, 4));
  const month = parseInt(timestampStr.slice(4, 6)) - 1;
  const day = parseInt(timestampStr.slice(6, 8));
  const hour = parseInt(timestampStr.slice(9, 11));
  const minute = parseInt(timestampStr.slice(11, 13));
  const second = parseInt(timestampStr.slice(13, 15));
  return {
    originalName: baseName + ext,
    timestamp: new Date(year, month, day, hour, minute, second)
  };
}
async function getVersionedFiles(folderPath) {
  const versionsPath = path8.join(folderPath, ".stversions");
  const results = [];
  async function scan(dir, relativePath = "") {
    try {
      const entries = await fs9.promises.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path8.join(dir, entry.name);
        const relPath = path8.join(relativePath, entry.name);
        if (entry.isDirectory()) {
          await scan(fullPath, relPath);
        } else if (entry.isFile()) {
          const parsed = parseVersionTimestamp(entry.name);
          if (parsed) {
            try {
              const stats = await fs9.promises.stat(fullPath);
              results.push({
                id: Buffer.from(fullPath).toString("base64"),
                originalName: parsed.originalName,
                originalPath: path8.join(folderPath, relativePath, parsed.originalName),
                versionPath: fullPath,
                timestamp: parsed.timestamp,
                size: stats.size
              });
            } catch {
            }
          }
        }
      }
    } catch (error) {
      console.log(`No versions folder at ${dir}`);
    }
  }
  await scan(versionsPath);
  results.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  return results;
}
async function restoreVersion(versionPath, originalPath) {
  try {
    const stats = await fs9.promises.stat(originalPath);
    if (stats.isFile()) {
      const backupPath = originalPath + ".backup";
      await fs9.promises.copyFile(originalPath, backupPath);
    }
  } catch {
  }
  await fs9.promises.copyFile(versionPath, originalPath);
}
async function getFileHistory(folderPath, fileName) {
  const allVersions = await getVersionedFiles(folderPath);
  return allVersions.filter((v) => v.originalName === fileName);
}
function generateVersionTimestamp() {
  const now = /* @__PURE__ */ new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");
  return `${year}${month}${day}-${hours}${minutes}${seconds}`;
}
async function moveToVersions(filePath, folderPath) {
  const relativePath = path8.relative(folderPath, filePath);
  const dirName = path8.dirname(relativePath);
  const fileName = path8.basename(filePath);
  const ext = path8.extname(fileName);
  const baseName = path8.basename(fileName, ext);
  const timestamp = generateVersionTimestamp();
  const versionedName = `${baseName}~${timestamp}${ext}`;
  const versionsDir = path8.join(folderPath, ".stversions", dirName);
  await fs9.promises.mkdir(versionsDir, { recursive: true });
  const versionPath = path8.join(versionsDir, versionedName);
  await fs9.promises.copyFile(filePath, versionPath);
  console.log(`Backed up ${filePath} to ${versionPath}`);
  await fs9.promises.unlink(filePath);
}
var fs9, path8, VERSION_PATTERN;
var init_backupService = __esm({
  "electron/services/backupService.ts"() {
    fs9 = __toESM(require("fs"), 1);
    path8 = __toESM(require("path"), 1);
    VERSION_PATTERN = /^(.+)~(\d{8}-\d{6})(\.[^.]+)?$/;
  }
});

// electron/main.ts
var import_electron3 = require("electron");
var import_path5 = __toESM(require("path"), 1);

// electron/services/installer.ts
var import_fs = __toESM(require("fs"), 1);
var import_path = __toESM(require("path"), 1);
var import_axios = __toESM(require("axios"), 1);
var import_adm_zip = __toESM(require("adm-zip"), 1);
var import_electron = require("electron");
var SYNCTHING_VERSION = "v1.27.2";
var PLATFORM = "windows-amd64";
var BINARY_NAME = "syncthing.exe";
var DOWNLOAD_URL = `https://github.com/syncthing/syncthing/releases/download/${SYNCTHING_VERSION}/syncthing-${PLATFORM}-${SYNCTHING_VERSION}.zip`;
var SyncthingInstaller = class {
  binDir;
  exePath;
  constructor() {
    this.binDir = import_path.default.join(import_electron.app.getPath("userData"), "bin");
    this.exePath = import_path.default.join(this.binDir, BINARY_NAME);
  }
  async ensureInstalled() {
    if (this.isInstalled()) {
      console.log("Syncthing binary found at:", this.exePath);
      return this.exePath;
    }
    console.log("Syncthing binary not found. Starting download...");
    await this.downloadAndExtract();
    return this.exePath;
  }
  isInstalled() {
    return import_fs.default.existsSync(this.exePath);
  }
  async downloadAndExtract() {
    if (!import_fs.default.existsSync(this.binDir)) {
      import_fs.default.mkdirSync(this.binDir, { recursive: true });
    }
    const zipPath = import_path.default.join(this.binDir, "syncthing.zip");
    try {
      console.log(`Downloading from ${DOWNLOAD_URL}...`);
      const response = await (0, import_axios.default)({
        url: DOWNLOAD_URL,
        method: "GET",
        responseType: "arraybuffer"
      });
      import_fs.default.writeFileSync(zipPath, response.data);
      console.log("Download complete.");
      console.log("Extracting...");
      const zip = new import_adm_zip.default(zipPath);
      const zipEntries = zip.getEntries();
      zipEntries.forEach((entry) => {
        if (entry.entryName.endsWith(BINARY_NAME)) {
          const buffer = entry.getData();
          import_fs.default.writeFileSync(this.exePath, buffer);
        }
      });
      console.log("Extraction complete.");
      import_fs.default.unlinkSync(zipPath);
    } catch (error) {
      console.error("Failed to download syncthing:", error);
      throw error;
    }
  }
  getBinaryPath() {
    return this.exePath;
  }
};

// electron/services/runner.ts
var import_child_process = require("child_process");
var import_path2 = __toESM(require("path"), 1);
var import_electron2 = require("electron");
var import_fs2 = __toESM(require("fs"), 1);
var SyncthingRunner = class {
  child = null;
  binPath;
  apiKey = null;
  guiUrl = null;
  // Default config folder for syncthing
  configDir;
  constructor(binPath) {
    this.binPath = binPath;
    this.configDir = import_path2.default.join(import_electron2.app.getPath("userData"), "syncthing-config");
  }
  start() {
    return new Promise((resolve, reject) => {
      var _a, _b;
      console.log("Starting Syncthing from:", this.binPath);
      if (!import_fs2.default.existsSync(this.configDir)) {
        import_fs2.default.mkdirSync(this.configDir, { recursive: true });
      }
      this.readConfig();
      this.child = (0, import_child_process.spawn)(this.binPath, ["-home", this.configDir, "-no-browser", "-no-restart"], {
        stdio: "pipe"
      });
      this.child.on("error", (err) => {
        console.error("Syncthing process error:", err);
        reject(err);
      });
      (_a = this.child.stdout) == null ? void 0 : _a.on("data", (data) => {
        const output = data.toString();
        console.log("[Syncthing]", output.trim());
        if (output.includes("Ready to synchronize") || output.includes("is another Syncthing instance already running")) {
          this.readConfig();
          resolve();
        }
      });
      (_b = this.child.stderr) == null ? void 0 : _b.on("data", (data) => {
        console.error("[Syncthing Error]", data.toString());
      });
    });
  }
  stop() {
    if (this.child) {
      console.log("Stopping Syncthing...");
      this.child.kill();
      this.child = null;
    }
  }
  readConfig() {
    try {
      const configPath = import_path2.default.join(this.configDir, "config.xml");
      if (import_fs2.default.existsSync(configPath)) {
        const xml = import_fs2.default.readFileSync(configPath, "utf-8");
        const match = xml.match(/<apikey>(.*?)<\/apikey>/);
        if (match) {
          this.apiKey = match[1];
          console.log("Detected API Key:", this.apiKey);
        }
        const guiMatch = xml.match(/<gui[^>]*>[\s\S]*?<address>(.*?)<\/address>[\s\S]*?<\/gui>/);
        if (guiMatch) {
          this.guiUrl = "http://" + guiMatch[1];
        } else {
          const addrMatch = xml.match(/<address>([0-9.:]+)<\/address>/);
          if (addrMatch) {
            this.guiUrl = "http://" + addrMatch[1];
          }
        }
      }
    } catch (err) {
      console.error("Failed to read config.xml", err);
    }
  }
  getApiKey() {
    return this.apiKey;
  }
  getUrl() {
    return this.guiUrl || "http://127.0.0.1:8384";
  }
};

// electron/services/filesystem.ts
var import_fs3 = __toESM(require("fs"), 1);
var import_path3 = __toESM(require("path"), 1);
var FileSystemService = class {
  async readDirectory(dirPath) {
    try {
      if (!import_fs3.default.existsSync(dirPath)) {
        throw new Error(`Directory not found: ${dirPath}`);
      }
      const items = await import_fs3.default.promises.readdir(dirPath, { withFileTypes: true });
      const entries = items.map((item) => ({
        name: item.name,
        path: import_path3.default.join(dirPath, item.name),
        isDirectory: item.isDirectory()
      }));
      entries.sort((a, b) => {
        if (a.isDirectory === b.isDirectory) {
          return a.name.localeCompare(b.name);
        }
        return a.isDirectory ? -1 : 1;
      });
      return entries;
    } catch (error) {
      console.error("Failed to read directory:", error);
      throw error;
    }
  }
};

// electron/services/git.ts
var import_isomorphic_git = __toESM(require("isomorphic-git"), 1);
var import_fs4 = __toESM(require("fs"), 1);
var import_path4 = __toESM(require("path"), 1);
var GitService = class {
  async getStatus(repoPath) {
    try {
      const files = await import_isomorphic_git.default.statusMatrix({ fs: import_fs4.default, dir: repoPath });
      const entries = files.map((row) => {
        const [filepath, head, workdir, stage] = row;
        let status = "unmodified";
        if (head === 1 && workdir === 0) status = "deleted";
        if (head === 0 && workdir === 1) status = "untracked";
        if (head === 1 && workdir === 2) status = "modified";
        if (stage === 1 && head === 1 && workdir === 2) status = "*modified";
        if (stage === 1 && head === 0 && workdir === 1) status = "added";
        return { path: filepath, status };
      }).filter((f) => f.status !== "unmodified");
      return entries;
    } catch (error) {
      if (error.code === "ENOENT") {
        return [];
      }
      throw error;
    }
  }
  async initRepo(repoPath) {
    await import_isomorphic_git.default.init({ fs: import_fs4.default, dir: repoPath });
  }
  async addToStage(repoPath, filepath) {
    await import_isomorphic_git.default.add({ fs: import_fs4.default, dir: repoPath, filepath });
  }
  async removeFromStage(repoPath, filepath) {
    await import_isomorphic_git.default.resetIndex({ fs: import_fs4.default, dir: repoPath, filepath });
  }
  async commitChanges(repoPath, message, author) {
    await import_isomorphic_git.default.commit({
      fs: import_fs4.default,
      dir: repoPath,
      message,
      author
    });
  }
  async getBranches(repoPath) {
    try {
      return await import_isomorphic_git.default.listBranches({ fs: import_fs4.default, dir: repoPath });
    } catch (error) {
      return [];
    }
  }
  async getLog(repoPath, depth = 20) {
    try {
      const commits = await import_isomorphic_git.default.log({ fs: import_fs4.default, dir: repoPath, depth });
      return commits.map((c) => ({
        oid: c.oid,
        message: c.commit.message,
        author: c.commit.author.name,
        timestamp: c.commit.author.timestamp,
        parent: c.commit.parent
      }));
    } catch (error) {
      return [];
    }
  }
  // Fetch logs from all local branches to build a complete graph
  async getGraphData(repoPath, depth = 50) {
    try {
      const branches = await import_isomorphic_git.default.listBranches({ fs: import_fs4.default, dir: repoPath });
      let allCommits = /* @__PURE__ */ new Map();
      for (const branch of branches) {
        try {
          const commits = await import_isomorphic_git.default.log({ fs: import_fs4.default, dir: repoPath, ref: branch, depth });
          for (let i = 0; i < commits.length; i++) {
            const c = commits[i];
            if (!allCommits.has(c.oid)) {
              allCommits.set(c.oid, {
                oid: c.oid,
                message: c.commit.message,
                author: c.commit.author.name,
                timestamp: c.commit.author.timestamp,
                parents: c.commit.parent,
                refs: i === 0 ? [branch] : []
                // Only tag the tip
              });
            } else {
              if (i === 0) {
                const existing = allCommits.get(c.oid);
                if (!existing.refs.includes(branch)) {
                  existing.refs.push(branch);
                }
              }
            }
          }
        } catch (e) {
        }
      }
      return Array.from(allCommits.values()).sort((a, b) => b.timestamp - a.timestamp);
    } catch (error) {
      console.error("Graph data error:", error);
      return [];
    }
  }
  // --- Decentralized Remote Logic ---
  async ensureRemote(repoPath) {
    const remotePath = import_path4.default.join(repoPath, ".megasync", "git-remote");
    try {
      await import_fs4.default.promises.mkdir(remotePath, { recursive: true });
      try {
        await import_isomorphic_git.default.resolveRef({ fs: import_fs4.default, dir: remotePath, ref: "HEAD" });
      } catch (e) {
        await import_isomorphic_git.default.init({ fs: import_fs4.default, dir: remotePath, bare: true });
      }
      try {
        await import_isomorphic_git.default.deleteRemote({ fs: import_fs4.default, dir: repoPath, remote: "origin" });
      } catch (e) {
      }
      await import_isomorphic_git.default.addRemote({ fs: import_fs4.default, dir: repoPath, remote: "origin", url: remotePath });
      return remotePath;
    } catch (err) {
      console.error("Failed to ensure remote:", err);
      throw err;
    }
  }
  async pushToRemote(repoPath) {
    await this.ensureRemote(repoPath);
    await import_isomorphic_git.default.push({
      fs: import_fs4.default,
      dir: repoPath,
      remote: "origin",
      ref: "master",
      // TODO: Make dynamic based on current branch
      force: false
    });
  }
  async pullFromRemote(repoPath) {
    await this.ensureRemote(repoPath);
    await import_isomorphic_git.default.pull({
      fs: import_fs4.default,
      dir: repoPath,
      remote: "origin",
      ref: "master",
      singleBranch: true,
      author: { name: "MegaSync", email: "user@megasync.local" }
    });
  }
};

// electron/services/github.ts
var import_rest = require("@octokit/rest");
var GitHubService = class {
  octokit = null;
  store = null;
  // Dynamically loaded
  constructor() {
  }
  async init() {
    const { default: Store } = await import("electron-store");
    this.store = new Store({
      name: "github-config",
      defaults: { token: null }
    });
    const existingToken = this.store.get("token");
    if (existingToken) {
      this.initializeClient(existingToken);
    }
  }
  initializeClient(token) {
    this.octokit = new import_rest.Octokit({ auth: token });
  }
  async login(token) {
    try {
      const octokit = new import_rest.Octokit({ auth: token });
      const { data: user } = await octokit.users.getAuthenticated();
      this.store.set("token", token);
      this.octokit = octokit;
      return user;
    } catch (error) {
      console.error("GitHub Login Failed:", error);
      throw new Error("Invalid Token or Network Error");
    }
  }
  async logout() {
    this.store.delete("token");
    this.octokit = null;
  }
  async getUser() {
    if (!this.octokit) return null;
    try {
      const { data } = await this.octokit.users.getAuthenticated();
      return data;
    } catch (error) {
      console.error("Failed to get user:", error);
      return null;
    }
  }
  async getRepos(page = 1, perPage = 30) {
    if (!this.octokit) throw new Error("Not authenticated");
    try {
      const { data } = await this.octokit.repos.listForAuthenticatedUser({
        sort: "updated",
        per_page: perPage,
        page,
        affiliation: "owner,collaborator,organization_member"
      });
      return data;
    } catch (error) {
      throw error;
    }
  }
  async getRepoContents(owner, repo, path10 = "") {
    if (!this.octokit) throw new Error("Not authenticated");
    try {
      const { data } = await this.octokit.repos.getContent({
        owner,
        repo,
        path: path10
      });
      return data;
    } catch (error) {
      console.error("Failed to fetch contents:", error);
      throw error;
    }
  }
  async downloadFile(url, targetPath) {
    try {
      const axios2 = await import("axios");
      const fs10 = await import("fs");
      const response = await axios2.default({
        url,
        method: "GET",
        responseType: "stream"
      });
      const writer = fs10.createWriteStream(targetPath);
      response.data.pipe(writer);
      return new Promise((resolve, reject) => {
        writer.on("finish", resolve);
        writer.on("error", reject);
      });
    } catch (error) {
      console.error("Download failed:", error);
      throw error;
    }
  }
};

// electron/main.ts
var mainWindow = null;
var syncRunner = null;
var createWindow = () => {
  mainWindow = new import_electron3.BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: import_path5.default.join(__dirname, "preload.cjs"),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false
      // Allow loading local file:// URLs for media
    },
    frame: false,
    // Custom frame for modern look
    backgroundColor: "#000000",
    show: false
    // Don't show until ready
  });
  const isDev = process.env.NODE_ENV === "development" || !import_electron3.app.isPackaged;
  if (isDev) {
    mainWindow.loadURL("http://localhost:5173");
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(import_path5.default.join(__dirname, "../dist/index.html"));
  }
  mainWindow.once("ready-to-show", () => {
    mainWindow == null ? void 0 : mainWindow.show();
    const installer = new SyncthingInstaller();
    installer.ensureInstalled().then(async (binPath) => {
      console.log("Syncthing binary ready at:", binPath);
      syncRunner = new SyncthingRunner(binPath);
      try {
        await syncRunner.start();
        console.log("Syncthing started successfully");
      } catch (err) {
        console.error("Failed to start Syncthing:", err);
      }
    }).catch((err) => {
      console.error("Failed to install Syncthing:", err);
    });
  });
};
import_electron3.app.on("ready", async () => {
  createWindow();
  const fsService = new FileSystemService();
  const gitService = new GitService();
  const githubService = new GitHubService();
  await githubService.init();
  import_electron3.ipcMain.handle("get-syncthing-config", () => {
    if (!syncRunner) return { apiKey: null, url: null };
    return {
      apiKey: syncRunner.getApiKey(),
      url: syncRunner.getUrl()
    };
  });
  import_electron3.ipcMain.handle("github-login", async (event, token) => {
    return await githubService.login(token);
  });
  import_electron3.ipcMain.handle("github-logout", async () => {
    return await githubService.logout();
  });
  import_electron3.ipcMain.handle("github-user", async () => {
    return await githubService.getUser();
  });
  import_electron3.ipcMain.handle("github-repos", async (event, page, perPage) => {
    return await githubService.getRepos(page, perPage);
  });
  import_electron3.ipcMain.handle("read-directory", async (event, dirPath) => {
    return await fsService.readDirectory(dirPath);
  });
  import_electron3.ipcMain.handle("git-status", async (event, repoPath) => {
    return await gitService.getStatus(repoPath);
  });
  import_electron3.ipcMain.handle("git-log", async (event, repoPath) => {
    return await gitService.getLog(repoPath);
  });
  import_electron3.ipcMain.handle("git-init", async (event, repoPath) => {
    return await gitService.initRepo(repoPath);
  });
  import_electron3.ipcMain.handle("git-stage", async (event, { repoPath, filepath }) => {
    return await gitService.addToStage(repoPath, filepath);
  });
  import_electron3.ipcMain.handle("git-unstage", async (event, { repoPath, filepath }) => {
    return await gitService.removeFromStage(repoPath, filepath);
  });
  import_electron3.ipcMain.handle("git-commit", async (event, { repoPath, message, author }) => {
    return await gitService.commitChanges(repoPath, message, author);
  });
  import_electron3.ipcMain.handle("git-branches", async (event, repoPath) => {
    return await gitService.getBranches(repoPath);
  });
  import_electron3.ipcMain.handle("git-graph-data", async (event, repoPath) => {
    return await gitService.getGraphData(repoPath);
  });
  import_electron3.ipcMain.handle("git-push", async (event, repoPath) => {
    return await gitService.pushToRemote(repoPath);
  });
  import_electron3.ipcMain.handle("git-pull", async (event, repoPath) => {
    return await gitService.pullFromRemote(repoPath);
  });
  import_electron3.ipcMain.handle("get-repo-contents", async (event, { owner, repo, path: path10 }) => {
    return await githubService.getRepoContents(owner, repo, path10);
  });
  import_electron3.ipcMain.handle("download-file", async (event, { url, targetPath }) => {
    return await githubService.downloadFile(url, targetPath);
  });
  import_electron3.ipcMain.handle("scan-conflicts", async (event, folderPath) => {
    const { conflictService: conflictService2 } = await Promise.resolve().then(() => (init_conflictService(), conflictService_exports));
    return await conflictService2.scanFolder(folderPath);
  });
  import_electron3.ipcMain.handle("resolve-conflict", async (event, { conflictPath, strategy }) => {
    const { conflictService: conflictService2 } = await Promise.resolve().then(() => (init_conflictService(), conflictService_exports));
    return await conflictService2.resolveConflict(conflictPath, strategy);
  });
  import_electron3.ipcMain.handle("detect-profile", async (event, folderPath) => {
    const { detectProfile: detectProfile2 } = await Promise.resolve().then(() => (init_profileService(), profileService_exports));
    return await detectProfile2(folderPath);
  });
  import_electron3.ipcMain.handle("import-gitignore", async (event, folderPath) => {
    const { importGitignore: importGitignore2 } = await Promise.resolve().then(() => (init_ignoreParser(), ignoreParser_exports));
    return await importGitignore2(folderPath);
  });
  import_electron3.ipcMain.handle("apply-profile-ignores", async (event, { folderPath, patterns }) => {
    const { applyProfileIgnores: applyProfileIgnores2 } = await Promise.resolve().then(() => (init_ignoreParser(), ignoreParser_exports));
    return await applyProfileIgnores2(folderPath, patterns);
  });
  import_electron3.ipcMain.handle("scan-media", async (event, { folderPath, ignorePatterns }) => {
    const { scanMediaFiles: scanMediaFiles2 } = await Promise.resolve().then(() => (init_mediaService(), mediaService_exports));
    return await scanMediaFiles2(folderPath, ignorePatterns);
  });
  import_electron3.ipcMain.handle("find-duplicates", async (event, folderPath) => {
    const { scanMediaFiles: scanMediaFiles2, findDuplicates: findDuplicates2 } = await Promise.resolve().then(() => (init_mediaService(), mediaService_exports));
    const files = await scanMediaFiles2(folderPath);
    const duplicates = await findDuplicates2(files);
    return Array.from(duplicates.values());
  });
  import_electron3.ipcMain.handle("get-file-versions", async (event, folderPath) => {
    const { getVersionedFiles: getVersionedFiles2 } = await Promise.resolve().then(() => (init_backupService(), backupService_exports));
    return await getVersionedFiles2(folderPath);
  });
  import_electron3.ipcMain.handle("restore-file-version", async (event, { versionPath, originalPath }) => {
    const { restoreVersion: restoreVersion2 } = await Promise.resolve().then(() => (init_backupService(), backupService_exports));
    return await restoreVersion2(versionPath, originalPath);
  });
  import_electron3.ipcMain.handle("delete-file", async (event, filePath) => {
    const fs10 = await import("fs");
    await fs10.promises.unlink(filePath);
  });
  import_electron3.ipcMain.handle("delete-file-with-backup", async (event, { filePath, folderPath }) => {
    const { moveToVersions: moveToVersions2 } = await Promise.resolve().then(() => (init_backupService(), backupService_exports));
    await moveToVersions2(filePath, folderPath);
  });
  import_electron3.ipcMain.handle("close-window", () => {
    mainWindow == null ? void 0 : mainWindow.close();
  });
  import_electron3.ipcMain.handle("open-directory", async () => {
    const { canceled, filePaths } = await import_electron3.dialog.showOpenDialog({
      properties: ["openDirectory"]
    });
    if (canceled) return null;
    return filePaths[0];
  });
});
import_electron3.app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    import_electron3.app.quit();
  }
});
import_electron3.app.on("will-quit", () => {
  if (syncRunner) {
    syncRunner.stop();
  }
});
import_electron3.app.on("activate", () => {
  if (import_electron3.BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
