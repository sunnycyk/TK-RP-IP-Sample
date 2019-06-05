const Config = require('../config')
const DocSig = require('trustedkey-js/services/docsig')
const Storage = require('./storage')

const docsig = new DocSig(Config.walletServiceUrl, Config.clientId, Config.clientSecret, Config.clientId, Config.clientSecret)

module.exports = async (login_hint, selectedClaims, callbackUrl, localPath) => {
  const name = await Storage.upload(localPath)
  const url = Storage.getUrl(name)
  const resp = await docsig.documentSignRequest(login_hint, callbackUrl, url, selectedClaims)
  return resp
}
