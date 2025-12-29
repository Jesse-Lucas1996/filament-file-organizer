import { readdir, mkdir, rename } from "fs/promises";
import { join } from "path";
import { queryOllama } from "./ollama";

type ProgressFn = (msg: string) => void;

export async function organizeFolder(
  dirPath: string,
  dryRun: boolean,
  onProgress?: ProgressFn
) {
  const log = onProgress || (() => {});
  try {
    log("Scanning folder...");
    const entries = await readdir(dirPath, { withFileTypes: true });
    const files = entries.filter((e) => e.isFile()).map((e) => e.name);

    if (files.length === 0) {
      return { success: true, message: "No files to organize" };
    }

    log(`Found ${files.length} files`);
    log("Asking AI for organization plan...");
    const plan = await queryOllama(files);

    if (!plan || Object.keys(plan).length === 0) {
      return {
        success: false,
        message: "Failed to get organization plan from AI",
      };
    }

    log(`AI returned ${Object.keys(plan).length} mappings`);

    const validPlan: Record<string, string> = {};
    for (const [file, folder] of Object.entries(plan)) {
      const cleanFolder = String(folder)
        .trim()
        .replace(/[<>:"|?*\/\\]/g, "-");
      if (!cleanFolder) {
        log(`Skipped: "${file}" (invalid folder)`);
        continue;
      }
      if (!files.includes(file)) {
        log(`Skipped: "${file}" (not found)`);
        continue;
      }
      validPlan[file] = cleanFolder;
    }

    if (Object.keys(validPlan).length === 0) {
      return { success: false, message: "No valid file mappings from AI" };
    }

    if (dryRun) {
      return { success: true, message: "Dry run complete", moves: validPlan };
    }

    const folders = new Set(Object.values(validPlan));
    for (const folder of folders) {
      log(`Creating folder: ${folder}`);
      await mkdir(join(dirPath, folder), { recursive: true });
    }

    for (const [file, folder] of Object.entries(validPlan)) {
      log(`Moving: ${file} → ${folder}`);
      const src = join(dirPath, file);
      const dest = join(dirPath, folder, file);
      await rename(src, dest);
    }

    return {
      success: true,
      message: `Organized ${Object.keys(validPlan).length} files`,
      moves: validPlan,
    };
  } catch (e) {
    return { success: false, message: String(e) };
  }
}
