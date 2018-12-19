const Utils = require('trustedkey-js/utils')
const ValidateService = require('trustedkey-js/services/validateservice')
const Uuid = require('uuid')
const config = require('../config')

const url = config.issuerServiceUrl
const validateService = new ValidateService(url)
module.exports = {
  requests: {},
  claims: [],
  createRequestId: function(pubkey) {
    this.requests[pubkey] = Uuid.v4()
    return this.requests[pubkey]
  },
  getRequestIdByPubkey: function(pubkey) {
    return this.requests[pubkey]
  },
  storeClaim: function(pem) {
    const { serialNo } = Utils.parsePem(pem)
    this.claims.push(serialNo)
  },
  listClaims: async function() {
    const claims = await Promise.all(this.claims.map( async claimSerialNumber => {
      return {
        claimId: claimSerialNumber,
        valid: await this.validateClaims(claimSerialNumber)
      }
    }))
    // remove claims that are revoked from the store
    this.claims = claims.filter( claim => claim.valid === true ).map( claim => claim.claimId )
    return this.claims
  },
  validateClaims: function(claimSerialNumber) {
    const serialNo = /^0x/.test(claimSerialNumber) ? claimSerialNumber.substring(2) : claimSerialNumber
    return validateService.validateClaims([serialNo])
  }
}