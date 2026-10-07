import { useEffect, useRef, useState } from "react";

const MAX_RECORDING_MS = 10_000;

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("The recording could not be prepared for saving."));
    reader.readAsDataURL(blob);
  });
}

function BirdNote({ whatHeard, onWhatHeardChange, audioDataUrl, onAudioChange }) {
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState("");
  const recorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const timeoutRef = useRef(null);

  useEffect(
    () => () => {
      window.clearTimeout(timeoutRef.current);
      if (recorderRef.current?.state === "recording") {
        recorderRef.current.stop();
      }
      streamRef.current?.getTracks().forEach((track) => track.stop());
    },
    [],
  );

  function stopRecording() {
    window.clearTimeout(timeoutRef.current);
    if (recorderRef.current?.state === "recording") {
      recorderRef.current.stop();
    }
  }

  async function startRecording() {
    setError("");

    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      setError("Audio recording is not supported in this browser. You can type what you heard instead.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];
      const mimeType = [
        "audio/webm;codecs=opus",
        "audio/webm",
        "audio/mp4",
      ].find((type) => MediaRecorder.isTypeSupported(type));
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      recorderRef.current = recorder;

      recorder.addEventListener("dataavailable", (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      });
      recorder.addEventListener("stop", async () => {
        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        setIsRecording(false);

        const recording = new Blob(chunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        });
        if (!recording.size) {
          return;
        }

        try {
          onAudioChange(await blobToDataUrl(recording));
        } catch (recordingError) {
          setError(recordingError.message);
        }
      });
      recorder.addEventListener("error", () => {
        setError("The audio recording failed. You can type what you heard instead.");
        setIsRecording(false);
        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      });

      recorder.start();
      setIsRecording(true);
      timeoutRef.current = window.setTimeout(stopRecording, MAX_RECORDING_MS);
    } catch {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      setError("Microphone access was unavailable. You can type what you heard instead.");
    }
  }

  return (
    <fieldset className="bird-note">
      <legend>Optional quest: Listen for a bird</legend>
      <p className="bird-note-help">
        Record up to 10 seconds or write what you heard. No bird identification.
      </p>
      <button
        className="record-button"
        type="button"
        onClick={isRecording ? stopRecording : startRecording}
      >
        {isRecording ? "Stop recording" : "Record up to 10 seconds"}
      </button>
      {isRecording && <p className="recording-status" role="status">Recording…</p>}
      <label className="note-label" htmlFor="what-heard">
        What I heard
      </label>
      <textarea
        id="what-heard"
        className="note-input"
        value={whatHeard}
        onChange={(event) => onWhatHeardChange(event.target.value)}
        placeholder="A bird call, rustling leaves, or quiet..."
        maxLength={240}
        rows={2}
      />
      {error && <p className="storage-error" role="alert">{error}</p>}
      {audioDataUrl && (
        <div className="bird-audio-preview">
          <audio controls src={audioDataUrl}>Audio playback is not supported by this browser.</audio>
          <button className="delete-button" type="button" onClick={() => onAudioChange("")}>
            Remove recording
          </button>
        </div>
      )}
    </fieldset>
  );
}

export default BirdNote;
