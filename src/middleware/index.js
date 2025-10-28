const express = require("express");
const path = require("path");

const setupMiddleware = (app) => {
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  app.use(express.static(path.join(__dirname, "public")));
};

module.exports = setupMiddleware;
