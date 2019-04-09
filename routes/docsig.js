const Router = require("express").Router()
const Config = require("../config")
const DocSig = require('trustedkey-js/services/docsig')
const Formidable = require('formidable')
const FS = require('fs')

const ourClientId = Config.clientId
const ourSecret = Config.clientSecret

const docsig = new DocSig(Config.walletServiceUrl, Config.clientId, Config.clientSecret, ourClientId, ourSecret)
const Host = Config.host

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

Router.post('/docsig', formParser(), (req, res) => {
  if (!res.locals.files.file) {
    lastStatus = {err: 'File missing'}
    return res.status(400)
  }
  let fileName = res.locals.files.file.name
  FS.readFile(res.locals.files.file.path, (err, dataBuff) => {
    if (err) {
      lastStatus = {err: err.message}
      return res.status(400)
    }
    FS.writeFile(`public/docsig/${fileName}`, dataBuff, (err) => {
      if (err) {
        lastStatus = {err: err.message}
        return res.status(400)
      }

      // eslint-disable-next-line no-unused-vars
      let {login_hint, ...claimFields} =  { ...res.locals.fields }
      let selectedClaims = Object.values(claimFields)
      if (selectedClaims.length === 0) {
        lastStatus = {err: 'No Claim selected'}
        return res.status(400)
      }
      docsig.documentSignRequest(res.locals.fields.login_hint, Host + '/docsig/upload',  Host + '/docsig/' + encodeURIComponent(fileName), selectedClaims)
        .then(json => {
          lastStatus = {docsig: 'Signed PDF will be available soon'}
          res.send({})
        })
        .catch(err => {
          lastStatus = {err: err.message}
          res.status(400)
        })
    })
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