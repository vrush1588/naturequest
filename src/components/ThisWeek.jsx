import { useEffect, useState } from "react";
import { generate } from "../ai/gemma.js";
import { SEASONAL_TIPS } from "../utils/advice.js";

function parseRephrasedTip(response) {
  try {
    const parsed = JSON.parse(response);
    if (typeof parsed.tip !== "string" || !parsed.tip.trim()) {
      return null;
    }
    return parsed.tip.trim();
  } catch {
    return null;
  }
}

function ThisWeek({ season, aiStatus }) {
  const [friendlyTip, setFriendlyTip] = useState("");
  const tableTip = SEASONAL_TIPS[season];

  useEffect(() => {
    setFriendlyTip("");
    if (aiStatus !== "ready" || !tableTip) {
      return undefined;
    }

    let cancelled = false;
    const prompt = [
      "Rephrase this Tulsi care tip in one friendly, warm sentence.",
      "Keep the exact meaning and practical advice; do not add or remove care instructions.",
      "Reply with JSON only in this exact shape: {\"tip\":\"...\"}.",
      `Care tip: ${tableTip}`,
    ].join(" ");

    generate(prompt)
      .then((response) => {
        if (!cancelled) {
          setFriendlyTip(parseRephrasedTip(response) ?? "");
        }
      })
      .catch(() => {
        if (!cancelled) {
          setFriendlyTip("");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [aiStatus, tableTip]);

  return (
    <div className="seasonal-week">
      <p className="seasonal-week-tip" aria-live="polite">
        <span>{friendlyTip ? "A friendly tip:" : "This season:"}</span>{" "}
        {friendlyTip || tableTip}
      </p>
      <table className="seasonal-table">
        <caption>Tulsi care through the seasons</caption>
        <thead>
          <tr>
            <th scope="col">Season</th>
            <th scope="col">Tulsi tip</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(SEASONAL_TIPS).map(([seasonName, tip]) => (
            <tr className={seasonName === season ? "current-season" : ""} key={seasonName}>
              <th scope="row">{seasonName[0].toUpperCase() + seasonName.slice(1)}</th>
              <td>{tip}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="seasonal-tip-source">
        {friendlyTip ? "Gemma rephrased the seasonal table tip." : "Using the seasonal table tip."}
      </p>
    </div>
  );
}

export default ThisWeek;
