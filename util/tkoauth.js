const { Issuer } = require('openid-client')
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
  constructor(scopes, state) {
    this._client = client
    this._scopes = scopes
    this._state = state
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
    return (await this._client).authorizationUrl(Object.assign({
      redirect_uri: Url.resolve(Host, Config.callbackRoute),
      scope: ' '.join(this._scopes),
      state: this._state
    }, query, claims ? {claims: this._genClaims(claims)} : {}))
  }

  async getCallbackToken(url, query, state, response_type) {
    return (await this._client).authorizationCallback(url, query, {state, response_type})
  }
}

module.exports = OpenIDClient
