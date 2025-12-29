import { config } from "../shared/config";

export async function queryOllama(
  files: string[]
): Promise<Record<string, string> | null> {
  try {
    const template = files.reduce((acc, f) => ({ ...acc, [f]: "" }), {});
    const prompt = `Fill in the folder names for each file. Categories like: images, videos, documents, audio, archives, code, etc.

${JSON.stringify(template, null, 2)}

Return the same JSON with folder names filled in. Keep the exact filenames as keys.`;

    const res = await fetch(`${config.ollamaUrl}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: config.model,
        prompt,
        stream: false,
        format: "json",
      }),
    });

    const data = await res.json();
    const result = JSON.parse(data.response);

    const plan: Record<string, string> = {};
    for (const file of files) {
      if (result[file] && typeof result[file] === "string") {
        plan[file] = result[file];
      } else {
        const ext = file.split(".").pop()?.toLowerCase() || "other";
        plan[file] = extToFolder(ext);
      }
    }
    return plan;
  } catch {
    return null;
  }
}

function extToFolder(ext: string): string {
  const map: Record<string, string> = {
    jpg: "images",
    jpeg: "images",
    png: "images",
    gif: "images",
    webp: "images",
    svg: "images",
    mp4: "videos",
    mkv: "videos",
    avi: "videos",
    mov: "videos",
    webm: "videos",
    mp3: "audio",
    wav: "audio",
    flac: "audio",
    ogg: "audio",
    m4a: "audio",
    pdf: "documents",
    doc: "documents",
    docx: "documents",
    txt: "documents",
    rtf: "documents",
    zip: "archives",
    rar: "archives",
    tar: "archives",
    gz: "archives",
    "7z": "archives",
    js: "code",
    ts: "code",
    py: "code",
    java: "code",
    cpp: "code",
    c: "code",
    h: "code",
  };
  return map[ext] || "other";
}
