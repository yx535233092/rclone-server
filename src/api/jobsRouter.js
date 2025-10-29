const express = require("express");
const router = express.Router();
const { validateRequired } = require("../utils/paramsValid");
const JobService = require("../services/jobService");
const jobRepository = require("../db/jobRepository");

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

/**
 * 获取任务列表
 * @returns {object} 返回任务列表的响应信息
 */
router.get("/", async (req, res) => {
  try {
    const result = await jobRepository.getAllJobs();
    return res.json({
      code: 200,
      message: "获取任务列表成功",
      data: result,
    });
  } catch (error) {
    console.log(error);
    return res.json({
      code: 500,
      message: "获取任务列表失败",
      error: error.message,
    });
  }
});

/**
 * 启动任务
 * @param {string} id 任务ID
 * @returns {object} 返回启动任务的响应信息
 */
router.post("/:id/start", async (req, res) => {
  const { id } = req.params;
  validateRequired(id, "id");
  try {
    const job = await jobRepository.getJobById(id);
    if (!job) {
      return res.json({
        code: 404,
        message: "任务不存在",
      });
    }
    await JobService.startJob(job);
    return res.json({
      code: 200,
      message: "启动任务成功",
    });
  } catch (error) {
    console.log(error);
    return res.json({
      code: 500,
      message: "启动任务失败",
      error: error.message,
    });
  }
});

/**
 * 停止任务
 * @param {string} id 任务ID
 * @returns {object} 返回停止任务的响应信息
 */
router.post("/:id/stop", async (req, res) => {
  const { id } = req.params;
  validateRequired(id, "id");
  try {
    const job = await jobRepository.getJobById(id);
    if (!job) {
      return res.json({
        code: 404,
        message: "任务不存在",
      });
    }
    await JobService.stopJob(job);
    return res.json({
      code: 200,
      message: "停止任务成功",
    });
  } catch (error) {
    console.log(error);
    return res.json({
      code: 500,
      message: "停止任务失败",
      error: error.message,
    });
  }
});

/**
 * 删除任务
 * @param {string} id 任务ID
 * @returns {object} 返回删除任务的响应信息
 */
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  validateRequired(id, "id");
  try {
    const job = await jobRepository.getJobById(id);
    if (job && job.status === JobService.STATUS.RUNNING) {
      await JobService.killJob(job);
    }
    const result = await jobRepository.deleteJob(id);
    if (!result) {
      return res.json({
        code: 404,
        message: "任务不存在",
      });
    }
    return res.json({
      code: 200,
      message: "删除任务成功",
    });
  } catch (error) {
    console.log(error);
    return res.json({
      code: 500,
      message: "删除任务失败",
      error: error.message,
    });
  }
});

/**
 * 更新任务
 * @param {string} id 任务ID
 * @param {string} name 任务名称
 * @param {string} source_remote_id 源设备ID
 * @param {string} target_remote_id 目标设备ID
 * @param {string} source_bucket_name 源桶名
 * @param {string} source_url 源路径
 * @param {string} target_bucket_name 目标桶名
 * @param {string} target_url 目标路径
 * @param {number} concurrent 并发数
 * @param {number} limit_speed 限速
 * @returns {object} 返回更新任务的响应信息
 */
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { concurrent, limit_speed } = req.body;
  validateRequired(id, "id");
  validateRequired(concurrent, "concurrent");
  validateRequired(limit_speed, "limit_speed");
  try {
    const rclone_options = JSON.stringify({
      concurrent,
      limit_speed,
    });
    const result = await jobRepository.updateJob(id, rclone_options);
    if (!result) {
      return res.json({
        code: 404,
        message: "任务不存在",
      });
    }
    return res.json({
      code: 200,
      message: "更新任务成功",
      data: result,
    });
  } catch (error) {
    console.log(error);
    return res.json({
      code: 500,
      message: "更新任务失败",
      error: error.message,
    });
  }
});

module.exports = router;
