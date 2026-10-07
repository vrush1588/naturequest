import { useState } from "react";
import { resizeImageToDataUrl } from "../utils/image.js";
import BirdNote from "./BirdNote.jsx";

function Log({
  soilState,
  note,
  onNoteChange,
  photoDataUrl,
  onPhotoChange,
  whatHeard,
  onWhatHeardChange,
  birdAudioDataUrl,
  onBirdAudioChange,
  entries,
  isLoading,
  error,
  onSave,
  onDelete,
}) {
  const [photoError, setPhotoError] = useState("");

  async function handlePhotoChange(event) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    input.value = "";
    setPhotoError("");
    onPhotoChange("");

    if (!file) {
      return;
    }

    try {
      onPhotoChange(await resizeImageToDataUrl(file));
    } catch (error) {
      setPhotoError(error.message);
    }
  }

  return (
    <div className="nature-log">
      <label className="note-label" htmlFor="nature-note">
        What did you notice?
      </label>
      <textarea
        id="nature-note"
        className="note-input"
        value={note}
        onChange={(event) => onNoteChange(event.target.value)}
        placeholder="Add a short note (optional)"
        maxLength={240}
        rows={3}
      />
      <label className="photo-label" htmlFor="nature-photo">
        Add a photo (optional)
      </label>
      <input
        id="nature-photo"
        className="photo-input"
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handlePhotoChange}
      />
      {photoError && <p className="storage-error" role="alert">{photoError}</p>}
      {photoDataUrl && (
        <img className="photo-preview" src={photoDataUrl} alt="Selected nature log attachment" />
      )}
      <BirdNote
        whatHeard={whatHeard}
        onWhatHeardChange={onWhatHeardChange}
        audioDataUrl={birdAudioDataUrl}
        onAudioChange={onBirdAudioChange}
      />
      <button
        className="save-button"
        type="button"
        onClick={onSave}
        disabled={!soilState || isLoading}
      >
        Save
      </button>

      {error && <p className="storage-error" role="alert">{error}</p>}

      <div className="log-entries" aria-live="polite">
        {isLoading ? (
          <p className="log-empty">Loading your entries…</p>
        ) : entries.length === 0 ? (
          <p className="log-empty">Your saved observations will appear here.</p>
        ) : (
          <ul className="entry-list">
            {entries.map((entry) => (
              <li className="entry-card" key={entry.id}>
                <div className="entry-heading">
                  <div>
                    <p className="entry-date">
                      {new Date(entry.dateTime).toLocaleString()}
                    </p>
                    <p className="entry-summary">
                      <span className="entry-plant">{entry.plantName}</span>
                      <span className="entry-separator">·</span>
                      Soil: {entry.soilState}
                    </p>
                  </div>
                  <button
                    className="delete-button"
                    type="button"
                    onClick={() => onDelete(entry.id)}
                    aria-label={`Delete entry from ${new Date(entry.dateTime).toLocaleString()}`}
                  >
                    Delete
                  </button>
                </div>
                {entry.photoDataUrl && (
                  <img
                    className="entry-thumbnail"
                    src={entry.photoDataUrl}
                    alt={`Photo attached to ${entry.plantName} nature log`}
                    loading="lazy"
                  />
                )}
                {entry.note && <p className="entry-note">{entry.note}</p>}
                {entry.whatHeard && (
                  <p className="entry-note"><strong>What I heard:</strong> {entry.whatHeard}</p>
                )}
                {entry.birdAudioDataUrl && (
                  <audio className="entry-audio" controls src={entry.birdAudioDataUrl}>
                    Audio playback is not supported by this browser.
                  </audio>
                )}
                {entry.plantCheckResult && (
                  <div className="saved-analysis">
                    <p className="analysis-label">AI guess, not a diagnosis</p>
                    <p><strong>Plant:</strong> {entry.plantCheckResult.plant}</p>
                    <p><strong>About:</strong> {entry.plantCheckResult.about}</p>
                    <div>
                      <strong>Visible issues:</strong>
                      {entry.plantCheckResult.issues.length > 0 ? (
                        <ul>
                          {entry.plantCheckResult.issues.map((issue, index) => (
                            <li key={`${issue}-${index}`}>{issue}</li>
                          ))}
                        </ul>
                      ) : (
                        <p>None noticed in this photo.</p>
                      )}
                    </div>
                    <p><strong>Care tip:</strong> {entry.plantCheckResult.tip}</p>
                    <p><strong>Confidence:</strong> {entry.plantCheckResult.confidence}</p>
                  </div>
                )}
                <p className="entry-quests-title">
                  Quests completed: {entry.questsCompleted.length}
                </p>
                {entry.questsCompleted.length > 0 && (
                  <ul className="entry-quests">
                    {entry.questsCompleted.map((quest) => (
                      <li key={quest}>{quest}</li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default Log;
