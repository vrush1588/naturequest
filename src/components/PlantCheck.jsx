import { useEffect, useState } from "react";
import { analyzeImage } from "../ai/gemma.js";
import { resizeImageToDataUrl } from "../utils/image.js";

const ANALYSIS_PROMPT =
  `You are a friendly plant helper. Look at this photo. Reply with JSON only, no extra text: {"plant": "likely name or 'not sure'", "about": "one short sentence", "issues": ["visible problems, or empty list"], "tip": "one sentence, max 20 words, specific to what is visible in the photo (flowers, leaf color, spots, growth); do not give generic advice like 'give it sunlight'", "confidence": "low|medium|high"}. Never claim certainty.`;
const ANALYSIS_ERROR = "Could not analyze this photo. Try a clearer, closer photo.";

function parseAnalysis(response) {
  try {
    const jsonText = response
      .trim()
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/, "");
    const result = JSON.parse(jsonText);

    if (
      typeof result.plant !== "string" ||
      typeof result.about !== "string" ||
      !Array.isArray(result.issues) ||
      !result.issues.every((issue) => typeof issue === "string") ||
      typeof result.tip !== "string" ||
      !["low", "medium", "high"].includes(result.confidence)
    ) {
      return null;
    }

    return result;
  } catch {
    return null;
  }
}

function PlantCheck({ onSave }) {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [photoDataUrl, setPhotoDataUrl] = useState("");
  const [result, setResult] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisSeconds, setAnalysisSeconds] = useState(0);
  const [error, setError] = useState("");
  const [saveMessage, setSaveMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isAnalyzing) {
      return undefined;
    }

    const intervalId = window.setInterval(
      () => setAnalysisSeconds((seconds) => seconds + 1),
      1000,
    );
    return () => window.clearInterval(intervalId);
  }, [isAnalyzing]);

  useEffect(() => {
    if (!file) {
      setPreviewUrl("");
      return undefined;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  function handleFileChange(event) {
    setFile(event.currentTarget.files?.[0] ?? null);
    setPhotoDataUrl("");
    setResult(null);
    setError("");
    setSaveMessage("");
  }

  async function handleAnalyze() {
    if (!file) {
      return;
    }

    setIsAnalyzing(true);
    setAnalysisSeconds(0);
    setResult(null);
    setError("");
    setSaveMessage("");

    try {
      const resizedDataUrl = await resizeImageToDataUrl(file, 512, 0.6);
      const imageBase64 = resizedDataUrl.replace(/^data:image\/[^;]+;base64,/, "");
      const response = await analyzeImage(ANALYSIS_PROMPT, imageBase64);
      const parsedResult = parseAnalysis(response);

      if (!parsedResult) {
        setError(ANALYSIS_ERROR);
        return;
      }

      setPhotoDataUrl(resizedDataUrl);
      setResult(parsedResult);
    } catch {
      setError(ANALYSIS_ERROR);
    } finally {
      setIsAnalyzing(false);
    }
  }

  async function handleSave() {
    if (!result || !photoDataUrl) {
      return;
    }

    setIsSaving(true);
    setSaveMessage("");
    try {
      const saved = await onSave({ photoDataUrl, result });
      setSaveMessage(
        saved
          ? "Saved to your nature log."
          : "Your browser storage is full. Remove older log entries and try again.",
      );
    } catch {
      setSaveMessage("Your browser storage is full. Remove older log entries and try again.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="panel plant-check" aria-labelledby="plant-check-title">
      <h2 id="plant-check-title">Check this plant</h2>
      <label className="photo-label" htmlFor="plant-check-photo">
        Choose or take a plant photo
      </label>
      <input
        id="plant-check-photo"
        className="photo-input"
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
      />
      {previewUrl && (
        <img className="plant-check-preview" src={previewUrl} alt="Plant selected for analysis" />
      )}
      <button
        className="analyze-button"
        type="button"
        onClick={handleAnalyze}
        disabled={!file || isAnalyzing}
      >
        {isAnalyzing ? "Analyzing photo…" : "Analyze photo"}
      </button>
      {isAnalyzing && (
        <p className="analysis-status" role="status">
          Gemma 3 4B is checking the photo. First analysis can take a little longer
          ({analysisSeconds}s)…
        </p>
      )}
      {error && <p className="analysis-error" role="alert">{error}</p>}

      {result && (
        <article className="analysis-result" aria-labelledby="analysis-result-title">
          <h3 id="analysis-result-title">AI guess, not a diagnosis</h3>
          <p><strong>Plant:</strong> {result.plant}</p>
          <p><strong>About:</strong> {result.about}</p>
          <div>
            <strong>Visible issues:</strong>
            {result.issues.length > 0 ? (
              <ul>{result.issues.map((issue, index) => <li key={`${issue}-${index}`}>{issue}</li>)}</ul>
            ) : (
              <p>None noticed in this photo.</p>
            )}
          </div>
          <p><strong>Care tip:</strong> {result.tip}</p>
          <p className="analysis-confidence">
            <strong>Confidence:</strong> {result.confidence}
          </p>
          <button
            className="save-button"
            type="button"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? "Saving…" : "Save to log"}
          </button>
          {saveMessage && <p className="save-message" role="status">{saveMessage}</p>}
        </article>
      )}
    </section>
  );
}

export default PlantCheck;
