const { Issuer } = require('openid-client')
const UUID = require('uuid')
const Url = require("url")
const Cache = require('./cache')
const Config = require("../config")
const Host = Config.host
const clientId = Config.clientId
const clientSecret = Config.clientSecret

const nonceKeyPrefix = 'nonce-'
const saveNonce = (key, nonce) => Cache.set(nonceKeyPrefix + key, nonce)
const getNonce = key => Cache.get(nonceKeyPrefix + key)

// Our discovery endpoint takes a while :)
Issuer.defaultHttpOptions = { timeout: 3500 }

const getClient = async() => {
  const issuer = await Issuer.discover(Config.walletServiceUrl)
  await issuer.keystore(true)
  const client =  new issuer.Client({
    client_id: clientId,
    client_secret: clientSecret
  })
  client.CLOCK_TOLERANCE = 5 // to allow a 5 second skew
  return client
}

/*
 * Generic class for OIDC abstractions
 */
class OpenIDClient {
  constructor(scopes, flow) {
    this._scopes = scopes
    this._flow = flow
  }

  static getCallbackFlow(req) {
    return req.query.state.split(':')[0]
  }

  async getAuthUri(query, claims) {
    const nonce = UUID.v4()
    const id = UUID.v4()
    saveNonce(id, nonce)
    const client = await getClient()
    return client.authorizationUrl(Object.assign({
      redirect_uri: Url.resolve(Host, Config.callbackRoute),
      scope: this._scopes.join(' '),
      state: this._flow + ':' + id,
      nonce
    }, query, claims ? {claims: JSON.stringify(claims)} : {}))
  }

  async getCallbackToken(req) {
    const url = Url.resolve(Host, Config.callbackRoute)
    const client = await getClient()
    const params = client.callbackParams(req)
    const state = req.query.state
    const nonce = await getNonce(state.split(':')[1])
    const token = await client.callback(url, params, {state, nonce, response_type: 'code'})
    return client.userinfo(token.access_token)
  }
}

module.exports = OpenIDClient
