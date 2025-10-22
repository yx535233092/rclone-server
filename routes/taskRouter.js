let express = require('express');
let router = express.Router();
let { getDB } = require('../db/sqliteConnection');

/**
 * 创建任务
 */
router.post('/', async function (req, res) {
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
    increment_circle = 0
  } = req.body;
  if (
    !name ||
    !source_device_id ||
    !source_bucket_name ||
    !source_url ||
    !target_device_id ||
    !target_bucket_name ||
    !target_url ||
    !concurrent
  ) {
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
  const sql = `insert into tasks(name, source_device_id, source_bucket_name, source_url, target_device_id, target_bucket_name, target_url, concurrent, limit_speed, increment_circle) values(?,?,?,?,?,?,?,?,?,?)`;
  try {
    await db.run(
      sql,
      [
        name,
        source_device_id,
        source_bucket_name,
        source_url,
        target_device_id,
        target_bucket_name,
        target_url,
        concurrent,
        limit_speed,
        increment_circle
      ],
      (err) => {
        if (err) {
          return res.json({
            code: 500,
            message: '任务创建失败'
          });
        }
      }
    );
    return res.json({
      code: 200,
      message: '任务创建成功'
    });
  } catch (error) {
    return res.json({
      code: 500,
      message: '任务创建失败',
      error: error
    });
  }
});

/**
 * 获取任务
 */
router.get('/', async function (req, res) {
  const db = getDB();
  if (!db) {
    return res.json({
      code: 500,
      message: '数据库未初始化'
    });
  }
  if (req.query.id) {
    const sql = `select * from tasks where id = ?`;
    const task = await db.get(sql, [req.query.id]);
    return res.json({
      code: 200,
      message: '任务获取成功',
      data: task
    });
  }
  const sql = `select * from tasks`;
  const tasks = await db.all(sql);
  return res.json({
    code: 200,
    message: '任务获取成功',
    data: tasks
  });
});

/**
 * 编辑任务
 */
router.put('/', async function (req, res) {
  const {
    id,
    name,
    source_device_id,
    source_bucket_name,
    source_url,
    target_device_id,
    target_bucket_name,
    target_url,
    concurrent,
    limit_speed = 0,
    increment_circle = 0
  } = req.body;
  if (
    !id ||
    !name ||
    !source_device_id ||
    !source_bucket_name ||
    !source_url ||
    !target_device_id ||
    !target_bucket_name ||
    !target_url ||
    !concurrent
  ) {
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
  const sql = `update tasks set name = ?, source_device_id = ?, source_bucket_name = ?, source_url = ?, target_device_id = ?, target_bucket_name = ?, target_url = ?, concurrent = ?, limit_speed = ?, increment_circle = ? where id = ?`;
  await db.run(
    sql,
    [
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
      id
    ],
    (err) => {
      if (err) {
        return res.json({
          code: 500,
          message: '任务编辑失败'
        });
      }
    }
  );
  return res.json({
    code: 200,
    message: '任务编辑成功'
  });
});

/**
 * 删除任务
 */
router.delete('/', async function (req, res) {
  const { id } = req.body;
  if (!id) {
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
  const sql = `delete from tasks where id = ?`;
  await db.run(sql, [id], (err) => {
    if (err) {
      return res.json({
        code: 500,
        message: '任务删除失败'
      });
    }
  });
  return res.json({
    code: 200,
    message: '任务删除成功'
  });
});
module.exports = router;
