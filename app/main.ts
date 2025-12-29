import { app, BrowserWindow, ipcMain, dialog } from "electron";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { organizeFolder } from "../agent/organizer";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let win: BrowserWindow | null = null;

app.whenReady().then(() => {
  win = new BrowserWindow({
    width: 600,
    height: 500,
    frame: false,
    transparent: true,
    resizable: false,
    webPreferences: {
      preload: join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });
  win.loadFile(join(__dirname, "index.html"));
});

app.on("window-all-closed", () => app.quit());

ipcMain.handle("select-folder", async () => {
  const result = await dialog.showOpenDialog({ properties: ["openDirectory"] });
  return result.filePaths[0] || null;
});

ipcMain.handle("organize", async (event, path: string, dryRun: boolean) => {
  return organizeFolder(path, dryRun, (msg) => {
    event.sender.send("progress", msg);
  });
});

ipcMain.handle("get-models", async () => {
  try {
    const res = await fetch("http://localhost:11434/api/tags");
    const data = await res.json();
    return data.models?.map((m: { name: string }) => m.name) || [];
  } catch {
    return [];
  }
});

ipcMain.on("set-model", (_, model: string) => {
  process.env.OLLAMA_MODEL = model;
});

ipcMain.on("close", () => app.quit());
ipcMain.on("minimize", () => win?.minimize());
