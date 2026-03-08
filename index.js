const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const path = require("path");

const app = express();
app.use(cors());
app.use(helmet());
app.use(express.json());

// Serve static frontend from /public
// express.static handles the root "/" path automatically (serves index.html or neon-ui.html)
app.use(express.static(path.join(__dirname, "public"), { index: "neon-ui.html" }));

// API ROUTES
app.use("/api/count",     require("./api/count"));
app.use("/api/predict",   require("./api/predict"));
app.use("/api/recommend", require("./api/recommend"));
app.use("/api/stats",     require("./api/stats"));
app.use("/api/reset",     require("./api/reset"));
app.use("/api/health",    require("./api/health"));

const PORT = process.env.PORT || 3001;
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`NEON21 engine running on port ${PORT}`);
  });
}

module.exports = app;
