const soilAdvice = {
  dry: "Top inch is dry, water lightly today",
  damp: "Soil is lightly moist, wait before watering and check again tomorrow",
  wet: "Soil is soggy, skip watering and check drainage",
};

const seasonalTips = {
  monsoon: "Pinch flower tips to encourage leafy growth, and protect Tulsi from heavy rain.",
  winter: "Water less in cool weather and keep Tulsi in a sunny, sheltered spot.",
  summer: "Check the soil daily, water in the morning, and give Tulsi shade in extreme heat.",
};

export function getCurrentSeason(date = new Date()) {
  const month = date.getMonth();

  if (month >= 5 && month <= 8) {
    return "monsoon";
  }
  if (month >= 9 || month <= 1) {
    return "winter";
  }
  return "summer";
}

export function getAdvice(soilState, season) {
  const soil = soilState?.trim().toLowerCase();
  const currentSeason = season?.trim().toLowerCase();

  return {
    soilAdvice: soilAdvice[soil] ?? null,
    seasonalTip: seasonalTips[currentSeason] ?? null,
  };
}
