const express = require("express");
const mongoose = require("mongoose");
const path = require("path");

require("dotenv").config({
  path: path.join(__dirname, "../.env")
});

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.get("/", (req, res) => {
  res.send("BookNest Backend Running!");
});
app.get("/dashboard", (req, res) => {
  res.json({
    titles: 0,
    students: 0,
    issued: 0,
    available: 0,
    copies: 0,
    overdue: 0
  });
});

app.get("/issues", (req, res) => {
  res.json([]);
});

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB Connected Successfully");

    app.listen(process.env.PORT || 5000, () => {
      console.log("Server running on port 5000");
    });
  })
  .catch((err) => {
    console.error("MongoDB Connection Failed:", err.message);
  });