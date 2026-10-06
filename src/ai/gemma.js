import { FilesetResolver, LlmInference } from "@mediapipe/tasks-genai";

// Gemma use is subject to Google's Gemma Terms; users must accept them at the model source.
const MODEL_URL =
  "https://huggingface.co/litert-community/gemma-3-270m-it/resolve/main/gemma3-270m-it-q4_0-web.task";
const WASM_BASE_URL =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-genai@0.10.29/wasm";
const MODEL_CACHE = "naturequest-gemma-270m-v1";

let inferenceTask;
let loadPromise;
let generationQueue = Promise.resolve();

async function getCachedModel(onProgress) {
  const cache = await caches.open(MODEL_CACHE);
  const cachedResponse = await cache.match(MODEL_URL);

  if (cachedResponse) {
    onProgress?.(1);
    if (!cachedResponse.body) {
      throw new Error("The cached AI model is empty.");
    }
    return cachedResponse.body.getReader();
  }

  const response = await fetch(MODEL_URL);
  if (!response.ok) {
    throw new Error(`The model download failed (HTTP ${response.status}).`);
  }
  if (!response.body) {
    throw new Error("This browser cannot stream the AI model download.");
  }

  const total = Number(response.headers.get("content-length")) || 0;
  const reader = response.body.getReader();
  let loaded = 0;
  const progressStream = new ReadableStream({
    async pull(controller) {
      try {
        const { done, value } = await reader.read();
        if (done) {
          controller.close();
          return;
        }

        loaded += value.byteLength;
        onProgress?.(total ? Math.min(loaded / total, 1) : null);
        controller.enqueue(value);
      } catch (error) {
        controller.error(error);
      }
    },
    cancel(reason) {
      return reader.cancel(reason);
    },
  });

  await cache.put(
    MODEL_URL,
    new Response(progressStream, {
      headers: response.headers,
      status: response.status,
      statusText: response.statusText,
    }),
  );

  const downloadedModel = await cache.match(MODEL_URL);
  if (!downloadedModel?.body) {
    throw new Error("The downloaded AI model could not be read from browser storage.");
  }
  return downloadedModel.body.getReader();
}

async function initializeModel(onProgress) {
  if (!navigator.gpu) {
    throw new Error("WebGPU is not available in this browser.");
  }

  const adapter = await navigator.gpu.requestAdapter();
  if (!adapter) {
    throw new Error("This device does not have a compatible WebGPU adapter.");
  }

  const modelReader = await getCachedModel(onProgress);
  const wasmFiles = await FilesetResolver.forGenAiTasks(WASM_BASE_URL);
  const task = await LlmInference.createFromModelBuffer(wasmFiles, modelReader);
  onProgress?.(1);
  return task;
}

export function loadModel(onProgress) {
  if (inferenceTask) {
    onProgress?.(1);
    return Promise.resolve(inferenceTask);
  }

  if (!loadPromise) {
    loadPromise = initializeModel(onProgress)
      .then((task) => {
        inferenceTask = task;
        return task;
      })
      .catch((error) => {
        loadPromise = undefined;
        throw error;
      });
  }

  return loadPromise;
}

export async function generate(prompt) {
  if (!inferenceTask) {
    throw new Error("The Gemma model is not loaded.");
  }

  const task = inferenceTask;
  const generation = generationQueue.then(() => task.generateResponse(prompt));
  generationQueue = generation.catch(() => undefined);
  return generation;
}
