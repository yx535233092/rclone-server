const express = require("express");
const router = express.Router();
const { validateRequired } = require("../utils/paramsValid");
const JobService = require("../services/jobService");

/**
 * 新增任务
 * @param {string} name 任务名称
 * @param {string} source_remote_id 源设备ID
 * @param {string} target_remote_id 目标设备ID
 * @param {string} source_bucket_name 源桶名
 * @param {string} source_url 源路径
 * @param {string} target_bucket_name 目标桶名
 * @param {string} target_url 目标路径
 * @param {number} concurrent 并发数
 * @param {number} limit_speed 限速
 * @returns {object} 返回新增任务的响应信息
 */
router.post("/", async (req, res) => {
  const {
    name,
    source_remote_id,
    target_remote_id,
    source_bucket_name,
    source_url,
    target_bucket_name,
    target_url,
    concurrent,
    limit_speed,
  } = req.body;
  validateRequired(name, "name");
  validateRequired(source_remote_id, "source_remote_id");
  validateRequired(target_remote_id, "target_remote_id");
  validateRequired(source_bucket_name, "source_bucket_name");
  validateRequired(source_url, "source_url");
  validateRequired(target_bucket_name, "target_bucket_name");
  validateRequired(target_url, "target_url");
  validateRequired(concurrent, "concurrent");
  validateRequired(limit_speed, "limit_speed");
  try {
    const result = await JobService.createJob(
      name,
      source_remote_id,
      target_remote_id,
      source_bucket_name,
      source_url,
      target_bucket_name,
      target_url,
      concurrent,
      limit_speed
    );
    return res.json({
      code: 200,
      message: "新增任务成功",
      data: result,
    });
  } catch (error) {
    console.log(error);
    return res.json({
      code: 500,
      message: "新增任务失败",
      error: error.message,
    });
  }
});
module.exports = router;
