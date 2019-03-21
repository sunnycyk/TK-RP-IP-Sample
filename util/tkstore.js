// const Utils = require('trustedkey-js/utils')
const ValidateService = require('trustedkey-js/services/validateservice')
const Uuid = require('uuid')
const Config = require('../config')

const url = Config.issuerServiceUrl
const validateService = new ValidateService(url)

module.exports = {
  requests: {},
  claims: [],
  dcClaims: [],
  createRequestId: function (pubkey) {
    // eslint-disable-next-line security/detect-object-injection
    this.requests[pubkey] = Uuid.v4()

    // eslint-disable-next-line security/detect-object-injection
    return this.requests[pubkey]
  },
  getRequestIdByPubkey: function (pubkey) {
    // eslint-disable-next-line security/detect-object-injection
    return this.requests[pubkey]
  },
  storeClaim: function (claim) {
    this.claims.push(claim)
  },
  listClaims: async function () {
    const claims = await Promise.all(this.claims.map(async claim => {
      return {
        ...claim,
        valid: await this.validateClaims(claim.serialNo),
        dc: this.dcClaims[claim.serialNo]
      }
    }))

    // remove claims that are revoked from the store
    this.claims = claims.filter(claim => claim.valid === true)
    return this.claims
  },
  validateClaims: function (claimSerialNumber) {
    const serialNo = claimSerialNumber.replace('0x', '')
    return validateService.validateClaims([serialNo])
  },
  storeDistributedClaim: function (publicKey, claimSerialNo, endpoint) {
    //const status = claimsColl.insert({publicKey: publicKey, serialNo: claimSerialNo, claimEndpoint: claimEndpoint, value: claimValue})

    // Issue fake value    
    const value = Math.floor(Math.random() * 1000000000)

    // eslint-disable-next-line security/detect-object-injection
    if (!this.dcClaims[claimSerialNo]) {
      // eslint-disable-next-line security/detect-object-injection
      this.dcClaims[claimSerialNo] = {
        serialNo: claimSerialNo,
        publicKey,
        endpoint,
        value
      }
    }
    // eslint-disable-next-line security/detect-object-injection
    return this.dcClaims[claimSerialNo]
  },
  updateDistributedClaim: function (claimSerialNo, access_token) {
    // eslint-disable-next-line security/detect-object-injection
    if (this.dcClaims[claimSerialNo]) {
      // eslint-disable-next-line security/detect-object-injection
      this.dcClaims[claimSerialNo]['access_token'] = access_token
    }
  },
  getDistributedClaim: function (claimSerialNo) {
    // eslint-disable-next-line security/detect-object-injection
    return this.dcClaims[claimSerialNo]
  }
}