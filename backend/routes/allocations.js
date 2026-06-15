const router = require("express").Router();
const { allocateOrgan, confirmTransplant, getAllocations, updateOrganStatus, smartAutoAllocate } = require("../controllers/allocationController");
const auth = require("../middleware/auth");

router.post("/", auth, allocateOrgan);
router.get("/", auth, getAllocations);
router.patch("/:id/confirm-transplant", auth, confirmTransplant);
router.post("/organ-status", auth, updateOrganStatus);
router.post("/smart-auto-allocate", auth, smartAutoAllocate);

module.exports = router;
