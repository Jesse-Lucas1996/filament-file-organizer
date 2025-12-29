import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("api", {
  selectFolder: () => ipcRenderer.invoke("select-folder"),
  organize: (path: string, dryRun: boolean) =>
    ipcRenderer.invoke("organize", path, dryRun),
  getModels: () => ipcRenderer.invoke("get-models"),
  setModel: (model: string) => ipcRenderer.send("set-model", model),
  onProgress: (fn: (msg: string) => void) => {
    ipcRenderer.on("progress", (_, msg) => fn(msg));
  },
  close: () => ipcRenderer.send("close"),
  minimize: () => ipcRenderer.send("minimize"),
});
