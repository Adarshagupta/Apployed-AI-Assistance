/**
 * Async handler to avoid try-catch blocks in controllers
 * @param {Function} fn - Async function to handle
 * @returns {Function} Express middleware
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
