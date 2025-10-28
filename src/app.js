const express = require("express");
const setupMiddleware = require("./middleware");
const errorHandler = require("./api");
const { initDB } = require("./db");
const JobSchedule = require("./services/jobSchedule");

const app = express();

// 中间件
setupMiddleware(app);

// 路由
app.use("/api/remotes", require("./api/remotesRouter"));
app.use("/api/jobs", require("./api/jobsRouter"));

// 错误处理
errorHandler(app);

// 数据库初始化
initDB()
  .then(() => {
    // 启动任务调度器
    const jobSchedule = new JobSchedule();
    jobSchedule.start();
  })
  .catch((err) => {
    console.log("数据库初始化失败");
    console.log(err);
  });

module.exports = app;
