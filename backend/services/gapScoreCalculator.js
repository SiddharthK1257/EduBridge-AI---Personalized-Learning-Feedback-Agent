/**
 * Calculates the AI Learning Gap Score (0 to 100) and Priority Level based on test metrics.
 * 
 * High score = Higher learning gap (more gaps to bridge).
 * Low score = Low learning gap (student has high mastery).
 */
const calculateLearningGapScore = ({
  accuracy, // 0 - 100
  wrongCount,
  totalQuestions,
  avgTimeSpentSeconds,
  expectedTimePerQuestionSeconds = 60,
  difficulty = 'Medium',
  previousAttemptsCount = 1,
  repeatedMistakesCount = 0
}) => {
  // 1. Accuracy Penalty (40% weight)
  // Low accuracy yields high gap score
  const accuracyGap = (100 - accuracy) * 0.40;

  // 2. Wrong Answer Ratio (20% weight)
  const wrongRatio = totalQuestions > 0 ? (wrongCount / totalQuestions) : 0;
  const wrongPenalty = wrongRatio * 100 * 0.20;

  // 3. Time Inefficiency Factor (15% weight)
  // Overtime or severe rushing adds to learning gap
  let timeGapRatio = 0;
  if (avgTimeSpentSeconds > expectedTimePerQuestionSeconds * 1.5) {
    timeGapRatio = Math.min(1.0, (avgTimeSpentSeconds - expectedTimePerQuestionSeconds) / expectedTimePerQuestionSeconds);
  } else if (avgTimeSpentSeconds < expectedTimePerQuestionSeconds * 0.3 && accuracy < 70) {
    // Rushed through and got questions wrong
    timeGapRatio = 0.8;
  }
  const timePenalty = timeGapRatio * 100 * 0.15;

  // 4. Difficulty Multiplier (10% weight)
  // Failing on Easy questions creates a much higher learning gap than failing Hard questions
  let difficultyWeight = 1.2; // Easy failure is critical
  if (difficulty === 'Medium') difficultyWeight = 1.0;
  if (difficulty === 'Hard') difficultyWeight = 0.8;
  const difficultyFactor = (100 - accuracy) * 0.10 * difficultyWeight;

  // 5. Repeated Mistakes & History Factor (15% weight)
  const repeatedPenalty = Math.min(100, (repeatedMistakesCount * 25) + (previousAttemptsCount > 3 && accuracy < 60 ? 30 : 0)) * 0.15;

  // Total Gap Score calculation bounded 0 - 100
  let rawGapScore = accuracyGap + wrongPenalty + timePenalty + difficultyFactor + repeatedPenalty;
  const learningGapScore = Math.min(100, Math.max(0, Math.round(rawGapScore)));

  // Priority classification
  let gapPriority = 'Low';
  if (learningGapScore >= 75) {
    gapPriority = 'Critical';
  } else if (learningGapScore >= 50) {
    gapPriority = 'High';
  } else if (learningGapScore >= 25) {
    gapPriority = 'Medium';
  } else {
    gapPriority = 'Low';
  }

  return {
    learningGapScore,
    gapPriority
  };
};

module.exports = { calculateLearningGapScore };
