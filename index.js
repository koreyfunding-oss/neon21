const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

const app = express();
app.use(cors());
app.use(helmet());
app.use(express.json());

// API ROUTES
app.use("/api/count", require("./api/count"));

module.exports = app;
