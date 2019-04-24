const RP = require("request-promise-native")

const IssuerService = require(
  'trustedkey-js/services/trustedkeyissuerservice')
const CredentialRegistryService = require('trustedkey-js/services/credentialregistryservice')
const TKStore = require("./tkstore")
const Config = require("../config")
const Claims = require('trustedkey-js/claims')
const OID = require('trustedkey-js/oid')
const Utils = require('trustedkey-js/utils')

const url = Config.issuerServiceUrl
const clientId = Config.clientId
const clientSecret = Config.clientSecret
const issuerService = new IssuerService(url, clientId, clientSecret)
const credentialRegistryService = new CredentialRegistryService(url, clientId, clientSecret)

const tkissuing = module.exports


// Create a map that maps OIDs to their canoniclized OpenID Connect claim name
const OidToClaim = new Map(
  Object.entries(Claims)
    .map(k => k.reverse())
    .filter(k => !/_verified$/.test(k))
)

function getClaimDetails(pem){
  const claimCert = Utils.parsePem(pem)

  let claim = {}
  claim.serialNo = claimCert.serialNo
  //claim.issuerName
  //claim.IssuerID

  claim.attributes = []

  for(const attr of claimCert.attributes){
    // normalize the oid
    const oid = attr.oid.replace('.53318295.', '.51341.')

    switch (oid){
    case OID.documentType:
    case OID.documentName:
      claim.documentName = attr.value
      break
    case OID.documentClass:
      claim.documentClass = attr.value
      break
    case OID.levelOfAssurance:
      claim.levelOfAssurance = attr.value
      break
    case OID.endpoint:
      claim.endpoint = attr.value
      break
    default: {
      let claimAttr = {}
      claimAttr.name = OidToClaim.get(oid) || oid
      claimAttr.path = oid
      claimAttr.value = attr.value // TODO: Check for DateOID
      claim.attributes.push(claimAttr)
      break
    }
    }
  }
  return claim
}

tkissuing.issue = (publicKey, attrs) => {
  let expiry = new Date()
  expiry.setFullYear(expiry.getFullYear() + Config.expiryYears)
  const requestid = TKStore.createRequestId(publicKey)
  return issuerService.requestImageClaims({
    'requestid' : requestid,
    'attributes': attrs,
    'expiry': expiry,
    'pubkey': publicKey,
  })
}

tkissuing.getClaims = async publicKey => {
  const requestid = await TKStore.getRequestIdByPubkey(publicKey)
  return issuerService.getClaims(requestid, publicKey)
}

tkissuing.storeClaim = async(publicKey, pems) => {
  // last pems is issuer
  for (const pem of pems.slice(0, -1)) {
    const claim = getClaimDetails(pem)
    await TKStore.storeClaim(claim)
    if (claim.endpoint) {
      await TKStore.storeDistributedClaim(publicKey, claim.serialNo, claim.endpoint)
    }
  }
}

tkissuing.revoke = (claimId) => credentialRegistryService.revokeClaim(claimId)

tkissuing.fetchDistributedClaimValue = async (claimSerialNo, claimEndpoint, id_token) => {
  let claim
  if (claimEndpoint) {
    claim = await RP({
      uri: claimEndpoint + `?claimSerialNo=${claimSerialNo}`,
      method: 'GET',
      headers: {
        'Authorization': 'Bearer ' + id_token
      },
      json: true
    })
  }
  return claim
}
