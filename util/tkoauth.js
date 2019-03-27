const { Issuer } = require('openid-client')
const UUID = require('uuid')
const Url = require("url")
const Config = require("../config")
const Host = Config.host
const clientId = Config.clientId
const clientSecret = Config.clientSecret

const client = (async() => {
  const issuer = await Issuer.discover(Config.walletServiceUrl)
  return new issuer.Client({
    client_id: clientId,
    client_secret: clientSecret
  })
})()

/*
 * Generic class for OIDC abstractions
 */
class OpenIDClient {
  constructor(scopes, flow) {
    this._client = client
    this._scopes = scopes
    this._flow = flow
    this._nonces = {}
  }

  static getCallbackFlow(req) {
    return req.query.state.split(':')[0]
  }

  _genClaims(claims) {
    let userinfo = claims.reduce((dict, claim) => {
      // eslint-disable-next-line security/detect-object-injection
      dict[claim] = {essential: true}
      return dict
    }, {})
    return JSON.stringify({
      userinfo: userinfo
    })
  }

  async getAuthUri(query, claims) {
    const nonce = UUID.v4()
    const id = UUID.v4()
    // eslint-disable-next-line security/detect-object-injection
    this._nonces[id] = nonce
    return (await this._client).authorizationUrl(Object.assign({
      redirect_uri: Url.resolve(Host, Config.callbackRoute),
      scope: this._scopes.join(' '),
      state: this._flow + ':' + id,
      nonce
    }, query, claims ? {claims: this._genClaims(claims)} : {}))
  }

  async getCallbackToken(req) {
    const url = req.protocol + '://' + req.get('host') + req.originalUrl.split('?').shift()
    const client = await this._client
    const params = client.callbackParams(req)
    const state = req.query.state
    const nonce = this._nonces[state.split(':')[1]]
    const token = await client.authorizationCallback(url, params, {state, nonce, response_type: 'code'})
    return client.userinfo(token.access_token) 
  }
}

module.exports = OpenIDClient
