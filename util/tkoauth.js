const ClientOAuth2 = require('client-oauth2')
const Url = require("url")
const rp = require("request-promise-native")
const config = require("../config")

const claims = config.claims
const host = process.env.HOST || config.host
const clientId = process.env.CLIENTID || config.clientId
const clientSecret = process.env.CLIENTSECRET || config.clientSecret
const oauthClient = new ClientOAuth2({
  clientId: clientId,
  clientSecret: clientSecret,
  accessTokenUri: Url.resolve(config.walletServiceUrl, '/oauth/token'),
  authorizationUri: Url.resolve(config.walletServiceUrl, '/oauth/authorize'),
  redirectUri: Url.resolve(host, config.callbackRoute),
  scopes: ["openid"],
  state: "login"
})

/*
 * Generic helper method used to generate claims
 * Used for showing how to generate claims for a larger list
 * of claims
 */
let genClaims = () => {
  let userinfo = claims.reduce((dict, claim) => {
    dict[claim] = null
    return dict
  }, {})
  return JSON.stringify({
    userinfo: userinfo
  })
}

var getAuthUri = query => {
  query = query || {}
  query.claims = genClaims()
  return oauthClient.code.getUri({
    query: query
  })
}

var getCallbackToken = async originalUrl => {
  let tok = await oauthClient.code.getToken(originalUrl)
  let accessToken = tok.accessToken
  return await rp({
    uri: Url.resolve(config.walletServiceUrl, '/oauth/user'),
    method: 'GET',
    headers: {
      'Authorization': 'Bearer ' + accessToken
    },
    json: true
  })
}

module.exports.getAuthUri = getAuthUri
module.exports.getCallbackToken = getCallbackToken
