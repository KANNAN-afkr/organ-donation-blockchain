const router = require("express").Router();
const { registerHospital, getHospitals, getMyHospital } = require("../controllers/hospitalController");
const auth = require("../middleware/auth");

router.post("/", auth, registerHospital);
router.get("/", auth, getHospitals);
router.get("/me", auth, getMyHospital);

module.exports = router;
