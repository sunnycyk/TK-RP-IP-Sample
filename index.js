const express = require('express')
const cors = require("cors")
const bodyParser = require("body-parser")
const router = require("./routes/main")
const config = require("./config")

var app = express()
app.use(cors())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({
  extended: true
}))
app.use("/", router)

app.listen(config.port, () => {
  console.log("Server listening on port: " + config.port)
})
