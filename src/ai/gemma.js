const OLLAMA_API_URL = "http://localhost:11434";
const MODEL_NAME = "gemma3:4b";

let isConnected = false;
let connectionPromise;
let generationQueue = Promise.resolve();

async function fetchOllama(path, options) {
  let response;
  try {
    response = await fetch(`${OLLAMA_API_URL}${path}`, options);
  } catch {
    throw new Error(
      "Could not reach Ollama. Make sure Ollama is running and allows requests from this app.",
    );
  }

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Ollama returned HTTP ${response.status}${detail ? `: ${detail}` : ""}`);
  }

  return response;
}

async function connectToOllama() {
  const response = await fetchOllama("/api/tags");
  const { models } = await response.json();
  const modelIsInstalled = models?.some(
    (model) => model.name === MODEL_NAME || model.name.startsWith(`${MODEL_NAME}:`),
  );

  if (!modelIsInstalled) {
    throw new Error(`The ${MODEL_NAME} model is not installed in Ollama.`);
  }

  isConnected = true;
}

export function loadModel(onProgress) {
  if (isConnected) {
    onProgress?.(1);
    return Promise.resolve();
  }

  if (!connectionPromise) {
    connectionPromise = connectToOllama()
      .then(() => {
        isConnected = true;
        onProgress?.(1);
      })
      .catch((error) => {
        connectionPromise = undefined;
        throw error;
      });
  }

  return connectionPromise;
}

export async function generate(prompt) {
  if (!isConnected) {
    throw new Error("Connect to the local Ollama model before generating advice.");
  }

  const generation = generationQueue.then(async () => {
    const response = await fetchOllama("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL_NAME,
        prompt,
        format: "json",
        stream: false,
      }),
    });
    const result = await response.json();

    if (typeof result.response !== "string" || !result.response.trim()) {
      throw new Error("Ollama returned an empty response.");
    }

    return result.response;
  });

  generationQueue = generation.catch(() => undefined);
  return generation;
}
