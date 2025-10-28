const { getDB } = require(".");

const jobRepository = {
  createJob: async (name, status, source_remote, target_remote, rclone_options) => {
    const db = getDB();
    const sql = `insert into jobs(name, status, source_remote, target_remote, rclone_options) values(?,?,?,?,?)`;
    try {
      const { lastID: id } = await db.run(sql, [name, status, source_remote, target_remote, rclone_options]);
      const getSql = `select * from jobs where id = ?`;
      const result = await db.get(getSql, [id]);
      return result;
    } catch (error) {
      console.log(error);
      throw new Error("新增任务失败");
    }
  },
  getActiveJobs: async () => {
    const db = getDB();
    const sql = `select * from jobs where status ='RUNNING' or status ='QUEUED'`;
    const result = await db.all(sql);
    if (!result) {
      return [];
    }
    return result;
  },
  getNewJob: async () => {
    const db = getDB();
    const sql = `select * from jobs where status ='NEW' order by id asc limit 1`;
    const result = await db.get(sql);
    if (!result) {
      return null;
    }
    return result;
  },
  updateJobStatus: async (jobId, status) => {
    const db = getDB();
    const sql = `update jobs set status = ? where id = ?`;
    const { changes } = await db.run(sql, [status, jobId]);
    if (changes === 0) {
      return false;
    }
    return true;
  },
  updateJobPid: async (jobId, pid) => {
    const db = getDB();
    const sql = `update jobs set pid = ? where id = ?`;
    const { changes } = await db.run(sql, [pid, jobId]);
    if (changes === 0) {
      return false;
    }
    return true;
  },
  updateJobStartTime: async (jobId, startTime) => {
    const db = getDB();
    const sql = `update jobs set start_time = ? where id = ?`;
    const { changes } = await db.run(sql, [startTime, jobId]);
    if (changes === 0) {
      return false;
    }
    return true;
  },
  updateJobEndTime: async (jobId, endTime) => {
    const db = getDB();
    const sql = `update jobs set end_time = ? where id = ?`;
    const { changes } = await db.run(sql, [endTime, jobId]);
    if (changes === 0) {
      return false;
    }
    return true;
  },
};

module.exports = jobRepository;
