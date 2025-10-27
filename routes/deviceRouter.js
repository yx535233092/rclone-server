var express = require("express");
var router = express.Router();
let { getDB } = require("../db");
let paramsValid = require("../utils/paramsValid");

/**
 * 添加设备
 */
router.post("/", async function (req, res) {
  // 1. 获取请求参数
  const { name, type, protocol, ak, sk, endpoint } = req.body;
  const device_type = req.query.device_type;

  // 2. 字段校验
  if (!paramsValid([device_type, name, type, protocol, ak, sk, endpoint])) {
    return res.json({
      code: 400,
      message: "缺少必填字段",
    });
  }

  // 3. 入库
  const db = getDB();
  const sql = `insert into devices(name,type, protocol, ak, sk, endpoint, device_type) values(?,?,?,?,?,?,?)`;
  try {
    const { lastID } = await db.run(sql, [name, type, protocol, ak, sk, endpoint, device_type]);
    return res.json({
      code: 200,
      message: "设备信息存入数据库成功",
      data: {
        name,
        type,
        protocol,
        ak,
        sk,
        endpoint,
        device_type,
        id: lastID,
      },
    });
  } catch (err) {
    return res.json({
      code: 500,
      message: "设备信息存入数据库失败",
      error: err.message,
    });
  }
});

/**
 * 获取设备
 */
router.get("/:id", async function (req, res, next) {
  const db = getDB();
  const { id } = req.params;
  try {
    const device = await db.get("select * from devices where id = ?", [id]);
    return res.json({
      code: 200,
      message: "设备获取成功",
      data: device,
    });
  } catch (error) {
    return res.json({
      code: 500,
      message: "设备获取失败",
      error: error.message,
    });
  }
});

router.get("/", async function (req, res, next) {
  const db = getDB();
  // 1. 获取请求参数
  const query = req.query;
  if (!query.device_type) {
    return res.json({
      code: 400,
      message: "缺少设备类型",
    });
  }
  // 2. 键值对获取
  const kv = Object.entries(query).filter(([key, value]) => {
    return key !== "device_type";
  });
  // 3. 键值对生成sql
  let sql = `select * from devices where device_type = '${query.device_type}'`;
  kv.forEach(([key, value]) => {
    sql += ` and ${key} like '%${value}%'`;
  });

  try {
    const devices = await db.all(sql);
    return res.json({
      code: 200,
      message: "设备获取成功",
      data: devices,
    });
  } catch (error) {
    return res.json({
      code: 500,
      message: "设备获取失败",
      error: error.message,
    });
  }
});

/**
 * 编辑设备
 */
router.put("/:id", async function (req, res) {
  // 1. 获取请求参数
  const { id } = req.params;
  const { name, type, protocol, ak, sk, endpoint } = req.body;

  // 2. 字段校验
  if (!paramsValid([id, name, type, protocol, ak, sk, endpoint])) {
    return res.json({
      code: 400,
      message: "缺少必填字段",
    });
  }

  // 3. 编辑信息
  const db = getDB();
  const sql = `update devices set name = ?, type = ?, protocol = ?, ak = ?, sk = ?, endpoint = ? where id = ?`;
  try {
    await db.run(sql, [name, type, protocol, ak, sk, endpoint, id]);
    return res.json({
      code: 200,
      message: "设备信息更新成功",
    });
  } catch (err) {
    return res.json({
      code: 500,
      message: "设备信息更新失败",
      error: err.message,
    });
  }
});

/**
 * 删除设备
 */
router.delete("/:id", async function (req, res) {
  // 1. 获取请求参数
  const { id } = req.params;

  // 2. 校验参数
  if (!id) {
    return res.json({
      code: 400,
      message: "缺少必填字段",
    });
  }

  // 3. 删除数据
  const db = getDB();
  const sql = `delete from devices where id = ?`;
  try {
    await db.run(sql, [id]);
    return res.json({
      code: 200,
      message: "设备信息删除成功",
    });
  } catch (err) {
    return res.json({
      code: 500,
      message: "设备信息删除失败",
      error: err.message,
    });
  }
});

module.exports = router;
