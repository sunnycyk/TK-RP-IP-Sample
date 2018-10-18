const router = require("express").Router();
const subRouters = [
  "./oauth"
];

subRouters.forEach(subRoute => {
  router.use(require(subRoute));
});

module.exports = router;
