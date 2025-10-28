// 基础校验
const validateRequired = (value, fieldName) => {
  if (value === undefined || value === null || value === "") {
    throw new Error(`${fieldName} 是必填字段`);
  }
  return true;
};

// 字符串长度校验
const validateLength = (value, min, max, fieldName) => {
  if (typeof value !== "string") {
    throw new Error(`${fieldName} 必须是字符串`);
  }
  if (value.length < min || value.length > max) {
    throw new Error(`${fieldName} 长度必须在 ${min}-${max} 字符之间`);
  }
  return true;
};

// 邮箱校验
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new Error("邮箱格式不正确");
  }
  return true;
};

// URL 校验
const validateUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    throw new Error("URL 格式不正确");
  }
};

// 数字范围校验
const validateRange = (value, min, max, fieldName) => {
  const num = Number(value);
  if (isNaN(num)) {
    throw new Error(`${fieldName} 必须是数字`);
  }
  if (num < min || num > max) {
    throw new Error(`${fieldName} 必须在 ${min}-${max} 之间`);
  }
  return true;
};

module.exports = {
  validateRequired,
  validateLength,
  validateEmail,
  validateUrl,
  validateRange,
};
