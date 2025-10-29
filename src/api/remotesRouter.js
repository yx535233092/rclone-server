const express = require("express");
const router = express.Router();
const { validateRequired } = require("../utils/paramsValid");
const remoteService = require("../services/remoteService");

/**
 * 添加配置
 * @param {string} name 配置名称
 * @param {string} type 配置类型
 * @param {string} protocol 配置协议
 * @param {string} ak 配置访问密钥
 * @param {string} sk 配置访问密钥
 * @param {string} endpoint 配置访问端点
 * @returns {object} 返回添加配置的响应信息
 */
router.post("/", async (req, res) => {
  const { name, type, remote_type, protocol, ak, sk, endpoint } = req.body;
  // 校验参数
  try {
    validateRequired(name, "name");
    validateRequired(type, "type");
    validateRequired(remote_type, "remote_type");
    validateRequired(protocol, "protocol");
    validateRequired(ak, "ak");
    validateRequired(sk, "sk");
    validateRequired(endpoint, "endpoint");
  } catch (error) {
    return res.json({
      code: 400,
      message: error.message,
    });
  }
  // 入库
  try {
    const result = await remoteService.createRemote(name, type, remote_type, protocol, ak, sk, endpoint);
    return res.json({
      code: 200,
      message: "添加配置成功",
      data: result,
    });
  } catch (error) {
    console.log(error);
    return res.json({
      code: 500,
      message: "添加配置失败",
      error: error.message,
    });
  }
});

/**
 * 获取配置列表
 * @param {string} type 配置类型
 * @returns {object} 返回配置列表的响应信息
 */
router.get("/", async (req, res) => {
  const { type } = req.query;
  validateRequired(type, "type");
  try {
    const result = await remoteService.getRemotes(type);
    return res.json({
      code: 200,
      message: "获取配置列表成功",
      data: result,
    });
  } catch (error) {
    console.log(error);
    return res.json({
      code: 500,
      message: "获取配置列表失败",
      error: error.message,
    });
  }
});

/**
 * 编辑配置
 * @param {string} id 配置ID
 * @param {string} name 配置名称
 * @param {string} type 配置类型
 * @param {string} remote_type 配置远程类型
 * @param {string} protocol 配置协议
 * @param {string} ak 配置访问密钥
 * @param {string} sk 配置访问密钥
 * @param {string} endpoint 配置访问端点
 * @returns {object} 返回编辑配置的响应信息
 */
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { name, type, remote_type, protocol, ak, sk, endpoint } = req.body;
  validateRequired(id, "id");
  validateRequired(name, "name");
  validateRequired(type, "type");
  validateRequired(remote_type, "remote_type");
  validateRequired(protocol, "protocol");
  validateRequired(ak, "ak");
  validateRequired(sk, "sk");
  validateRequired(endpoint, "endpoint");
  try {
    const result = await remoteService.updateRemote(id, name, type, remote_type, protocol, ak, sk, endpoint);
    return res.json({
      code: 200,
      message: "编辑配置成功",
      data: result,
    });
  } catch (error) {
    console.log(error);
    return res.json({
      code: 500,
      message: "编辑配置失败",
      error: error.message,
    });
  }
});

/**
 * 删除配置
 * @param {string} id 配置ID
 * @returns {object} 返回删除配置的响应信息
 */
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  validateRequired(id, "id");
  try {
    const result = await remoteService.deleteRemote(id);
    return res.json({
      code: 200,
      message: "删除配置成功",
      data: result,
    });
  } catch (error) {
    console.log(error);
    return res.json({
      code: 500,
      message: "删除配置失败",
      error: error.message,
    });
  }
});

module.exports = router;
