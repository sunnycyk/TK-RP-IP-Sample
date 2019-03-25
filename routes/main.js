const router = require("express").Router()
const subRouters = [
  "./oauth",
  "./claims"
]

subRouters.forEach(subRoute => {
  // eslint-disable-next-line security/detect-non-literal-require
  router.use(require(subRoute))
})

module.exports = router
