const router = require("express").Router();
const { getMatches, autoAllocateAll } = require("../controllers/matchController");
const auth = require("../middleware/auth");

router.get("/", auth, getMatches);
router.post("/auto-allocate-all", auth, autoAllocateAll);

module.exports = router;
