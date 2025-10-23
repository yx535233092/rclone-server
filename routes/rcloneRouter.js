const router = require('express').Router();
const { getDB } = require('../db/sqliteConnection');
const Rclone = require('../class/rclone');

router.post('/start', async (req, res) => {
  const db = getDB();
  if (!db) {
    return res.status(500).json({
      code: 500,
      message: '数据库未初始化'
    });
  }
  const { task_id } = req.body;
  if (!task_id) {
    return res.status(400).json({
      code: 400,
      message: '缺少必填字段'
    });
  }
  const task = await db.get('SELECT * FROM tasks WHERE id = ?', [task_id]);
  if (!task) {
    return res.status(404).json({
      code: 404,
      message: '任务不存在'
    });
  }
  const rclone = new Rclone(task);
  rclone.start();
});

module.exports = router;
