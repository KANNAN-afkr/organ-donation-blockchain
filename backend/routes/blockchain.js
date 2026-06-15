const router = require("express").Router();
const { getTransactions, getOrganLifecycle } = require("../controllers/blockchainController");
const auth = require("../middleware/auth");

router.get("/transactions", auth, getTransactions);
router.get("/lifecycle/:donorId", auth, getOrganLifecycle);

module.exports = router;
