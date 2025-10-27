const sqlite = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

// 1. 定义数据库文件路径
const DB_PATH = path.join(__dirname, "..", "rclone.db");

let db = null;

async function initializeDataBase() {
  try {
    db = await sqlite.open({
      filename: DB_PATH,
      driver: sqlite3.Database,
    });
    // 创建设备表
    await db.run(
      "create table if not exists devices(id integer primary key autoincrement,name text, type text, protocol text, ak text, sk text, endpoint text, device_type text)"
    );
    // 创建任务表
    await db.run(
      "create table if not exists tasks(id integer primary key autoincrement, name text, source_device_id integer, source_bucket_name text, source_url text, target_device_id integer, target_bucket_name text, target_url text,concurrent integer, limit_speed integer, increment_circle integer, status text, config_url text)"
    );
    console.log("数据库连接成功");
  } catch (error) {
    console.log("数据库连接失败");
    console.log(error);
  }
}

// 导出一个函数来获取db实例
function getDB() {
  return db;
}

module.exports = { initializeDataBase, getDB };
