const Url = require("url")

const host =  process.env.HOST || "http://localhost:8080"

module.exports = {
  host: host,
  issuerServiceUrl: process.env.ISSUER_URL || "https://issuer.trustedkey.com",
  walletServiceUrl: process.env.WALLET_URL || "https://wallet.trustedkey.com",
  callbackRoute: "/oauth/callback",
  clientId: process.env.CLIENTID,
  clientSecret: process.env.CLIENTSECRET,
  port: process.env.PORT || 8080,
  registerScopes: ["openid", "profile", "phone"],
  issuanceClaims: {
    name: "Bob A. Smith",
    given_name: "Bob",
    family_name: "Smith",
    gender: "Male",
    birthdate: "120101000000Z",
    phone_number: {
      endpoint: Url.resolve(host, '/claimdetails'),
      loa: 1.0
    },
    "https://auth.trustedkey.com/documentID": "X1234567"
  },
  publicKey: 'https://auth.trustedkey.com/publicKey',
  expiryYears: 10
}
