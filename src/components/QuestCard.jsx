function QuestCard({ quests, completedQuests, onToggleQuest, planMessage }) {
  const completedCount = completedQuests.length;

  return (
    <div className="quest-card">
      <p className="plant-name">Tulsi <span>(holy basil)</span></p>
      {planMessage && <p className="plan-message" role="status">{planMessage}</p>}
      <div
        className="quest-progress"
        role="group"
        aria-label={`${completedCount}/${quests.length} quests completed`}
      >
        <progress value={completedCount} max={quests.length} />
        <span>{completedCount}/{quests.length} quests completed</span>
      </div>
      <ul className="quest-list">
        {quests.map((quest, index) => {
          const isCompleted = completedQuests.includes(quest);
          const checkboxId = `quest-${index}`;

          return (
            <li className="quest-item" key={quest}>
              <input
                id={checkboxId}
                type="checkbox"
                checked={isCompleted}
                onChange={() => onToggleQuest(quest)}
              />
              <label className={isCompleted ? "is-completed" : ""} htmlFor={checkboxId}>
                {quest}
              </label>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default QuestCard;
