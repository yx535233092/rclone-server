/**
 * Rclone 类
 */

let { getDB } = require('../db/sqliteConnection');
let path = require('path');
let fs = require('fs');
let { exec } = require('child_process');

class Rclone {
  constructor(task) {
    this.task = task;
    // 1. 判断数据库是否初始化
    const db = getDB();
    if (!db) {
      throw new Error('数据库未初始化');
    }
    this.db = db;
    // 2. 生成临时配置文件
    this.generateConfig();
  }

  async generateConfig() {
    // 1. 获取配置信息
    console.log('-'.repeat(15) + '生成临时配置文件' + '-'.repeat(15));
    const source_device = await this.getDeviceInfo(this.task.source_device_id);
    const target_device = await this.getDeviceInfo(this.task.target_device_id);
    this.source_device_name = source_device.name;
    this.target_device_name = target_device.name;

    // 2. 生成配置文件
    const configContent = `
    [${source_device.name}]
    type = ${source_device.type}
    provider = ${source_device.portocol}
    access_key_id = ${source_device.ak}
    secret_access_key = ${source_device.sk}
    endpoint = ${source_device.endpoint}

    [${target_device.name}]
    type = ${target_device.type}
    provider = ${target_device.portocol}
    access_key_id = ${target_device.ak}
    secret_access_key = ${target_device.sk}
    endpoint = ${target_device.endpoint}
    `;
    const configFile = path.join(__dirname, 'rclone.conf');
    try {
      // 1. 删除原文件
      if (fs.existsSync(configFile)) {
        fs.unlinkSync(configFile);
        console.log('配置文件删除成功');
      }
      // 2. 写入新文件
      fs.writeFileSync(configFile, configContent);
      console.log('配置文件写入成功');
    } catch (err) {
      throw new Error('配置文件操作失败: ' + err.message);
    }
  }

  async getDeviceInfo(device_id) {
    const device = await this.db.get('SELECT * FROM devices WHERE id = ?', [
      device_id
    ]);
    return device;
  }

  start() {
    setTimeout(() => {
      let execSentence = `
      rclone copy -P ${this.source_device_name}:${
        this.task.source_bucket_name
      } ${this.target_device_name}:${
        this.task.target_bucket_name
      } --config ${path.join(__dirname, 'rclone.conf')}
        `;
      console.log(execSentence);
      console.log('开始执行任务');

      exec(execSentence, (err, stdout, stderr) => {
        if (err) {
          console.error(err);
          return;
        }
        console.log(stdout);
        console.error(stderr);
      });
    }, 1000);
  }

  stop() {
    console.log('停止执行任务');
  }

  restart() {
    console.log('重启任务');
  }
}

module.exports = Rclone;
