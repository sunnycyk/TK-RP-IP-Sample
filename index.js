const Express = require('express')
const CORS = require("cors")
const BodyParser = require("body-parser")
const Router = require("./routes/main")
const Config = require("./config")

const port = Config.port

var app = Express()
app.use(CORS())
app.use(BodyParser.json())
app.use(BodyParser.urlencoded({ 
  extended: true
}))
app.use(Express.static("./public"))
app.use("/", Router)

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log("Server listening on port: " + port)
})
