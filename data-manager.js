/* =============================================================
   Data Manager Module
   Handles all API communication for fetching trivia questions.
   Isolates network logic from game state and DOM manipulation.
   ============================================================= */

/**
 * @description Fetches trivia questions from the Open Trivia DB API with optional
 *              category and difficulty filters. Falls back to a local JSON file
 *              if the API is unavailable due to rate limiting or network errors.
 * @param {string} categoryId - The category ID to filter by, or empty string for any category
 * @param {string} difficulty - The difficulty level ('easy', 'medium', 'hard'), or empty string for any
 * @returns {Promise<Object>} The API response object containing a results array of question objects
 */
export async function fetchQuestions(categoryId, difficulty) {
  try {
    let apiUrl = `https://opentdb.com/api.php?amount=10&type=multiple`;
    if (categoryId) {
      apiUrl += `&category=${categoryId}`;
    }
    if (difficulty) {
      apiUrl += `&difficulty=${difficulty}`;
    }
    const response = await fetch(apiUrl);

    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    const data = await response.json();
    return data;
  } catch (error) {
    // If the API fails (rate limit, network error), load fallback questions
    console.error("API fetch failed, loading fallback questions:", error);
    const fallback = await fetch("triviaAPI.json");
    const data = await fallback.json();
    return data;
  }
}
