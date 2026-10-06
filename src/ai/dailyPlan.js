const physicalQuestStart = /^(touch|look|smell|listen)\b/i;
const phoneReference = /\b(phone|smartphone|cellphone|mobile device|screen)\b/i;

export const FALLBACK_QUESTS = [
  "Touch the top inch of soil and notice whether it feels dry or damp.",
  "Look beneath a few leaves for spots or tiny insects.",
  "Smell a leaf gently, then listen for birds near your plant.",
];

export function parseDailyPlan(response) {
  try {
    const plan = JSON.parse(response);
    if (
      !plan ||
      !Array.isArray(plan.quests) ||
      plan.quests.length !== 3 ||
      !plan.quests.every(
        (quest) =>
          typeof quest === "string" &&
          quest.length <= 120 &&
          physicalQuestStart.test(quest.trim()) &&
          !phoneReference.test(quest),
      ) ||
      typeof plan.tip !== "string" ||
      !plan.tip.trim() ||
      plan.tip.length > 220 ||
      phoneReference.test(plan.tip)
    ) {
      return null;
    }

    const tip = plan.tip.trim();
    const sentences = tip.match(/[^.!?]+[.!?]+(?=\s|$)/g);
    if (!sentences || sentences.length !== 1 || sentences.join("").trim() !== tip) {
      return null;
    }

    return { quests: plan.quests.map((quest) => quest.trim()), tip };
  } catch {
    return null;
  }
}
