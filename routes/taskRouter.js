let express = require("express");
let router = express.Router();
let { getDB } = require("../db");
const paramsValid = require("../utils/paramsValid");
const path = require("path");
const fs = require("fs");
const Rclone = require("../class/rclone");

// 全局管理rclone实例
const rcloneInstances = new Map();

/**
 * 创建任务
 */
router.post("/", async function (req, res) {
  // 1. 获取请求参数
  const {
    name,
    source_device_id,
    source_bucket_name,
    source_url,
    target_device_id,
    target_bucket_name,
    target_url,
    concurrent,
    limit_speed = 0,
    increment_circle = 0,
  } = req.body;
  // 2. 验证参数
  if (
    !paramsValid([
      name,
      source_device_id,
      source_bucket_name,
      source_url,
      target_device_id,
      target_bucket_name,
      target_url,
      concurrent,
      limit_speed,
      increment_circle,
    ])
  ) {
    return res.json({
      code: 400,
      message: "缺少必填字段",
    });
  }

  // 3. 创建任务
  const db = getDB();
  const sql = `insert into tasks(name, source_device_id, source_bucket_name, source_url, target_device_id, target_bucket_name, target_url, concurrent, limit_speed, increment_circle,status) values(?,?,?,?,?,?,?,?,?,?,?)`;
  try {
    const { lastID: id } = await db.run(sql, [
      name,
      source_device_id,
      source_bucket_name,
      source_url,
      target_device_id,
      target_bucket_name,
      target_url,
      concurrent,
      limit_speed,
      increment_circle,
      "unready",
    ]);
    // 4. 创建配置文件
    const config_url = path.join(__dirname, "..", "configs", `rclone_${id}.conf`);
    const source_device = await db.get("SELECT * FROM devices WHERE id = ?", [source_device_id]);
    const target_device = await db.get("SELECT * FROM devices WHERE id = ?", [target_device_id]);

    const configContent = `
    [${source_device.name}]
    type = ${source_device.type}
    provider = ${source_device.protocol}
    access_key_id = ${source_device.ak}
    secret_access_key = ${source_device.sk}
    endpoint = ${source_device.endpoint}

    [${target_device.name}]
    type = ${target_device.type}
    provider = ${target_device.protocol}
    access_key_id = ${target_device.ak}
    secret_access_key = ${target_device.sk}
    endpoint = ${target_device.endpoint}
    `;
    try {
      fs.writeFileSync(config_url, configContent);
    } catch (error) {
      return res.json({
        code: 500,
        message: "配置文件创建失败",
        error: error.message,
      });
    }
    await db.run("update tasks set config_url = ? where id = ?", [config_url, id]);

    // 5. 数据处理
    const data = {
      name,
      source_device_id,
      source_bucket_name,
      source_url,
      target_device_id,
      target_bucket_name,
      target_url,
      concurrent,
      limit_speed,
      increment_circle,
      config_url,
      id,
    };

    return res.json({
      code: 200,
      message: "任务创建成功",
      data,
    });
  } catch (error) {
    return res.json({
      code: 500,
      message: "任务创建失败",
      error: error.message,
    });
  }
});

/**
 * 获取任务
 */
router.get("/", async function (req, res) {
  const db = getDB();
  // 1. 获取数据库任务列表
  const sql = `select * from tasks`;
  const tasks = await db.all(sql);
  return res.json({
    code: 200,
    message: "任务获取成功",
    data: tasks,
  });
});

/**
 * 获取单个任务
 */
router.get("/:id", async function (req, res) {
  const db = getDB();
  // 1. 获取请求参数
  const { id } = req.params;
  // 2. 验证参数
  if (!id) {
    return res.json({
      code: 400,
      message: "缺少必填字段",
    });
  }
  // 3. 获取单个任务
  try {
    const sql = `select * from tasks where id = ?`;
    const task = await db.get(sql, [id]);
    return res.json({
      code: 200,
      message: "任务获取成功",
      data: task,
    });
  } catch (error) {
    return res.json({
      code: 500,
      message: "任务获取失败",
      error: error.message,
    });
  }
});

/**
 * 编辑任务
 */
router.put("/:id", async function (req, res) {
  const { id } = req.params;
  const { concurrent, limit_speed = 0, increment_circle = 0 } = req.body;
  if (!paramsValid([id, concurrent, limit_speed, increment_circle])) {
    return res.json({
      code: 400,
      message: "缺少必填字段",
    });
  }
  const db = getDB();
  const sql = `update tasks set concurrent = ?, limit_speed = ?, increment_circle = ? where id = ?`;
  try {
    await db.run(sql, [concurrent, limit_speed, increment_circle, id]);
    return res.json({
      code: 200,
      message: "任务编辑成功",
    });
  } catch (error) {
    return res.json({
      code: 500,
      message: "任务编辑失败",
      error: error.message,
    });
  }
});

/**
 * 删除任务
 */
router.delete("/:id", async function (req, res) {
  const db = getDB();
  const { id } = req.params;
  // 2. 验证参数
  if (!id) {
    return res.json({
      code: 400,
      message: "缺少必填字段",
    });
  }
  // 3. 停止任务
  const rclone = rcloneInstances.get(id);
  if (rclone) {
    await rclone.stop();
    rcloneInstances.delete(id);
  }

  // 4. 删除配置文件
  const { config_url } = await db.get("select config_url from tasks where id = ?", [id]);
  if (config_url) {
    fs.unlinkSync(config_url);
  }

  // 5. 删除任务
  const sql = `delete from tasks where id = ?`;
  try {
    await db.run(sql, [id]);
    return res.json({
      code: 200,
      message: "任务删除成功",
    });
  } catch (error) {
    return res.json({
      code: 500,
      message: "任务删除失败",
      error: error.message,
    });
  }
});

/**
 * 启动任务
 */
router.post("/start/:id", async function (req, res) {
  const { id } = req.params;
  const db = getDB();
  // 1. 判断是否存在rclone实例
  if (rcloneInstances.has(id)) {
    const rclone = rcloneInstances.get(id);
    await rclone.init();
    await rclone.start();
    return res.status(200).json({
      code: 200,
      message: "任务启动成功",
    });
  }

  const rclone = new Rclone(id);
  await rclone.init();
  await rclone.start();
  rcloneInstances.set(id, rclone);

  return res.status(200).json({
    code: 200,
    message: "任务启动成功",
  });
});

/**
 * 停止任务
 */
router.post("/stop/:id", async function (req, res) {
  const { id } = req.params;
  const rclone = rcloneInstances.get(id);
  await rclone.stop();
  return res.status(200).json({
    code: 200,
    message: "任务停止成功",
  });
});

module.exports = router;
