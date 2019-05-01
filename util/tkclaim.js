const Utils = require('trustedkey-js/utils')

const JWT = require('jsonwebtoken')
const Assert = require('assert')

const tkclaim = module.exports

tkclaim.verify_id_token = function (id_token, cert) {
  // Test id_token first
  Assert.notStrictEqual(id_token, undefined)

  const jwt = JWT.decode(id_token, {
    complete: true
  })
  Assert.notEqual(jwt, null)

  // Verify id token signing key
  let claims

  try{
    switch (jwt.header.alg) {
    case 'ES256':
      claims = Utils.verifyJws(id_token, cert.publicKey)
      if (claims === null) {
        throw new Error('id_token signed with incorrect EC key')
      }
      Assert.strictEqual(claims.iss, 'https://self-issued.me')
      Assert.deepStrictEqual(claims.sub_jwk, Utils.hexToJwk(cert.publicKey))

      // eslint-disable-next-line no-case-declarations
      if (!claims.aud.includes(cert.endpoint)){
        throw new Error('OAuth - Distributed Claim: invalid id_token, `aud` field mismatch', 400)
      }

      break
    default:
      throw new Error(`Unsupported id_token alg ${jwt.header.alg}`)
    }    
  }
  catch(err){
    throw new Error(err)
  }

  return claims
}

