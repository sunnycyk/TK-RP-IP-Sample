module.exports = {
  "host": process.env.HOST || "http://localhost:8080",
  "issuerServiceUrl": "https://issuer-stg.trustedkey.com",
  "walletServiceUrl": "https://wallet-stg.trustedkey.com",
  "callbackRoute": "/oauth/callback",
  "clientId": process.env.CLIENTID,
  "clientSecret": process.env.CLIENTSECRET,
  "claims": ["https://auth.trustedkey.com/publicKey"],
  "port": process.env.PORT || 8080,
  "expiryYears": 10
}
