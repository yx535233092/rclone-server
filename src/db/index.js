const sqlite = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const DB_PATH = path.join(__dirname, "./", "rclone.db");
let db = null;

async function initializeDataBase() {
  try {
    db = await sqlite.open({
      filename: DB_PATH,
      driver: sqlite3.Database,
    });
    // 创建remotes表
    await db.run(
      `create table if not exists remotes(id integer primary key autoincrement,name text unique, type text, config_json text)`
    );
    // 创建jobs表
    await db.run(
      `create table if not exists jobs(id integer primary key autoincrement, status text not null, source_remote text not null, target_remote text not null, rclone_options text null, pid integer null, start_time text null, end_time text null, total_size_bytes integer default 0)`
    );
  } catch (error) {
    console.log(error);
    throw error;
  }
}

const initDB = async () => {
  try {
    await initializeDataBase();
    console.log("数据库连接成功");
  } catch (error) {
    console.log("数据库连接失败");
    console.log(error);
  }
};

// 导出一个函数来获取db实例
function getDB() {
  return db;
}

module.exports = { initDB, getDB };
