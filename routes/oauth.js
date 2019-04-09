const router = require("express").Router()
const OpenIDClient = require("../util/tkoauth")
const TKIssuing = require("../util/tkissuing")
const Config = require("../config")

const invalidAuth = "Invalid authentication information"
const invalidReq = "Invalid wallet request"

const clients = {
  "login": new OpenIDClient(["openid"], "login"),
  "register": new OpenIDClient(Config.registerScopes, "register"),
  "issue": new OpenIDClient(["openid"], "issue")
}

// TODO: refactor this using the OIDC lib
function getDistributedClaimDetails(userInfo, claimName){
  let claimObj = {}
  if (userInfo && userInfo.hasOwnProperty('_claim_names') && userInfo._claim_names.hasOwnProperty(claimName)){
    // eslint-disable-next-line security/detect-object-injection
    const claimDetails = userInfo._claim_sources[userInfo._claim_names[claimName]]

    // eslint-disable-next-line security/detect-object-injection
    const claimSerialNo = userInfo._claim_names[claimName]
    claimObj = {...claimDetails, claimSerialNo}
  }
  return claimObj
}

let genRoute = flow => async(req, res) => {
  let claims = null
  if (flow === 'issue') {
    claims = {userinfo: {'https://auth.trustedkey.com/publicKey':{essential:true}}}
  }
  // eslint-disable-next-line security/detect-object-injection
  const url = await clients[flow].getAuthUri(req.query, claims)
  return res.redirect(url)
}

let callback = async(req, res) => {
  const err = req.query.error
  const flow = OpenIDClient.getCallbackFlow(req)

  if (err) {
    res.status(403).send(invalidAuth)
    return
  }

  let userInfo = null
  try {
    // eslint-disable-next-line security/detect-object-injection
    userInfo = await clients[flow].getCallbackToken(req)
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e.message)
    res.status(403).send(invalidReq)
    return
  }

  if (!userInfo) {
    // eslint-disable-next-line no-console
    console.error("No token was received")
    res.status(403).send(invalidReq)
    return
  }

  let tokenMSG = `
    <p>Token:</p>
    <pre>${JSON.stringify(userInfo, null, 2)}</pre>
    <br />
    <p><a href='/'>Home</a></p>
  `
  switch (flow) {
  case 'login':
  {
    return res.send(tokenMSG)
  }
  case 'register':
  {
    // Get ByRef claim endpoint, if any
    const issuedDCClaim = getDistributedClaimDetails(userInfo, 'phone_number')

    let dcClaim = await TKIssuing.fetchDistributedClaimValue(issuedDCClaim.claimSerialNo, issuedDCClaim.endpoint, issuedDCClaim.access_token)
    if (dcClaim && dcClaim.value){

      // Update distributed claim access_token since it is required for dynamic fetch of claim value
      TKIssuing.updateDistributedClaim(issuedDCClaim.claimSerialNo, issuedDCClaim.access_token)

      tokenMSG += `</br><p>Distributed Claim Value: ${dcClaim.value}</p>`
    }

    return res.send(tokenMSG)
  }
  case 'issue':
  {
    try {
      let publicKey = userInfo['https://auth.trustedkey.com/publicKey']
      // eslint-disable-next-line no-console
      console.log("Got Public key: ", publicKey)
      const status = await TKIssuing.issue(publicKey, Config.issuanceClaims)
      // get Claim
      if (status === true) {
        // eslint-disable-next-line no-constant-condition
        while (true) {
          try {
            const pems = await TKIssuing.getClaims(publicKey)
            TKIssuing.storeClaim(publicKey, pems) // store claim
            break
          } catch (err) {
            if (err.message !== 'The operation is pending.') {
              throw err
            }
          }
        }
      }

      return res.send("<p>Claims were issued!</p>" + tokenMSG)
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e.message)
      const msg = "Error: Could not issue claims. If you do not have any internal syntax errors, then please ensure you have requested issuing features on devportal"
      return res.status(500).send(msg)
    }
  }
  }
}

router.get("/login/:login_hint?", genRoute("login"))
router.get("/register/:login_hint?", genRoute("register"))
router.get("/issue/:login_hint?", genRoute("issue"))
router.get(Config.callbackRoute, callback)

module.exports = router
