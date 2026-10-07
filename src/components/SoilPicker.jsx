const soilOptions = ["Dry", "Damp", "Wet"];

function SoilPicker({ selectedSoil, onSoilChange, advice }) {
  return (
    <div className="soil-picker">
      <div className="soil-options" role="group" aria-label="Soil moisture">
        {soilOptions.map((option) => (
          <button
            className="soil-button"
            type="button"
            key={option}
            aria-pressed={selectedSoil === option}
            onClick={() => onSoilChange(option)}
          >
            {option}
          </button>
        ))}
      </div>
      <aside className="plant-advice" aria-live="polite" aria-label="Tulsi care advice">
        {advice.aiAdvice ? (
          <p className="soil-advice">
            <span className="advice-label">AI suggestion:</span> {advice.aiAdvice}
          </p>
        ) : advice.soilAdvice ? (
          <p className="soil-advice">{advice.soilAdvice}.</p>
        ) : (
          <p className="soil-advice">Choose a soil state for watering advice.</p>
        )}
        {advice.seasonalTip && (
          <p className="seasonal-tip">
            <span>Seasonal tip:</span> {advice.seasonalTip}
          </p>
        )}
      </aside>
    </div>
  );
}

export default SoilPicker;
