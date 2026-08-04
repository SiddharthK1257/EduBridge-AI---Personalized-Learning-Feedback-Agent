/**
 * Strict Duplication Checker
 * Prevents identical or similar questions (similarity > 20%) both across student history and within the same generated batch.
 */

function normalizeText(text) {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/[^\w\s]/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function getWordTokens(text) {
  const norm = normalizeText(text);
  if (!norm) return [];
  // Filter out ultra common stop words for accurate semantic comparison
  const stopWords = new Set(['in', 'which', 'of', 'the', 'following', 'what', 'is', 'a', 'an', 'to', 'for', 'and', 'or', 'with', 'by', 'at', 'on']);
  return norm.split(' ').filter(w => w.length > 1 && !stopWords.has(w));
}

function getNGrams(text, n = 2) {
  const words = getWordTokens(text);
  const nGrams = new Set();
  for (let i = 0; i <= words.length - n; i++) {
    nGrams.add(words.slice(i, i + n).join(' '));
  }
  return nGrams;
}

/**
 * Calculates Jaccard similarity between two strings using word tokens and n-grams
 */
function calculateSimilarity(text1, text2) {
  const norm1 = normalizeText(text1);
  const norm2 = normalizeText(text2);

  if (norm1 === norm2) return 1.0;
  if (!norm1 || !norm2) return 0.0;

  const set1 = getNGrams(norm1, 2);
  const set2 = getNGrams(norm2, 2);

  if (set1.size === 0 || set2.size === 0) {
    const tokens1 = new Set(getWordTokens(norm1));
    const tokens2 = new Set(getWordTokens(norm2));
    if (tokens1.size === 0 || tokens2.size === 0) return 0.0;
    const intersection = new Set([...tokens1].filter(x => tokens2.has(x)));
    const union = new Set([...tokens1, ...tokens2]);
    return union.size === 0 ? 0 : intersection.size / union.size;
  }

  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  return intersection.size / union.size;
}

/**
 * Checks if a new question text exceeds similarity threshold (default 20% / 0.20)
 * against any previously attempted question text or questions in the current batch.
 */
function isDuplicateQuestion(newQuestionText, previousQuestionTexts = [], threshold = 0.20) {
  if (!newQuestionText || !previousQuestionTexts || previousQuestionTexts.length === 0) {
    return false;
  }

  const normNew = normalizeText(newQuestionText);

  for (const prevText of previousQuestionTexts) {
    const normPrev = normalizeText(prevText);
    if (normNew === normPrev) return true;

    const similarity = calculateSimilarity(newQuestionText, prevText);
    if (similarity > threshold) {
      console.warn(`[Strict Duplicate Checker]: High similarity (${Math.round(similarity * 100)}% > ${threshold * 100}%) detected. Rejecting question.`);
      return true;
    }
  }

  return false;
}

module.exports = {
  normalizeText,
  calculateSimilarity,
  isDuplicateQuestion
};
