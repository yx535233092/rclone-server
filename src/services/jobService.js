const remoteService = require("./remoteService");
const jobRepository = require("../db/jobRepository");
const remoteRepo = require("../db/remoteRepository");
const path = require("path");
const fs = require("fs");
const { spawn } = require("child_process");

class JobService {
  constructor() {
    this.runningProcesses = new Map();
  }

  static STATUS = {
    NEW: "NEW",
    RUNNING: "RUNNING",
    FAILED: "FAILED",
    CANCELED: "CANCELED",
    COMPLETED: "COMPLETED",
  };

  // event：SUBMIT
  async createJob(
    name,
    source_remote_id,
    target_remote_id,
    source_bucket_name,
    source_url,
    target_bucket_name,
    target_url,
    concurrent,
    limit_speed
  ) {
    const status = JobService.STATUS.NEW;
    const source_remote_info = await remoteService.getRemote(source_remote_id);
    const target_remote_info = await remoteService.getRemote(target_remote_id);
    const source_remote = `${source_remote_info.name}:${source_bucket_name}${source_url}`;
    const target_remote = `${target_remote_info.name}:${target_bucket_name}${target_url}`;
    const rclone_options = JSON.stringify({
      concurrent,
      limit_speed,
    });
    // 入库
    const result = await jobRepository.createJob(name, status, source_remote, target_remote, rclone_options);
    return result;
  }

  // event: START
  async startJob(job) {
    // 更新任务状态为RUNNING
    console.log("开始执行任务");
    // 生成配置文件
    const config_file = await this.generateConfigFile(job);
    const config_path = path.join(__dirname, "..", "..", "public", "configs", `rclone_${job.id}.conf`);
    // 写入配置文件
    fs.writeFileSync(config_path, config_file);
    // 解析rclone_options
    const rclone_options = JSON.parse(job.rclone_options);
    // 构造rclone命令
    let spawnargs = [
      "copy",
      `${job.source_remote}`,
      `${job.target_remote}`,
      "--config",
      config_path,
      "--transfers",
      rclone_options.concurrent,
      "--bwlimit",
      rclone_options.limit_speed + "M",
      "--use-json-log",
      "--stats-log-level",
      "NOTICE",
      "--stats",
      "1s",
    ];
    console.log("执行命令：rclone ", spawnargs.join(" "));
    // 启动rclone进程
    const rcloneProcess = spawn("rclone", spawnargs);
    this.runningProcesses.set(job.id, rcloneProcess);
    // 更新任务状态为RUNNING
    await jobRepository.updateJobStatus(job.id, JobService.STATUS.RUNNING);
    await jobRepository.updateJobPid(job.id, rcloneProcess.pid);
    await jobRepository.updateJobStartTime(job.id, new Date().toLocaleString());
    // 监听rclone进程输出
    let totalBytes = 0;
    rcloneProcess.stderr.on("data", async (data) => {
      try {
        const json = JSON.parse(data.toString());
        if (json.level !== "error") {
          this.wsTransferData(job, json, JobService.STATUS.RUNNING);
          //更新总大小
          if (totalBytes === 0) {
            totalBytes = json.stats.totalBytes;
            await jobRepository.updateJobTotalBytes(job.id, totalBytes);
          }
        }
      } catch (error) {}
    });

    rcloneProcess.on("close", async (code) => {
      console.log("任务id：" + job.id, "，rclone进程退出，状态码：", code);
      await jobRepository.updateJobEndTime(job.id, new Date().toLocaleString());
      this.runningProcesses.delete(job.id);
      const jobInfo = await jobRepository.getJobById(job.id);
      if (jobInfo && jobInfo.status === JobService.STATUS.CANCELED) {
        global.webSocket.clients.forEach((client) => {
          client.send(
            JSON.stringify({
              status: JobService.STATUS.CANCELED,
              jobId: job.id,
            })
          );
        });
        return;
      }

      // 传输完成，进程正常退出 E:COMPLETE
      if (code === 0) {
        await jobRepository.updateJobStatus(job.id, JobService.STATUS.COMPLETED);
        global.webSocket.clients.forEach((client) => {
          client.send(
            JSON.stringify({
              status: JobService.STATUS.COMPLETED,
              jobId: job.id,
            })
          );
        });
      }
      // 传输失败，进程异常退出 E:FAIL
      else {
        await jobRepository.updateJobStatus(job.id, JobService.STATUS.FAILED);
        global.webSocket.clients.forEach((client) => {
          client.send(
            JSON.stringify({
              status: JobService.STATUS.FAILED,
              jobId: job.id,
            })
          );
        });
      }
    });
  }

  // event: STOP
  async stopJob(job) {
    console.log("停止任务");
    // 状态改为CANCELED
    await jobRepository.updateJobStatus(job.id, JobService.STATUS.CANCELED);
  }

  killJob(job) {
    const rcloneProcess = this.runningProcesses.get(job.id);
    if (rcloneProcess) {
      rcloneProcess.kill("SIGTERM");
      setTimeout(() => {
        if (rcloneProcess && !rcloneProcess.killed) {
          rcloneProcess.kill("SIGKILL");
        }
      }, 5000);
    }
    if (rcloneProcess.killed) {
      console.log("进程已杀死");
      this.runningProcesses.delete(job.id);
    } else {
      console.log("进程未杀死");
    }
  }

  async generateConfigFile(job) {
    console.log("生成配置文件");
    const source_remote_info = await remoteRepo.getRemoteByName(job.source_remote.split(":")[0]);
    const target_remote_info = await remoteRepo.getRemoteByName(job.target_remote.split(":")[0]);

    const config_file = `
    [${source_remote_info.name}]
    type = ${JSON.parse(source_remote_info.config_json).remote_type}
    provider = ${JSON.parse(source_remote_info.config_json).protocol}
    access_key_id = ${JSON.parse(source_remote_info.config_json).ak}
    secret_access_key = ${JSON.parse(source_remote_info.config_json).sk}
    endpoint = ${JSON.parse(source_remote_info.config_json).endpoint}

    [${target_remote_info.name}]
    type = ${JSON.parse(target_remote_info.config_json).remote_type}
    provider = ${JSON.parse(target_remote_info.config_json).protocol}
    access_key_id = ${JSON.parse(target_remote_info.config_json).ak}
    secret_access_key = ${JSON.parse(target_remote_info.config_json).sk}
    endpoint = ${JSON.parse(target_remote_info.config_json).endpoint}
    `;
    return config_file;
  }

  wsTransferData(job, data, status) {
    console.log("ws数据传输中");
    global.webSocket.clients.forEach((client) => {
      client.send(
        JSON.stringify({
          status: status,
          jobId: job.id,
          data: data,
        })
      );
    });
  }
}

const jobServiceInstance = new JobService();

module.exports = jobServiceInstance;
module.exports.STATUS = JobService.STATUS;
