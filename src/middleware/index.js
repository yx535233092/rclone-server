const express = require("express");
const path = require("path");
const cors = require("cors");

const setupMiddleware = (app) => {
  app.use(
    cors({
      origin: true,
      methods: ["GET", "POST", "PUT", "DELETE"],
    })
  );
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  app.use(express.static(path.join(__dirname, "..", "..", "public")));
};

module.exports = setupMiddleware;
