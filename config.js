module.exports = {
  "host": process.env.HOST || "http://localhost:8080",
  "issuerServiceUrl": process.env.ISSUER_URL || "https://issuer.trustedkey.com",
  "walletServiceUrl": process.env.WALLET_URL || "https://wallet.trustedkey.com",
  "callbackRoute": "/oauth/callback",
  "clientId": process.env.CLIENTID,
  "clientSecret": process.env.CLIENTSECRET,
  "claims": ["https://auth.trustedkey.com/publicKey"],
  "port": process.env.PORT || 8080,
  "expiryYears": 10
}
