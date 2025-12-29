declare const api: {
  selectFolder: () => Promise<string | null>;
  organize: (
    path: string,
    dryRun: boolean
  ) => Promise<{
    success: boolean;
    message: string;
    moves?: Record<string, string>;
  }>;
  getModels: () => Promise<string[]>;
  setModel: (model: string) => void;
  onProgress: (fn: (msg: string) => void) => void;
  close: () => void;
  minimize: () => void;
};

const $ = (s: string) => document.querySelector(s)!;

(async () => {
  const select = $("#model") as HTMLSelectElement;
  const models = await api.getModels();
  if (models.length === 0) {
    select.innerHTML = "<option>No models found</option>";
  } else {
    select.innerHTML = models
      .map((m) => `<option value="${m}">${m}</option>`)
      .join("");
    api.setModel(models[0]!);
  }
  select.addEventListener("change", () => api.setModel(select.value));
})();

$("#close").addEventListener("click", () => api.close());
$("#min").addEventListener("click", () => api.minimize());

$("#browse").addEventListener("click", async () => {
  const folder = await api.selectFolder();
  if (folder) ($("#path") as HTMLInputElement).value = folder;
});

api.onProgress((msg) => {
  const output = $("#output");
  output.innerHTML += `<span class="info">${msg}</span>\n`;
  output.scrollTop = output.scrollHeight;
});

$("#organize").addEventListener("click", async () => {
  const path = ($("#path") as HTMLInputElement).value;
  if (!path) return;
  const dryRun = ($("#dryrun") as HTMLInputElement).checked;
  const output = $("#output");
  output.className = "visible";
  output.innerHTML = "";

  try {
    const result = await api.organize(path, dryRun);
    if (result.success) {
      output.innerHTML = `<span class="success">${result.message}</span>`;
      if (result.moves) {
        output.innerHTML +=
          "\n\n" +
          Object.entries(result.moves)
            .map(
              ([file, folder]) =>
                `<span class="info">${file}</span> → ${folder}`
            )
            .join("\n");
      }
    } else {
      output.innerHTML = `<span class="error">${result.message}</span>`;
    }
  } catch (e) {
    output.innerHTML = `<span class="error">Error: ${e}</span>`;
  }
});
