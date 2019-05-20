const ValidateService = require('trustedkey-js/services/validateservice')
const Uuid = require('uuid')
const Config = require('../config')
const Cache = require('./cache')

const requestsPrefix = 'requests-'
const claimsKey = 'claims'
const dcClaimsKey = 'dcClaims'
const url = Config.issuerServiceUrl
const validateService = new ValidateService(url)

const getClaims = async() => JSON.parse(await Cache.get(claimsKey) || '[]')
const getDcClaims = async() => JSON.parse(await Cache.get(dcClaimsKey) || '{}')
const setClaims = claims => Cache.set(claimsKey, JSON.stringify(claims))
const setDcClaims = dcClaims => Cache.set(dcClaimsKey, JSON.stringify(dcClaims))

const validateClaims = claimSerialNumber => {
  const serialNo = claimSerialNumber.replace('0x', '')
  return validateService.validateClaims([serialNo])
}

const storage = module.exports

storage.createRequestId = pubkey => {
  const id = Uuid.v4()
  Cache.set(requestsPrefix + pubkey, id)
  return id
}

storage.getRequestIdByPubkey = pubkey => Cache.get(requestsPrefix + pubkey)

storage.storeClaim = async (publicKey, claim) => {
  const claims = await getClaims()
  claims.push({publicKey, ...claim})
  setClaims(claims)
}

storage.listClaims = async () => {
  let claims = await getClaims()
  const dcClaims = await getDcClaims()
  for (const claim of claims) {
    claim.valid = await validateClaims(claim.serialNo)
    claim.dc = dcClaims[claim.serialNo]
  }
  // remove claims that are revoked from the store
  claims = claims.filter(claim => claim.valid === true)
  setClaims(claims)
  return claims
}

storage.storeDistributedClaim = async (publicKey, claimSerialNo, endpoint) => {
  const dcClaims = await getDcClaims()

  // Issue fake value    
  const value = Math.floor(Math.random() * 1000000000)

  // eslint-disable-next-line security/detect-object-injection
  if (!dcClaims[claimSerialNo]) {
    // eslint-disable-next-line security/detect-object-injection
    dcClaims[claimSerialNo] = {
      serialNo: claimSerialNo,
      publicKey,
      endpoint,
      value
    }
    setDcClaims(dcClaims)
  }

  // eslint-disable-next-line security/detect-object-injection
  return dcClaims[claimSerialNo]
}

storage.updateDistributedClaim = async (claimSerialNo, access_token) => {
  const dcClaims = await getDcClaims()
  // eslint-disable-next-line security/detect-object-injection
  if (dcClaims[claimSerialNo]) {
    // eslint-disable-next-line security/detect-object-injection
    dcClaims[claimSerialNo]['access_token'] = access_token
    setDcClaims(dcClaims)
  }
}

storage.getDistributedClaim = async claimSerialNo => {
  const dcClaims = await getDcClaims()
  // eslint-disable-next-line security/detect-object-injection
  return dcClaims[claimSerialNo]
}
