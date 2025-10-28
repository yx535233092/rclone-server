const { getDB } = require(".");

const remoteRepository = {
  createRemote: async (name, type, config_json) => {
    const db = getDB();
    const sql = `insert into remotes(name, type, config_json) values(?,?,?)`;
    const { lastID: id } = await db.run(sql, [name, type, config_json]);
    const getSql = `select * from remotes where id = ?`;
    const result = await db.get(getSql, [id]);
    console.log(result);
    return result;
  },
  getRemotes: async (type) => {
    const db = getDB();
    const sql = `select * from remotes where type = ?`;
    const result = await db.all(sql, [type]);
    return result;
  },
  updateRemote: async (id, name, type, config_json) => {
    const db = getDB();
    const sql = `update remotes set name = ?, type = ?, config_json = ? where id = ?`;
    const { changes } = await db.run(sql, [name, type, config_json, id]);
    if (changes === 0) {
      throw new Error("配置不存在");
    }
    const getSql = `select * from remotes where id = ?`;
    const result = await db.get(getSql, [id]);
    return changes > 0 ? result : null;
  },
  deleteRemote: async (id) => {
    const db = getDB();
    const sql = `delete from remotes where id = ?`;
    await db.run(sql, [id]);
    return true;
  },

  getRemote: async (id) => {
    const db = getDB();
    const sql = `select * from remotes where id = ?`;
    const result = await db.get(sql, [id]);
    if (!result) {
      throw new Error("配置不存在");
    }
    return result;
  },

  getRemoteByName: async (name) => {
    const db = getDB();
    const sql = `select * from remotes where name = ?`;
    const result = await db.get(sql, [name]);
    if (!result) {
      throw new Error("配置不存在");
    }
    return result;
  },
};

module.exports = remoteRepository;
