const Router = require("express").Router()
const Formidable = require('formidable')
const DocSig = require('../util/tkdocsig')
const Cache = require('../util/cache')
const UUID = require('uuid')
const Config = require('../config')
const FS = require('fs')

const Host = Config.host
const callbackRoute = '/docsig/upload'
const defaultStatus = {docsig: 'Signed PDF will be available soon'}
const statusKey = UUID.v4()

const setStatus = status => Cache.set(statusKey, JSON.stringify(status))
const getStatus = async() => JSON.parse(await Cache.get(statusKey) || JSON.stringify(defaultStatus))

const resultCheck = (req, res, next)  => {
  if (req.query.result && req.query.result === 'error') {
    const status = {err: 'User has denied to sign the PDF.'}
    setStatus(status)
    return res.status(400).json(status)
  }
  next()
}

const formParser = (req, res, next)  => {
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

Router.post('/docsig', formParser, async(_, res) => {
  if (!res.locals.files.file) {
    const status = {err: 'File missing'}
    setStatus(status)
    return res.status(400).json(status)
  }
  // eslint-disable-next-line no-unused-vars
  const {login_hint, ...claimFields} =  { ...res.locals.fields }
  const selectedClaims = Object.values(claimFields)
  const localPath = res.locals.files.file.path
  if (selectedClaims.length === 0) {
    const status = {err: 'No Claim selected'}
    setStatus(status)
    return res.status(400).json(status)
  }
  try {
    await DocSig(login_hint, selectedClaims, Host + callbackRoute, localPath)
    res.json({})
  } catch (e) {
    const status = {err: e.message}
    // eslint-disable-next-line no-console
    console.error('Doc Sig Error: ', e)
    setStatus(status)
    res.status(500).json(status)
  }
})

Router.post(callbackRoute, resultCheck, formParser, (req, res) => {
  let status
  if (res.locals.files.file) {
    const claims = JSON.parse(Buffer.from(req.query.id_token.split('.')[1], 'base64'))
    const file = res.locals.files.file.path
    status = {
      result: req.query.result,
      file,
      claims
    }
  } else {
    let result
    try {
      result = res.locals.fields.data.result
    } catch(e) {
      result = req.query.result
    }
    status = {result}
  }
  setStatus(status)
  res.json(status)
})

Router.get('/docsig/status', async(_, res) => {
  try {
    const status = await getStatus()
    if (status.file) {
      // eslint-disable-next-line security/detect-non-literal-fs-filename
      const dataBuff = FS.readFileSync(status.file)
      setStatus(defaultStatus)
      res.set('Content-Type', 'application/pdf').send(dataBuff)
    } else {
      res.set('Refresh', '5;url=/docsig/status').json(status)
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('DocSig Status Error: ', e)
    res.status(500).json({err: e.message})
  }
})

module.exports = Router
