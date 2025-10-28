const ws = require("ws");

class WebSocket {
  constructor(server) {
    this.server = server;
    this.ws = null;
    this.clients = new Set();
  }

  async connect() {
    this.ws = new ws.Server({ server: this.server });
    this.ws.on("listening", () => {
      console.log("WebSocket 服务器已启动");
    });
    this.ws.on("connection", (connection) => {
      console.log("客户端连接");
      this.clients.add(connection);
      connection.on("message", (message) => {
        console.log("收到客户端消息:", message.toString());
      });

      connection.on("close", () => {
        this.clients.delete(connection);
      });
    });
  }
}

module.exports = WebSocket;
