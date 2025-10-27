/**
 * @class Rclone
 * @description Rclone 类
 * @param {number} taskId - 任务ID
 * @property {taskId} string
 * @property {totalSize} number
 * @property {status} string
 * @returns {Rclone}
 */

let { getDB } = require("../db");
const { spawn } = require("child_process");

class Rclone {
  constructor(taskId) {
    this.taskId = taskId;
    this.totalSize = 0;
    this.status = "unready";
    this.rcloneProcess = null;
  }

  async init() {
    // 1. 获取任务信息绑定到实例
    const db = getDB();
    const taskInfo = await db.get("SELECT * FROM tasks WHERE id = ?", [this.taskId]);
    const sourceDevice = await db.get("SELECT * FROM devices WHERE id = ?", [taskInfo.source_device_id]);
    const targetDevice = await db.get("SELECT * FROM devices WHERE id = ?", [taskInfo.target_device_id]);
    this.sourceDevice = sourceDevice;
    this.targetDevice = targetDevice;
    this.taskInfo = taskInfo;
    this.status = "ready";
  }

  start() {
    // 1. 构造shell命令
    console.log("-".repeat(15), "开始执行任务", "-".repeat(15));
    const rcloneProcess = spawn("rclone", [
      "copy",
      "-P",
      `${this.sourceDevice.name}:${this.taskInfo.source_bucket_name}`,
      `${this.targetDevice.name}:${this.taskInfo.target_bucket_name}`,
      "--config",
      this.taskInfo.config_url,
      "--bwlimit",
      "10K",
    ]);
    this.rcloneProcess = rcloneProcess;
    this.status = "migration";

    // 2. 监听rclone输出数据
    rcloneProcess.stdout.on("data", (data) => {
      // 1. 按行切分输出的buffer字符串
      const dataArr = data.toString("utf-8");
      // 2. 解析rclone输出数据
      const result = this.parser(dataArr);
      // 3. 传输数据到客户端
      this.transferData(result);
    });

    // 3. 监听rclone错误输出
    rcloneProcess.stderr.on("data", (data) => {
      console.error(data.toString());
    });

    // 4. 监听rclone关闭事件
    rcloneProcess.on("close", (code) => {
      console.log("-".repeat(15), "执行结束", "-".repeat(15));
      if (code === 0) {
        console.log("执行成功");
      } else {
        console.log("执行失败,错误码：", code);
      }
    });
  }

  /**
   * rclone输出数据解析器
   * @param {*} input -rclone 输出的字符串文本
   * @returns {Object} - 解析结果
   */
  parser(input) {
    //  1. 验证数据类型
    if (typeof input !== "string") {
      throw new Error("输入数据类型错误");
    }

    console.log("*".repeat(15), "开始解析rclone输出数据", "*".repeat(15));

    // 2. 确认文件检查状态
    const checkStatus = input.match(/Checks:\s*\d*\s*\/\s*\d*,\s*(.*?),/)[1];
    if (checkStatus !== "100%") {
      return {};
    }
    console.log("文件检查状态：", checkStatus);

    // 3. 提取已下载大小
    const transferredSize = input.match(/Transferred:\s*(.*?)\//)[1];
    console.log("已下载大小：", transferredSize);

    // 4. 提取总大小
    const totalSize = input.match(/Transferred:.*?\/\d*(.*?),/)[1];
    console.log("总大小：", totalSize);

    // 5. 提取下载速度
    const downloadSpeed = input.match(/Transferred:.*?%,(.*?),/)[1];
    console.log("下载速度：", downloadSpeed);

    // 6.提取剩余时间
    const remainingTime = input.match(/ETA\s*(\w*)/)[1];
    console.log("剩余时间：", remainingTime);

    // 7. 提取已用时间
    const elapsedTime = input.match(/Elapsed\stime:\s*(.*?s)/)[1];
    console.log("已用时间：", elapsedTime);

    // 8. 提取已完成百分比
    const percent = input.match(/.*?(\d*\%)/)[1];
    console.log("已完成百分比：", percent);

    // 9. 返回解析结果
    return {
      checkStatus,
      transferredSize,
      totalSize,
      downloadSpeed,
      remainingTime,
      elapsedTime,
      percent,
    };
  }

  /**
   *
   * @param {Object} data
   */
  transferData(data) {
    if (global.wsClients && global.wsClients.size > 0) {
      global.wsClients.forEach((ws) => {
        ws.send(JSON.stringify(data));
      });
    }
  }

  stop() {
    // 1. 停止rclone进程
    if (this.rcloneProcess) {
      this.rcloneProcess.kill("SIGTERM");

      // 2. 5s未终止，强制杀进程
      setTimeout(() => {
        if (this.rcloneProcess && !this.rcloneProcess.killed) {
          this.rcloneProcess.kill("SIGKILL");
          console.log("强制杀进程");
        }
      }, 5000);
      this.status = "stopped";
      if (this.rcloneProcess.killed) {
        console.log("成功停止执行任务");
      }
    } else {
      console.log("未找到rclone进程");
    }
  }

  restart() {
    console.log("重启任务");
  }
}

module.exports = Rclone;
