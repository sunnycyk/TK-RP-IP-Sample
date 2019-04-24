const Redis = require('ioredis')
const { redisUrl } = require('../config')

class LocalCache {
  constructor() {
    this._cache = {}
  }
  set(key, val) {
    // eslint-disable-next-line security/detect-object-injection
    this._cache[key] = val
  }
  async get(key) {
    // eslint-disable-next-line security/detect-object-injection
    return this._cache[key]
  }
}

module.exports = redisUrl ? new Redis(redisUrl) : new LocalCache()
