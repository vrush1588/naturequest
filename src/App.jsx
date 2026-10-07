import { useEffect, useState } from "react";
import QuestCard from "./components/QuestCard.jsx";
import SoilPicker from "./components/SoilPicker.jsx";
import Log from "./components/Log.jsx";
import ThisWeek from "./components/ThisWeek.jsx";
import OutsideTracker from "./components/OutsideTracker.jsx";
import PlantCheck from "./components/PlantCheck.jsx";
import { FALLBACK_QUESTS, parseDailyPlan } from "./ai/dailyPlan.js";
import { generate, loadModel } from "./ai/gemma.js";
import { getAdvice, getCurrentSeason } from "./utils/advice.js";
import { deleteEntry, getEntries, saveEntry } from "./utils/storage.js";

function App() {
  const [activeTab, setActiveTab] = useState("check");
  const [soil, setSoil] = useState("");
  const [place, setPlace] = useState("My balcony");
  const [quests, setQuests] = useState(FALLBACK_QUESTS);
  const [completedQuests, setCompletedQuests] = useState([]);
  const [note, setNote] = useState("");
  const [photoDataUrl, setPhotoDataUrl] = useState("");
  const [whatHeard, setWhatHeard] = useState("");
  const [birdAudioDataUrl, setBirdAudioDataUrl] = useState("");
  const [entries, setEntries] = useState([]);
  const [storageError, setStorageError] = useState("");
  const [isLoadingEntries, setIsLoadingEntries] = useState(true);
  const [aiStatus, setAiStatus] = useState("fallback");
  const [aiMessage, setAiMessage] = useState(
    "Connect to local Ollama to use Gemma; built-in advice is always available.",
  );
  const [aiAdvice, setAiAdvice] = useState("");
  const [planMessage, setPlanMessage] = useState("");
  const season = getCurrentSeason();
  const ruleBasedAdvice = getAdvice(soil, season);
  const advice = { ...ruleBasedAdvice, aiAdvice };

  useEffect(() => {
    try {
      setEntries(getEntries());
    } catch (error) {
      setStorageError(error.message);
    } finally {
      setIsLoadingEntries(false);
    }
  }, []);

  useEffect(() => {
    if (aiStatus !== "ready") {
      setAiAdvice("");
      return undefined;
    }

    let cancelled = false;
    setQuests(FALLBACK_QUESTS);
    setCompletedQuests([]);
    setAiAdvice("");
    setPlanMessage("Gemma is creating today's quests and care tip...");
    const prompt = [
      "Create a daily nature-care plan for a Tulsi (holy basil) plant.",
      `Plant: tulsi. Soil state: ${soil || "not checked yet"}.`,
      `Season: ${season}. Place: ${place}.`,
      "Reply with JSON only in exactly this shape: {\"quests\": [\"...\", \"...\", \"...\"], \"tip\": \"...\"}.",
      "Give exactly 3 short, safe, physical quests. Each quest must start with Touch, Look, Smell, or Listen.",
      "Quests should use senses and hands in the given place. Never suggest using a phone, screen, or other device.",
      "The tip must be one short sentence, specific to the soil state and season, and must not recommend watering soggy soil.",
    ].join(" ");

    generate(prompt)
      .then((result) => {
        if (!cancelled) {
          const plan = parseDailyPlan(result);
          setCompletedQuests([]);
          if (plan) {
            setQuests(plan.quests);
            setAiAdvice(plan.tip);
            setPlanMessage("");
          } else {
            setAiAdvice("");
            setPlanMessage("Gemma's reply was not valid JSON or safe physical quests; showing built-in quests and care advice.");
          }
        }
      })
      .catch(() => {
        if (!cancelled) {
          setAiAdvice("");
          setQuests(FALLBACK_QUESTS);
          setCompletedQuests([]);
          setPlanMessage("Gemma could not create a plan; showing built-in quests and care advice.");
          setAiStatus("fallback");
          setAiMessage("AI advice is unavailable right now. Using built-in Tulsi advice.");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [aiStatus, soil, season, place]);

  async function handleLoadModel() {
    setAiStatus("loading");
    setAiMessage("Connecting to Ollama on this device's Naturequest host...");

    try {
      await loadModel();
      setAiStatus("ready");
      setAiMessage("Connected to Ollama with gemma3:4b.");
    } catch (error) {
      setAiStatus("fallback");
      setAiMessage(`${error.message} Using built-in Tulsi advice.`);
    }
  }

  function toggleQuest(quest) {
    setCompletedQuests((completed) =>
      completed.includes(quest)
        ? completed.filter((completedQuest) => completedQuest !== quest)
        : [...completed, quest],
    );
  }

  function handleSavePlantCheck({ photoDataUrl: checkedPhoto, result: plantCheckResult }) {
    try {
      const entry = saveEntry({
        plantName: plantCheckResult.plant || "Plant check",
        soilState: soil || "Not recorded",
        note: "",
        questsCompleted: [],
        photoDataUrl: checkedPhoto,
        plantCheckResult,
      });
      setEntries((currentEntries) =>
        [entry, ...currentEntries].sort(
          (a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime(),
        ),
      );
      setStorageError("");
      return true;
    } catch (error) {
      if (/quota|storage|exceed/i.test(error.message)) {
        setStorageError("Your browser storage is full. Remove older log entries and try again.");
      } else {
        setStorageError("Could not save the plant check to your log. Please try again.");
      }
      return false;
    }
  }

  function handleSaveEntry() {
    if (!soil) {
      return;
    }

    try {
      const questsToSave =
        whatHeard.trim() || birdAudioDataUrl
          ? [...new Set([...completedQuests, "Listen for a bird"])]
          : completedQuests;
      const entry = saveEntry({
        plantName: "tulsi",
        soilState: soil,
        note: note.trim(),
        questsCompleted: questsToSave,
        photoDataUrl,
        whatHeard: whatHeard.trim(),
        birdAudioDataUrl,
      });
      setEntries((currentEntries) =>
        [entry, ...currentEntries].sort(
          (a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime(),
        ),
      );
      setNote("");
      setPhotoDataUrl("");
      setWhatHeard("");
      setBirdAudioDataUrl("");
      setStorageError("");
    } catch (error) {
      setStorageError(error.message);
    }
  }

  function handleDeleteEntry(id) {
    try {
      deleteEntry(id);
      setEntries((currentEntries) => currentEntries.filter((entry) => entry.id !== id));
      setStorageError("");
    } catch (error) {
      setStorageError(error.message);
    }
  }

  return (
    <main className="page">
      <header className="site-header">
        <div className="site-header-row">
          <div>
            <p className="eyebrow">A little outside, every day</p>
            <h1>🌱 Naturequest</h1>
            <p className="tagline">
              Quests for your hands, eyes, and ears. Phone stays in your pocket.
            </p>
          </div>
          <button
            className={`gemma-badge gemma-badge-${aiStatus}`}
            type="button"
            onClick={handleLoadModel}
            disabled={aiStatus === "loading" || aiStatus === "ready"}
            title={aiMessage}
            aria-label={`Gemma status: ${aiStatus}. ${aiMessage}`}
          >
            Gemma: {aiStatus === "ready" ? "Ready" : aiStatus === "loading" ? "Connecting…" : "Offline"}
          </button>
        </div>
      </header>

      <nav className="site-tabs" role="tablist" aria-label="Naturequest sections">
        {[
          ["check", "Check Plant"],
          ["quests", "Quests"],
          ["log", "Log"],
        ].map(([tab, label]) => (
          <button
            className="site-tab"
            id={`${tab}-tab`}
            type="button"
            role="tab"
            aria-selected={activeTab === tab}
            aria-controls={`${tab}-panel`}
            tabIndex={activeTab === tab ? 0 : -1}
            key={tab}
            onClick={() => setActiveTab(tab)}
          >
            {label}
          </button>
        ))}
      </nav>

      <div className="sections">
        <section
          className="tab-panel"
          id="check-panel"
          role="tabpanel"
          aria-labelledby="check-tab"
          hidden={activeTab !== "check"}
        >
          <PlantCheck onSave={handleSavePlantCheck} />
        </section>

        <section
          className="tab-panel sections"
          id="quests-panel"
          role="tabpanel"
          aria-labelledby="quests-tab"
          hidden={activeTab !== "quests"}
        >
          <section className="panel" aria-labelledby="quest-title">
            <h2 id="quest-title">Today's quest</h2>
            <QuestCard
              quests={quests}
              completedQuests={completedQuests}
              onToggleQuest={toggleQuest}
              planMessage={planMessage}
            />
            <div className="place-picker">
              <label htmlFor="quest-place">Where are you today?</label>
              <select
                id="quest-place"
                value={place}
                onChange={(event) => setPlace(event.target.value)}
              >
                <option>My balcony</option>
                <option>Friend's garden</option>
              </select>
            </div>
          </section>
          <section className="panel" aria-labelledby="soil-title">
            <h2 id="soil-title">How does the soil feel?</h2>
            <SoilPicker
              selectedSoil={soil}
              onSoilChange={setSoil}
              advice={advice}
            />
          </section>
          <details className="week-details">
            <summary>This week’s seasonal tips</summary>
            <section className="panel week-card" aria-labelledby="week-title">
              <h2 id="week-title">Tulsi through the seasons</h2>
              <ThisWeek season={season} aiStatus={aiStatus} />
            </section>
          </details>
        </section>

        <section
          className="tab-panel sections"
          id="log-panel"
          role="tabpanel"
          aria-labelledby="log-tab"
          hidden={activeTab !== "log"}
        >
          <section className="panel" aria-labelledby="log-title">
            <h2 id="log-title">Your nature log</h2>
            <Log
              soilState={soil}
              note={note}
              onNoteChange={setNote}
              photoDataUrl={photoDataUrl}
              onPhotoChange={setPhotoDataUrl}
              whatHeard={whatHeard}
              onWhatHeardChange={setWhatHeard}
              birdAudioDataUrl={birdAudioDataUrl}
              onBirdAudioChange={setBirdAudioDataUrl}
              entries={entries}
              isLoading={isLoadingEntries}
              error={storageError}
              onSave={handleSaveEntry}
              onDelete={handleDeleteEntry}
            />
          </section>
          <OutsideTracker />
        </section>
      </div>

      <footer className="site-footer">Take a breath. Notice something small.</footer>
    </main>
  );
}

export default App;
