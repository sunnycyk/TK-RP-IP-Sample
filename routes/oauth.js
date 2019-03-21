const router = require("express").Router()
const TKOAuth = require("../util/tkoauth")
const TKIssuing = require("../util/tkissuing")
const Config = require("../config")
const Url = require("url")
const Host = process.env.HOST || Config.host

const invalidAuth = "Invalid authentication information"
const invalidReq = "Invalid wallet request"

const clients = {
  "login": TKOAuth.genOauthClient(["openid"], "login"),
  "register": TKOAuth.genOauthClient(["openid ", "profile", "phone"], "register"),
  "issue": TKOAuth.genOauthClient(["openid"], "issue")
}

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

let genRoute = flow => (req, res) => {
  let useClaims = flow === "issue"
  // eslint-disable-next-line security/detect-object-injection
  return res.redirect(TKOAuth.getAuthUri(clients[flow], req.query, useClaims))
}

let callback = async(req, res) => {
  let err = req.query.error
  let state = req.query.state

  if (err) {
    res.status(403).send(invalidAuth)
    return
  }

  let userInfo = null
  try {
    // eslint-disable-next-line security/detect-object-injection
    userInfo = await TKOAuth.getCallbackToken(clients[state], req.originalUrl)
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
  switch (state){
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
      let publicKey = userInfo[Config.claims[0]]
      // eslint-disable-next-line no-console
      console.log("Got Public key: ", publicKey)
      const claimValues = {
        name: "Bob A. Smith",
        given_name: "Bob",
        family_name: "Smith",
        gender: "Male",
        birthdate: "120101000000Z",
        // phone_number: {endpoint: Url.resolve(Host, '/claimdetails'), loa: 2.0},
        "https://auth.trustedkey.com/documentID": "X1234567"
      }

      const status = await TKIssuing.issue(publicKey, claimValues)
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
