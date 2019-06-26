const router = require("express").Router()
const OpenIDClient = require("../util/tkoauth")
const TKIssuing = require("../util/tkissuing")
const TKStore = require("../util/tkstore")
const Config = require("../config")
const invalidAuth = "Invalid authentication information"
const invalidReq = "Invalid wallet request"
const Url = require("url")

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
    console.error(e)
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
    const issuedDCClaim = getDistributedClaimDetails(userInfo, 'address')

    let dcClaim = await TKIssuing.fetchDistributedClaimValue(issuedDCClaim.claimSerialNo, issuedDCClaim.endpoint, issuedDCClaim.access_token)
    if (dcClaim && dcClaim.value){

      // Update distributed claim access_token since it is required for dynamic fetch of claim value
      await TKStore.updateDistributedClaim(issuedDCClaim.claimSerialNo, issuedDCClaim.access_token)

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
      const claimsRequest = JSON.parse(await OpenIDClient.getClaimRequest(req))
      var issuanceClaims = {}
      if (Object.keys(claimsRequest).length === 0) { // all Claims
        issuanceClaims = Config.issuanceClaims
      } else { // individual Claim
        // always pointing to same docRef
        const field = Object.keys(claimsRequest)[0]
        switch (field) {
        case 'address':
          issuanceClaims = {
            address:{
              formatted: {
                endpoint: Url.resolve(Config.host, '/claimdetails'),
                loa: 1.0
              },
            },
          }
          break
        case 'documentId':
          issuanceClaims = {
            // eslint-disable-next-line security/detect-object-injection
            "https://auth.trustedkey.com/docRef": claimsRequest[field]
          }
          break
        case 'club_code':
          issuanceClaims = {
            // eslint-disable-next-line security/detect-object-injection
            "1.2.3.4.5" : claimsRequest[field]
          }
          break
        default:
          issuanceClaims = claimsRequest
        }
        // add docRef
        issuanceClaims = { "https://auth.trustedkey.com/docRef": "docRef123", ...issuanceClaims }
      }
      // issue Claim
      const status = await TKIssuing.issue(publicKey, issuanceClaims)
      // get Claim
      if (status === true) {
        // eslint-disable-next-line no-constant-condition
        while (true) {
          try {
            const pems = await TKIssuing.getClaims(publicKey)
            await TKIssuing.storeClaim(publicKey, pems) // store claim
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
      console.error(e)
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
