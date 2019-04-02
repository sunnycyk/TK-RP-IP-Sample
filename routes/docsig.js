const Router = require("express").Router()
const Config = require("../config")
const DocSig = require('trustedkey-js/services/docsig')

const ourClientId = Config.clientId
const ourSecret = Config.clientSecret

const docsig = new DocSig(Config.walletServiceUrl, Config.clientId, Config.clientSecret, ourClientId, ourSecret)

Router.get('/docsig', (req, res) => {
  docsig.documentSignRequest(req.query.login_hint, Config.host + '/docsig/upload', Config.host + '/docsigtest.pdf', ['2.5.4.3'])
    .then(json => {
      res.redirect('/docsig/status?checksum=' + encodeURIComponent(json.data.checksum))
    })
    .catch(err => {
      res.redirect('/docsig/status?error=' + encodeURIComponent(err.message))
    })
})

let lastStatus = {}

Router.post('/docsig/upload', (req, res) => {
  lastStatus = req.query
  res.json({})
})

Router.get('/docsig/status', (req, res) => {
  res.json(lastStatus)
})

module.exports = Router
