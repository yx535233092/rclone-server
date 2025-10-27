const router = require("express").Router();
const Rclone = require("../class/rclone");

// 全局管理rclone实例
const rcloneInstances = new Map();

router.post("/start", async (req, res) => {
  const { task_id } = req.body;
  if (!task_id) {
    return res.status(400).json({
      code: 400,
      message: "缺少必填字段",
    });
  }

  // 1. 判断是否存在rclone实例
  if (rcloneInstances.has(task_id)) {
    return res.status(400).json({
      code: 400,
      message: "任务已存在",
    });
  }

  const rclone = new Rclone(task_id);
  await rclone.init();
  rclone.start();
  rcloneInstances.set(task_id, rclone);

  return res.status(200).json({
    code: 200,
    message: "任务启动",
  });
});

router.post("/stop", async (req, res) => {
  const { task_id } = req.body;
  if (!task_id) {
    return res.status(400).json({
      code: 400,
      message: "缺少必填字段",
    });
  }
  // 1. 查找实例
  const rclone = rcloneInstances.get(task_id);
  if (!rclone) {
    return res.status(400).json({
      code: 400,
      message: "任务不存在",
    });
  }
  rclone.stop();
  rcloneInstances.delete(task_id);
  return res.status(200).json({
    code: 200,
    message: "任务停止",
  });
});

module.exports = router;
