const router = require("express").Router()
const tkStore = require("../util/tkstore")
const tkIssueing= require("../util/tkissuing")

router.get("/revoke/:address?", async (req, res) => {
  const response = await tkIssueing.revoke(req.query.address)
  const msg = `<pre>${JSON.stringify(response, null, 2)}</pre>`
  res.send("<p>Claims were revoked!</p>" + msg + "<br /><p><a href='/'>Home</a></p>" )
})

router.get("/listClaims", async (req, res) => {
  const claims = await tkStore.listClaims()
  res.json(claims)
})

module.exports = router