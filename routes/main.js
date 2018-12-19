const router = require("express").Router();
const subRouters = [
  "./oauth",
  "./claims"
];

subRouters.forEach(subRoute => {
  router.use(require(subRoute));
});

module.exports = router;
