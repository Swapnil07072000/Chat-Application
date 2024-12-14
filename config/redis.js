require("dotenv").config();
const redis = require('redis');

class RedisClient {
  constructor() {
    this.client = null;
    this.initiateConnection();
  }

  async initiateConnection(){
    return
    const redis_username = process.env.REDIS_USERNAME;
    const redis_password = process.env.REDIS_PASSWORD;
    const redis_host = process.env.REDIS_HOST;
    const redis_port = process.env.REDIS_PORT;

    const redis_url = `redis://${redis_username}:${redis_password}@${redis_host}:${redis_port}`;

    this.client = redis.createClient({
      url: redis_url,
    });
    await this.client.connect();
    // console.log("AAAA");
    this.client.on("error", (err) => {
      console.error("Redis error: " + err);
    });
  }

  async connect() {
    try {
      await this.client.connect();
      console.log("Redis connected successfully");
    } catch (error) {
      console.error("Redis connection error: " + error);
    }
  }

  getClient() {
    return this.client;
  }
}

module.exports = RedisClient;
