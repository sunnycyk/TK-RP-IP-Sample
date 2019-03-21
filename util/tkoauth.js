const ClientOAuth2 = require('client-oauth2')
const Url = require("url")
const RP = require("request-promise-native")
const Config = require("../config")
const claims = Config.claims
const Host = process.env.HOST || Config.host
const clientId = process.env.CLIENTID || Config.clientId
const clientSecret = process.env.CLIENTSECRET || Config.clientSecret

/*
 * Generic helper method used to generate claims
 * Used for showing how to generate claims for a larger list
 * of claims
 */
let genClaims = () => {
  let userinfo = claims.reduce((dict, claim) => {
    // eslint-disable-next-line security/detect-object-injection
    dict[claim] = null
    return dict
  }, {})
  return JSON.stringify({
    userinfo: userinfo
  })
}

/*
 * Generic helper method used to generate OAuth Client
 */
var genOauthClient = (scopes, state) => new ClientOAuth2({
  clientId: clientId,
  clientSecret: clientSecret,
  accessTokenUri: Url.resolve(Config.walletServiceUrl, '/oauth/token'),
  authorizationUri: Url.resolve(Config.walletServiceUrl, '/oauth/authorize'),
  redirectUri: Url.resolve(Host, Config.callbackRoute),
  scopes: scopes,
  state: state
})

var getAuthUri = (oauthClient, query, useClaims) => {
  useClaims = useClaims || false
  query = query || {}
  if (useClaims) query.claims = genClaims()
  return oauthClient.code.getUri({
    query: query
  })
}

var getCallbackToken = async (oauthClient, originalUrl) => {
  let tok = await oauthClient.code.getToken(originalUrl)
  let accessToken = tok.accessToken
  return await RP({
    uri: Url.resolve(Config.walletServiceUrl, '/oauth/user'),
    method: 'GET',
    headers: {
      'Authorization': 'Bearer ' + accessToken
    },
    json: true
  })
}

module.exports.genOauthClient = genOauthClient
module.exports.getAuthUri = getAuthUri
module.exports.getCallbackToken = getCallbackToken
