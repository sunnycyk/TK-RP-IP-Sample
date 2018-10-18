const router = require("express").Router()
const tkOAuth = require("../util/tkoauth")
const tkIssuing = require("../util/tkissuing")
const config = require("../config")

const invalidAuth = "Invalid authentication information"
const invalidReq = "Invalid wallet request"

const clients = {
  "login": tkOAuth.genOauthClient(["openid"], "login"),
  "register": tkOAuth.genOauthClient(["openid", "profile"], "register"),
  "issue": tkOAuth.genOauthClient(["openid"], "issue")
}

let genRoute = flow => (req, res) => {
  let useClaims = flow == "issue"
  return res.redirect(tkOAuth.getAuthUri(clients[flow], req.query, useClaims))
}

let callback = async(req, res) => {
  let err = req.query.error
  let state = req.query.state

  if (err) {
    res.status(403).send(invalidAuth)
    return
  }

  let token = null
  try {
    token = await tkOAuth.getCallbackToken(clients[state], req.originalUrl)
  } catch (e) {
    console.error(e.message)
    res.status(403).send(invalidReq)
    return
  }

  if (!token) {
    console.error("No token was received")
    res.status(403).send(invalidReq)
    return
  }

  try {
    let publicKey = token[config.claims[0]]
    console.log("Got Public key: ", publicKey)
    const claimValues = {
      surname: "Bob Smith",
      organization: "Acme Inc"
    }
    await tkIssuing.issue(publicKey, claimValues)
    res.json({
      claimsIssued: claimValues,
      publicKey: publicKey
    })
  } catch (e) {
    console.error(e.message)
    res.status(500).send("Internal Server Error")
  }
}

router.get("/login/:login_hint?", genRoute("login"))
router.get("/register/:login_hint?", genRoute("register"))
router.get("/issue/:login_hint?", genRoute("issue"))
router.get(config.callbackRoute, callback)

module.exports = router
