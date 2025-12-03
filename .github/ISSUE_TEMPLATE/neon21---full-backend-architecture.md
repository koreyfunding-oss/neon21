---
name: NEON21 — FULL BACKEND ARCHITECTURE
about: This is the skeleton of the full blackjack prediction engine
title: ''
labels: ''
assignees: ''

---

neon21/
│
├── index.js
├── vercel.json
├── package.json
│
├── /engine
│   ├── counting.js
│   ├── trueCount.js
│   ├── probability.js
│   ├── patterns.js
│   ├── betRamp.js
│   └── shuffleBias.js
│
├── /state
│   ├── shoe.js
│   ├── session.js
│   ├── dealerProfile.js
│   └── stateManager.js
│
├── /api
│   ├── count.js
│   ├── predict.js
│   ├── recommend.js
│   ├── stats.js
│   ├── reset.js
│   └── health.js
│
├── /utils
│   ├── deckTools.js
│   ├── cardValue.js
│   ├── logger.js
│   ├── entropyCheck.js
│   ├── evTools.js
│   └── secure.js
│
├── /config
│   ├── settings.json
│   └── constants.js
│
├── /public
│   ├── neon-ui.html
│   ├── styles.css
│   └── /img
│       └── neon21-logo.png
│
└── README.md
