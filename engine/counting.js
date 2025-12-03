const { DECKS } = require("../config/constants");

const hiLoMap = {
  "2": 1,
  "3": 1,
  "4": 1,
  "5": 1,
  "6": 1,
  "7": 0,
  "8": 0,
  "9": 0,
  "10": -1,
  "J": -1,
  "Q": -1,
  "K": -1,
  "A": -1
};

module.exports = {
  runningCount: 0,
  cardsSeen: 0,

  update(card) {
    if (!hiLoMap.hasOwnProperty(card)) return;
    this.runningCount += hiLoMap[card];
    this.cardsSeen += 1;
  },

  getTrueCount() {
    const decksRemaining = Math.max((DECKS * 52 - this.cardsSeen) / 52, 0.1);
    return parseFloat((this.runningCount / decksRemaining).toFixed(2));
  },

  reset() {
    this.runningCount = 0;
    this.cardsSeen = 0;
  }
};
