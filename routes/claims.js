const Router = require("express").Router()
const TKStore = require("../util/tkstore")
const TKIssuing = require("../util/tkissuing")
const TKClaim = require('../util/tkclaim')
const Config = require("../config")


Router.get("/revoke/:address?", async (req, res) => {
  const response = await TKIssuing.revoke(req.query.address)
  const msg = `<pre>${JSON.stringify(response, null, 2)}</pre>`
  res.send("<p>Claims were revoked!</p>" + msg + "<br /><p><a href='/'>Home</a></p>")
})

Router.get("/listClaims", async (req, res) => {
  const claims = await TKStore.listClaims()
  res.json(claims)
})

Router.get("/claimdetails", async (req, res) => {
  // get the id_token from header
  const header = req.headers['authorization']
  if (header === undefined) {
    return res.status(401).send('Unauthorized')
  }

  const token = header.split(/\s+/) || []

  if (token.length !== 2) {
    return res.status(403).send('Forbidden')
  }

  // retrieve distributed claim from db  
  const claimSerialNo = req.query.claimSerialNo
  const dcClaim = TKStore.getDistributedClaim(claimSerialNo) || {}

  if (dcClaim.endpoint) {
    // validate id_token
    TKClaim.verify_id_token(Config.clientId, token[1], dcClaim.publicKey)
    return res.json(dcClaim)
  }
  return res.json({})
})

module.exports = Router