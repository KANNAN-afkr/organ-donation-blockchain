const router = require("express").Router();
const { registerDonor, getDonors, getDonorById, approveDonor, getMyDonorProfile } = require("../controllers/donorController");
const auth = require("../middleware/auth");

router.post("/", auth, registerDonor);
router.get("/", auth, getDonors);
router.get("/me", auth, getMyDonorProfile);
router.get("/:id", auth, getDonorById);
router.patch("/:id/approve", auth, approveDonor);

module.exports = router;
