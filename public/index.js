function doFlow(flow) {
    var email = document.getElementById("email").value
    email = encodeURIComponent(email.trim())
    window.location.href = "/" + flow + "?login_hint=" + email
}

function _tr() {
    return document.createElement('tr')
}

function _td(text) {
    var td = document.createElement('td')
    var td_text = document.createTextNode(text)
    td.appendChild(td_text)
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
        tr.appendChild(_td(claim))
        tr.appendChild(_tdRevokeButton(claim))
        tbody.appendChild(tr)
    })
})
