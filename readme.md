# Rclone 迁移工具 v1.0.0

## 技术选型

- **后端：**Nodejs
- **数据库：**Sqlite
- **异步：**child_process + scheduler
- **命令：**Rclone
- **前端：**React19

## 架构：分层架构

- **视图层**：用户交互与数据展示
- **接口层**：接受、响应 Http 请求，处理路由和输入校验
- **服务层**：核心业务逻辑：
  - JobService:任务状态机
  - JobScheduler:任务调度器
  - Websocket：实时解析推送
- **数据层**：Sqlite 数据库交互

## 实体定义

1. 配置

- 描述：存储所有外部云存储服务的凭证与参数
- 属性：
  - ID
  - 名称
  - 类型
  - 详细配置信息
- 映射表： remotes

2. 任务

- 描述：存储完整的文件迁移记录
- 属性：
  - ID
  - 状态
  - 路径
  - 进程信息
  - 统计数据
- 映射表：jobs

## 数据库表结构设计

1. remotes 配置表

- id integer primary key 配置唯一 id
- name text not null,unique remote 名称
- type text not null 存储类型（如 s3、drive）
- config_json text not null 详细配置信息

2. jobs 任务表

- status text not null 状态：NEW、QUEUED、RUNNING、CANCELED、COMPLETED、FAILED
- source_remote text not null 源路径
- target_remote text not null 目标路径
- rclone_options text null 额外的命令行配置
- pid integer null 当前运行的进程 id
- start_time text null 开始时间
- end_time text null 完成/失败时间
- total_size_bytes integer default 0 最终统计：总迁移大小

## 核心状态机设计

1. 状态

- NEW：任务提交入库，等待调度器调取
- QUEUED：被调度器选取，进入队列
- RUNNING：运行迁移
- CANCELED ：任务取消，**终结态**
- FAILED：任务失败，**终结态**
- COMPLETED：任务成功，**终结态**

2. 事件
   ｜ 事件 ｜ 触发条件 ｜ 允许的起始状态 ｜ 目标状态 ｜ 后端操作 ｜
   ｜-------｜-----------｜----------------｜----------｜-----------｜
   ｜ SUBMIT | 用户提交任务 ｜(None) | NEW ｜写入 db、初始化参数｜
   ｜ SCHEDULE ｜检测到 NEW 任务｜ NEW ｜ QUEUED ｜ 更新 db 状态｜
   ｜ START ｜ 调度器确认可用｜ SCHEDULE ｜ RUNNING ｜启动 rclone 进程｜
   ｜ COMPLETE ｜ rclone 进程完成｜ RUNNING ｜ COMPLETE ｜ 记录最终统计数据｜
   ｜ FAIL ｜ 退出码非 0 或启动失败｜ RUNNING，QUEUED ｜ FAILED ｜记录 endtime ｜
   ｜ CANCEL ｜ 取消任务 ｜ NEW，QUEUED，RUNNING ｜ CANCELED ｜发送 SIGTERM 信号｜
   | RECOVER | 任务为 RUNNING，pid 丢失｜ RUNNING ｜ FAILED ｜ 标记失败｜
   ｜ RETRY ｜ 重试已失败或已取消｜ FAILED，CANCELED，COMPLETE ｜ NEW ｜ 清除原信息，重置状态为 new ｜

3. 状态流转图
   state NEW {
   NEW -> QUEUED:E:SCHEDULE
   NEW -> CANCELED:E:CANCEL
   }
   state QUEUED {
   QUEUED -> RUNNING:E:START
   QUEUED -> CANCELED:E:CANCEL
   QUEUED -> FAILED:E:FAIL
   }
   state RUNNING {
   RUNNING -> COMPLETE:COMPLETE
   RUNNING -> FAILED:E:FAIL
   RUNNING -> CANCELED:E:CANCEL
   RUNNING -> FAILED:E:RECOVER
   }
   state CANCELED {
   CANCELED -> NEW:E:RETRY
   }
   state FAILED {
   FAILED -> NEW:E:RETRY
   }
   state COMPLETED {
   COMPLETED -> NEW:E:RETRY
   }
