const Router = require("express").Router()
const TKStore = require("../util/tkstore")
const TKIssuing = require("../util/tkissuing")
const TKClaim = require('../util/tkclaim')

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

  try {
    // retrieve distributed claim from db
    const claimSerialNo = req.query.claimSerialNo
    const dcClaim = await TKStore.getDistributedClaim(claimSerialNo) || {}
    if (dcClaim.endpoint) {
    // validate id_token
      TKClaim.verify_id_token(token[1], dcClaim)
      return res.json(dcClaim)
    }
    return res.json({})
  } catch(e) {
    // eslint-disable-next-line no-console
    console.error('Claim Details Error: ', e)
    res.status(500).json({err: e.message})
  }
})

module.exports = Router
