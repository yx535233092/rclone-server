function paramsValid(params) {
  params.forEach((item) => {
    if (item === undefined || item === null) {
      return false;
    }
  });
  return true;
}

module.exports = paramsValid;
