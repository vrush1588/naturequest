import { useEffect, useState } from "react";
import QuestCard from "./components/QuestCard.jsx";
import SoilPicker from "./components/SoilPicker.jsx";
import Log from "./components/Log.jsx";
import ThisWeek from "./components/ThisWeek.jsx";
import OutsideTracker from "./components/OutsideTracker.jsx";
import { FALLBACK_QUESTS, parseDailyPlan } from "./ai/dailyPlan.js";
import { generate, loadModel } from "./ai/gemma.js";
import { getAdvice, getCurrentSeason } from "./utils/advice.js";
import { deleteEntry, getEntries, saveEntry } from "./utils/storage.js";

function App() {
  const [soil, setSoil] = useState("");
  const [place, setPlace] = useState("My balcony");
  const [quests, setQuests] = useState(FALLBACK_QUESTS);
  const [completedQuests, setCompletedQuests] = useState([]);
  const [note, setNote] = useState("");
  const [photoDataUrl, setPhotoDataUrl] = useState("");
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
    setAiMessage("Connecting to Ollama at http://localhost:11434...");

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

  function handleSaveEntry() {
    if (!soil) {
      return;
    }

    try {
      const entry = saveEntry({
        plantName: "tulsi",
        soilState: soil,
        note: note.trim(),
        questsCompleted: completedQuests,
        photoDataUrl,
      });
      setEntries((currentEntries) =>
        [entry, ...currentEntries].sort(
          (a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime(),
        ),
      );
      setNote("");
      setPhotoDataUrl("");
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
        <p className="eyebrow">A little outside, every day</p>
        <h1>🌱 Naturequest</h1>
        <p className="tagline">
          Quests for your hands, eyes, and ears. Phone stays in your pocket.
        </p>
      </header>

      <div className="sections">
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
            aiStatus={aiStatus}
            aiMessage={aiMessage}
            onLoadAI={handleLoadModel}
          />
        </section>
        <section className="panel" aria-labelledby="log-title">
          <h2 id="log-title">Your nature log</h2>
          <Log
            soilState={soil}
            note={note}
            onNoteChange={setNote}
            photoDataUrl={photoDataUrl}
            onPhotoChange={setPhotoDataUrl}
            entries={entries}
            isLoading={isLoadingEntries}
            error={storageError}
            onSave={handleSaveEntry}
            onDelete={handleDeleteEntry}
          />
        </section>
        <section className="panel" aria-labelledby="week-title">
          <h2 id="week-title">This week</h2>
          <ThisWeek />
        </section>
        <OutsideTracker />
      </div>

      <footer className="site-footer">Take a breath. Notice something small.</footer>
    </main>
  );
}

export default App;
