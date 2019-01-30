const IssuerService = require(
  'trustedkey-js/services/trustedkeyissuerservice')
const CredentialRegistryService = require('trustedkey-js/services/credentialregistryservice')
const tkStore = require("./tkstore")
const config = require("../config")


const url = config.issuerServiceUrl
const clientId = process.env.CLIENTID || config.clientId
const clientSecret = process.env.CLIENTSECRET || config.clientSecret
const issuerService = new IssuerService(url, clientId, clientSecret)
const credentialRegistryService = new CredentialRegistryService(url, clientId, clientSecret)

/*
 * NOTE: Sorry for the bad naming
 * "requestImageClaims" = issue claims to wallet with optional image
 */
var issue = (publicKey, attrs) => {
  let expiry = new Date()
  expiry.setFullYear(expiry.getFullYear() + config.expiryYears)
  const requestid = tkStore.createRequestId(publicKey)
  return issuerService.requestImageClaims({
    'requestid' : requestid,
    'attributes': attrs,
    'expiry': expiry,
    'pubkey': publicKey,
  })
}

var getClaims = (publicKey) => {
  const requestid = tkStore.getRequestIdByPubkey(publicKey)
  return issuerService.getClaims(requestid, publicKey)
}

var storeClaim = (pems) => {
  // last pems is issuer
  pems.slice(0, -1).map(pem => {
    tkStore.storeClaim(pem)
  });
}

var revoke = (claimId) => {
  return credentialRegistryService.revokeClaim(claimId)
}

module.exports.issue = issue
module.exports.getClaims = getClaims
module.exports.revoke = revoke
module.exports.storeClaim = storeClaim
