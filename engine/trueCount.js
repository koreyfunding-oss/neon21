// Placeholder trueCount module for NEON21
module.exports = {
  getTrueCount(runningCount, decksRemaining) {
    if (!decksRemaining) return runningCount;
    return runningCount / decksRemaining;
  }
};
