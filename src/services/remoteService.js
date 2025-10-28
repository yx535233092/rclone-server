const remoteRepository = require("../db/remoteRepository");

const remoteService = {
  createRemote: async (name, type, remote_type, protocol, ak, sk, endpoint) => {
    const config = {
      protocol,
      ak,
      sk,
      endpoint,
      remote_type,
    };
    const config_json = JSON.stringify(config);
    const result = await remoteRepository.createRemote(name, type, config_json);
    return result;
  },

  getRemotes: async (type) => {
    const result = await remoteRepository.getRemotes(type);
    return result;
  },

  updateRemote: async (id, name, type, remote_type, protocol, ak, sk, endpoint) => {
    const config = {
      protocol,
      ak,
      sk,
      endpoint,
      remote_type,
    };
    const config_json = JSON.stringify(config);
    const result = await remoteRepository.updateRemote(id, name, type, config_json);
    return result;
  },

  deleteRemote: async (id) => {
    const result = await remoteRepository.deleteRemote(id);
    return result;
  },
};

module.exports = remoteService;
