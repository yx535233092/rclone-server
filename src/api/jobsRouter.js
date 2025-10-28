const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {
  res.json({
    code: 200,
    message: "任务获取成功",
    data: [],
  });
});

module.exports = router;
