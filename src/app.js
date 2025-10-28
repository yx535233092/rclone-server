const express = require("express");
const setupMiddleware = require("./middleware");
const errorHandler = require("./api");
const { initDB } = require("./db");

const app = express();

// 中间件
setupMiddleware(app);

// 路由
app.use("/api/remotes", require("./api/remotesRouter"));
app.use("/api/jobs", require("./api/jobsRouter"));

// 错误处理
errorHandler(app);

// 数据库初始化
initDB();

module.exports = app;
