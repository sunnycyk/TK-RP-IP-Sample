const Config = require("../config")
const Utils = require('trustedkey-js/utils')

const JWT = require('jsonwebtoken')
const Assert = require('assert')

const tkclaim = module.exports

tkclaim.verify_id_token = function (clientId, id_token, publicKey) {
  // Test id_token first
  Assert.notStrictEqual(id_token, undefined)

  const jwt = JWT.decode(id_token, {
    complete: true
  })
  Assert.notEqual(jwt, null)

  // const rpAuthRedirectUri = `${Config.walletServiceUrl}${Config.callbackRoute}`
  const expectedCallbackUrl = `${Config.walletServiceUrl}/oauth/completeLogin`

  // Verify id token signing key
  let claims, audWithoutGuid
  let currentHost = 'https://localhost'

  try{
    switch (jwt.header.alg) {
    case 'ES256':
      claims = Utils.verifyJws(id_token, publicKey)
      if (claims === null) {
        throw new Error('id_token signed with incorrect EC key')
      }
      Assert.strictEqual(claims.iss, 'https://self-issued.me')
      Assert.deepStrictEqual(claims.sub_jwk, Utils.hexToJwk(publicKey))
      audWithoutGuid = claims.aud.map(aud => aud.replace(/\?guid=.+$/, ''))

      if (Config.host.indexOf('localhost') === -1){
        currentHost = Config.host
      }
      Assert.deepStrictEqual(audWithoutGuid, [clientId, currentHost, expectedCallbackUrl])
      break
    default:
      throw new Error(`Unsupported id_token alg ${jwt.header.alg}`)
    }    
  }
  catch(err){
    throw new Error(err)
  }

  // if (Globals.nonce) {
  //   Assert.strictEqual(claims.nonce, Globals.nonce)
  // }
  // if (claims.at_hash) {
  //   Assert.strictEqual(claims.at_hash, Utils.base64url(Utils.sha256(claim_access_token).slice(0, 16)))
  // }
  // if (jwt.header.kid === OpenId.getKid()) {
  //   Assert.strictEqual(claims.azp, 'AppId-for-RelyingParty-softkey')
  // } else {
  //   Assert.strictEqual(claims.azp, clientId)
  // }

  return claims
}

