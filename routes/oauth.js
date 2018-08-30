const router = require("express").Router()
const tkOAuth = require("../util/tkoauth")
const tkIssuing = require("../util/tkissuing")
const config = require("../config")

const invalidAuth = "Invalid authentication information"
const invalidReq = "Invalid wallet request"

let login = (req, res) => res.redirect(tkOAuth.getAuthUri(req.query))

let callback = async(req, res) => {
  let err = req.query.error
  let state = req.query.state

  if (err) {
    res.status(403).send(invalidAuth)
    return
  }

  let token = null
  try {
    token = await tkOAuth.getCallbackToken(req.originalUrl)
  } catch (e) {
    res.status(403).send(invalidReq)
    return
  }

  if (!token) {
    res.status(403).send(invalidReq)
    return
  }

  try {
    let publicKey = token[config.claims[0]]
    const claimValues = {
      surname: "Bob Smith",
      organization: "Acme Inc"
    }
    await tkIssuing.issue(publicKey, claimValues)
    res.json({
      publicKey: publicKey
    })
  } catch (e) {
    console.error(e)
    res.status(500).send("Internal Server Error")
  }
}

router.get("/", (req, res) => res.redirect("/login"))
router.get("/login/:login_hint?", login)
router.get(config.callbackRoute, callback)

module.exports = router
