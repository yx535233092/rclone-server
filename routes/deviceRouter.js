var express = require('express');
var router = express.Router();
let path = require('path');
let fs = require('fs');
let { getDB } = require('../db/sqliteConnection');

/**
 * 添加设备
 */
router.post('/', function (req, res) {
  const { type, provider, access_key_id, secret_access_key, endpoint } =
    req.body;
  const device_type = req.query.device_type;

  // 1. 字段校验
  if (
    !type ||
    !provider ||
    !access_key_id ||
    !secret_access_key ||
    !endpoint ||
    !device_type
  ) {
    return res.json({
      code: 400,
      message: '缺少必填字段'
    });
  }

  // 2. 存入数据库
  const db = getDB();
  if (!db) {
    return res.json({
      code: 500,
      message: '数据库未初始化'
    });
  }
  const sql = `insert into devices(type, provider, access_key_id, secret_access_key, endpoint, device_type) values(?,?,?,?,?,?)`;
  db.run(
    sql,
    [type, provider, access_key_id, secret_access_key, endpoint, device_type],
    (err) => {
      if (err) {
        return res.json({
          code: 500,
          message: '设备信息存入数据库失败'
        });
      }
    }
  );
  return res.json({
    code: 200,
    message: '设备信息存入数据库成功'
  });
});

/**
 * 获取设备
 */
router.get('/', async function (req, res, next) {
  // 1. 获取数据库
  const db = getDB();
  if (!db) {
    return res.json({
      code: 500,
      message: '数据库未初始化'
    });
  }
  // 2. 获取设备
  try {
    const deviceType = req.query.device_type;
    if (!deviceType) {
      return res.json({
        code: 400,
        message: '缺少设备类型'
      });
    }
    const devices = await db.all(
      'select * from devices where device_type = ?',
      [deviceType]
    );
    return res.json({
      code: 200,
      message: '设备获取成功',
      data: devices
    });
  } catch (error) {
    return res.json({
      code: 500,
      message: '设备获取失败',
      error: error
    });
  }
});

/**
 * 编辑设备
 */
router.put('/', function (req, res) {
  const { id, type, provider, access_key_id, secret_access_key, endpoint } =
    req.body;
  const device_type = req.query.device_type;
  if (!id || !device_type) {
    return res.json({
      code: 400,
      message: '缺少必填字段'
    });
  }
  const db = getDB();
  if (!db) {
    return res.json({
      code: 500,
      message: '数据库未初始化'
    });
  }
  const sql = `update devices set type = ?, provider = ?, access_key_id = ?, secret_access_key = ?, endpoint = ? where id = ?`;
  db.run(
    sql,
    [type, provider, access_key_id, secret_access_key, endpoint, id],
    (err) => {
      if (err) {
        return res.json({
          code: 500,
          message: '设备信息更新失败'
        });
      }
    }
  );
  return res.json({
    code: 200,
    message: '设备信息更新成功'
  });
});

/**
 * 删除设备
 */
router.delete('/', function (req, res) {
  const { id } = req.body;
  const device_type = req.query.device_type;
  if (!id || !device_type) {
    return res.json({
      code: 400,
      message: '缺少必填字段'
    });
  }
  const db = getDB();
  if (!db) {
    return res.json({
      code: 500,
      message: '数据库未初始化'
    });
  }
  const sql = `delete from devices where id = ?`;
  db.run(sql, [id], (err) => {
    if (err) {
      return res.json({
        code: 500,
        message: '设备信息删除失败'
      });
    }
  });
  return res.json({
    code: 200,
    message: '设备信息删除成功'
  });
});

module.exports = router;
