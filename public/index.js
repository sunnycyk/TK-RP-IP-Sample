/* eslint-env browser */

// eslint-disable-next-line no-unused-vars
function doFlow(flow) {
  var email = document.getElementById("email").value
  email = encodeURIComponent(email.trim())
  window.location.href = "/" + flow + "?login_hint=" + email
}

function _tr() {
  return document.createElement('tr')
}

function _td(text, id) {
  var td = document.createElement('td')

  if (id){
    td.setAttribute('id', id)
  }
  var td_text = document.createTextNode('')
  td.appendChild(td_text)
  td.innerHTML = text
  return td
}

function _tdRevokeButton(serialNumber) {
  var td = document.createElement('td')
  var btn = document.createElement('button')
  var btn_label = document.createTextNode('Revoke')
  btn.appendChild(btn_label)
  btn.onclick = (event) => {
    window.location.href = `/revoke?address=${serialNumber}`
  }
  td.appendChild(btn)
  return td
}

function _tdDistributedClaim(claimText, dcClaim){
  var dcClaimTD = _td(claimText, `dc_${dcClaim.serialNo}`)
  var dcClaimBtn = document.createElement('button')
  var dcClaimBtn_lbl = document.createTextNode('Get Distributed Claim Value')
  dcClaimBtn.appendChild(dcClaimBtn_lbl)

  var dcClaimBtnClickHandler = dcClaimBtn.onclick = function(){
    return this.fetchClaimValue(dcClaim.endpoint + `?claimSerialNo=${dcClaim.serialNo}`, dcClaim.access_token)
  }
  dcClaimBtn.onclick = dcClaimBtnClickHandler.bind(this)

  dcClaimTD.appendChild(dcClaimBtn)
  return dcClaimTD
}

// eslint-disable-next-line no-unused-vars
function fetchClaimValue(url, id_token){
  fetch(url, {
    method: 'get',
    headers: {
      'Authorization': 'Bearer ' + id_token            
    }
  })
    .then(resp => resp.json())
    .then(data => {
      const dcClaimElm = document.getElementById(`dc_${data.serialNo}`)
      let dcClaimVal = dcClaimElm.getElementsByClassName(`pre_dcValue_${data.serialNo}`)
      if (dcClaimVal && dcClaimVal[0]){
        // Update existing pre node
        dcClaimVal.innerHTML = `<pre class='pre_dcValue_${data.serialNo}'>Distributed Claim Value: ${data.value}</pre>`
      }else{
        // create new pre node
        dcClaimElm.innerHTML += `<pre class='pre_dcValue_${data.serialNo}'>Distributed Claim Value: ${data.value}</pre>`
      }
      return data
    })
    .catch((err) => {
      // eslint-disable-next-line no-console
      console.log(err)
    })
}
// Get claims from server
var claimsDiv = document.getElementById("claims")
var tbody = claimsDiv.childNodes[1].childNodes[3]
fetch('/listClaims')
  .then( (response) => {
    return response.json()
  })
  .then( (json) => {
    json.map(claim => {
      var tr = _tr()
      tr.appendChild(_td(claim.serialNo))

      let claimText = `<pre>Name: ${claim.attributes[0].name}</pre><pre>Value: ${claim.attributes[0].value}</pre>`

      if (claim.levelOfAssurance){
        claimText += `<pre>Assurance Level: ${claim.levelOfAssurance}</pre>`
      }

      if (claim.endpoint){
        claimText += `<pre>endpoint: ${claim.endpoint}</pre>`
      }

      if (claim.endpoint && claim.dc.access_token){
        tr.appendChild(_tdDistributedClaim(claimText, claim.dc))
      }else{
        tr.appendChild(_td(claimText))
      }

      tr.appendChild(_tdRevokeButton(claim.serialNo))
      tbody.appendChild(tr)
    })
  })

function init() {
  document.getElementById('email').focus()
}

window.addEventListener('load', init)

