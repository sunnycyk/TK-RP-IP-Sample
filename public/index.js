/* eslint-env browser */

// eslint-disable-next-line no-unused-vars
function doFlow(flow, field) {
  var email = document.getElementById("email").value
  var query = ''
  email = encodeURIComponent(email.trim())

  // eslint-disable-next-line eqeqeq
  if (field != null) {
    var value = document.getElementById(field).value
    if (value === '') return alert('invalid valid')
    value = encodeURIComponent(value.trim())
    query = `&${field}=${value}`
  }
  window.location.href = "/" + flow + "?login_hint=" + email + query
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
function displayUploadForm() {
  var docsigForm = document.getElementById('docsigform')
  var issuerForm = document.getElementById('issuerform')
  var claims = document.getElementById('claims')
  var docsigBtn = document.getElementById('docsigbutton')
  var issuebutton = document.getElementById('issuebutton')
  docsigForm.hidden = !docsigForm.hidden
  if (docsigForm.hidden) {
    docsigBtn.textContent = 'Show Docsig Form'
  } else {
    issuebutton.textContent = 'Show Issuing Form'
    docsigBtn.textContent = 'Hide Docsig Form'
  }
  claims.hidden = !(issuerForm.hidden && docsigForm.hidden)
  issuerForm.hidden = true
}

// eslint-disable-next-line no-unused-vars
function showIssuerForm() {
  var docsigForm = document.getElementById('docsigform')
  var issuerForm = document.getElementById('issuerform')
  var claims = document.getElementById('claims')
  var issuebutton = document.getElementById('issuebutton')
  //var docsigBtn = document.getElementById('docsigbutton')
  issuerForm.hidden = !issuerForm.hidden
  if (issuerForm.hidden) {
    issuebutton.textContent = 'Show Issuing Form'
  } else {
    // docsigBtn.textContent = 'Show Docsig Form'
    issuebutton.textContent = 'Hide Issuing Form'
  }
  claims.hidden = !(issuerForm.hidden && docsigForm.hidden)
  docsigForm.hidden = true

  // prefill address value
  var address = document.getElementById('address')
  address.value = window.location.href + '/claimdetails'
}

// eslint-disable-next-line no-unused-vars
function uploadAndSign() {
  // eslint-disable-next-line security/detect-unsafe-regex
  var email_regex = /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/
  var email = document.getElementById('email').value
  if (!email.match(email_regex)) {
    alert('Missing login hint')
  } else {
    let docsigForm = document.getElementById('docsig')
    let formData = new FormData(docsigForm)
    let fileField = document.getElementById('docsig').querySelector("input[type='file']")
    let file = fileField.files[0]
    if (file) {
      formData.append('file', file)
      formData.append('login_hint', email)
      fetch('/docsig', {
        method: 'post',
        body: formData
      })
        .then(_ => { // success upload and waiting for sign
          window.location.href = '/docsig/status'
        })
        .catch(_ => {
          window.location.href = '/docsig/status'
        })
    } else {
      alert('File fields missing')
    }
  }
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

      let claimText = `<pre>Name: ${claim.attributes[0].name}</pre><pre>Value: ${claim.attributes[0].value}</pre>
      <pre>Issued Date: ${claim.issuedDate || ''}</pre>
      <pre><label>Document is issued to Public Key: </label></pre>
      <pre><label>${claim.pubkeyAddress || ''}</label></pre>`

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
