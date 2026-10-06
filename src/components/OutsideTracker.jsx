import { useEffect, useRef, useState } from "react";

function getDurations(session, now) {
  if (!session) {
    return { screenMs: 0, outsideMs: 0 };
  }

  const elapsed = session.running ? Math.max(0, now - session.segmentStartedAt) : 0;
  return {
    screenMs: session.screenMs + (session.phase === "screen" ? elapsed : 0),
    outsideMs: session.outsideMs + (session.phase === "outside" ? elapsed : 0),
  };
}

function formatMinutes(milliseconds) {
  return `${Math.floor(milliseconds / 60_000)} min`;
}

function OutsideTracker() {
  const [session, setSession] = useState(null);
  const [completedSessions, setCompletedSessions] = useState([]);
  const [now, setNow] = useState(Date.now());
  const sessionRef = useRef(null);

  useEffect(() => {
    function handleVisibilityChange() {
      const current = sessionRef.current;
      const nextPhase = document.visibilityState === "visible" ? "screen" : "outside";
      if (!current?.running || current.phase === nextPhase) {
        return;
      }

      const elapsed = Math.max(0, Date.now() - current.segmentStartedAt);
      const nextSession = {
        ...current,
        screenMs: current.screenMs + (current.phase === "screen" ? elapsed : 0),
        outsideMs: current.outsideMs + (current.phase === "outside" ? elapsed : 0),
        phase: nextPhase,
        segmentStartedAt: Date.now(),
      };
      sessionRef.current = nextSession;
      setSession(nextSession);
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  useEffect(() => {
    if (!session?.running) {
      return undefined;
    }
    const intervalId = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(intervalId);
  }, [session?.running]);

  function startSession() {
    const startedAt = Date.now();
    const nextSession = {
      startedAt,
      screenMs: 0,
      outsideMs: 0,
      phase: document.visibilityState === "visible" ? "screen" : "outside",
      segmentStartedAt: startedAt,
      running: true,
    };
    sessionRef.current = nextSession;
    setSession(nextSession);
    setNow(startedAt);
  }

  function finishSession() {
    const current = sessionRef.current;
    if (!current?.running) {
      return;
    }

    const finishedAt = Date.now();
    const elapsed = Math.max(0, finishedAt - current.segmentStartedAt);
    const finishedSession = {
      ...current,
      screenMs: current.screenMs + (current.phase === "screen" ? elapsed : 0),
      outsideMs: current.outsideMs + (current.phase === "outside" ? elapsed : 0),
      running: false,
      finishedAt,
    };
    sessionRef.current = finishedSession;
    setSession(finishedSession);
    setCompletedSessions((sessions) => [finishedSession, ...sessions]);
    setNow(finishedAt);
  }

  const durations = getDurations(session, now);

  return (
    <section className="panel tracker-panel" aria-labelledby="tracker-title">
      <h2 id="tracker-title">Screen time vs outside time</h2>
      <p className="tracker-description">
        Time is counted as screen use while Naturequest is visible and outside time while it is hidden.
      </p>
      <button
        className="tracker-button"
        type="button"
        onClick={session?.running ? finishSession : startSession}
      >
        {session?.running ? "Finish quest" : "Start quest / Phone in pocket"}
      </button>

      {session && (
        <p className="tracker-summary" aria-live="polite">
          {session.running ? "Current session — " : "Last session — "}
          Screen: {formatMinutes(durations.screenMs)}, Outside: {formatMinutes(durations.outsideMs)}
        </p>
      )}

      {completedSessions.length > 1 && (
        <ul className="tracker-history" aria-label="Earlier quest sessions">
          {completedSessions.slice(1).map((completedSession) => (
            <li key={completedSession.startedAt}>
              {new Date(completedSession.startedAt).toLocaleString()} — Screen:{" "}
              {formatMinutes(completedSession.screenMs)}, Outside:{" "}
              {formatMinutes(completedSession.outsideMs)}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default OutsideTracker;
