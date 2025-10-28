const jobRepository = require("../db/jobRepository");
const JobService = require("./jobService");
const { STATUS } = require("./jobService");

// job调度器
class JobSchedule {
  constructor() {
    this.intervalRef = null;
    this.MAX_JOBS = 5;
    this.jobRepo = jobRepository;
    this.JobService = JobService;
  }

  async runSchedule() {
    const activeJobs = await this.jobRepo.getActiveJobs();
    // 检查中断任务
    await this.checkRevocerJob(activeJobs);
    // 超过最大任务数，直接返回
    if (activeJobs.length >= this.MAX_JOBS) {
      console.log("已达任务上限");
      return;
    }

    // 没有新任务，直接返回
    const newJob = await this.jobRepo.getNewJob();
    if (!newJob) {
      return;
    }

    // 有新任务，开始执行
    await this.JobService.startJob(newJob);
  }

  start() {
    console.log("启动任务调度器");
    this.runSchedule();
    this.intervalRef = setInterval(async () => {
      await this.runSchedule();
    }, 3000);
  }

  stop() {
    clearInterval(this.intervalRef);
    this.intervalRef = null;
  }

  async checkRevocerJob(activeJobs) {
    for (const job of activeJobs) {
      const rcloneProcess = this.JobService.runningProcesses.get(job.id);
      if (!rcloneProcess || rcloneProcess.killed) {
        await this.jobRepo.updateJobStatus(job.id, STATUS.FAILED);
        await this.jobRepo.updateJobEndTime(job.id, new Date().toLocaleString());
        this.JobService.runningProcesses.delete(job.id);
      }
    }
  }
}

module.exports = JobSchedule;
