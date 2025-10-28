const errorHandler = (app) => {
  // 基本错误处理
  app.use((req, res) => {
    res.status(404).json({ error: "Not Found" });
  });

  app.use((err, req, res, next) => {
    res.status(500).json({ error: err.message });
  });
};

module.exports = errorHandler;
