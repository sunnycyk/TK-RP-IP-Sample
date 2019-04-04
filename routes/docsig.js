const Router = require("express").Router()
const Config = require("../config")
const DocSig = require('trustedkey-js/services/docsig')
const OID = require('trustedkey-js/oid')
const Formidable = require('formidable')
const FS = require('fs')

const ourClientId = Config.clientId
const ourSecret = Config.clientSecret

const docsig = new DocSig(Config.walletServiceUrl, Config.clientId, Config.clientSecret, ourClientId, ourSecret)

function formParser() {
  return (req, res, next)  => {
    const form = new Formidable.IncomingForm()
    form.parse(req, (err, fields, files) => {
      if (err) {
        next(err)
      } else {
        res.locals.fields = fields
        res.locals.files = files
        next()
      }
    })
  }
}

let lastStatus = {}

Router.get('/docsig', (req, res) => {
  docsig.documentSignRequest(req.query.login_hint, Config.host + '/docsig/upload', Config.host + '/docsigtest.pdf', [OID.emailAddress])
    .then(json => {
      lastStatus = {docsig: 'Signed PDF will be available soon'}
      res.redirect('/docsig/status?checksum=' + encodeURIComponent(json.data.checksum))
    })
    .catch(err => {
      lastStatus = {docsig: err.message}
      res.redirect('/docsig/status?error=' + encodeURIComponent(err.message))
    })
})

Router.post('/docsig/upload', formParser(), (req, res) => {
  if (res.locals.files.file) {
    const claims = JSON.parse(Buffer.from(req.query.id_token.split('.')[1], 'base64'))
    lastStatus = {
      file: res.locals.files.file.path,
      claims,
      result: req.query.result
    }
    res.json({})
  }
  else {
    let result
    try {
      result = res.locals.fields.data.result
    } catch(e) {
      result = req.query.result
    }
    lastStatus = {
      result
    }
    res.status(400).json(lastStatus)
  }
})

Router.get('/docsig/status', (req, res) => {
  if (lastStatus.file) {
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    FS.readFile(lastStatus.file, (err, dataBuff) => {
      res.set('Content-Type', 'application/pdf').send(dataBuff)
    })
  }
  else {
    res.set('Refresh', '5;url=/docsig/status').json(lastStatus)
  }
})

module.exports = Router
