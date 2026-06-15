const router = require("express").Router();
const {
  allocateOrgan,
  getMyApplications,
  approveApplication,
  rejectApplication,
  updateOrganStatus,
  reAnalyze,
  quickAiInsights,
} = require("../controllers/organApplicationController");
const auth = require("../middleware/auth");

router.post("/", auth, allocateOrgan);
router.get("/", auth, getMyApplications);
router.get("/hospital", auth, getMyApplications);
router.post("/ai-insights", auth, quickAiInsights);
router.patch("/:id/approve", auth, approveApplication);
router.patch("/:id/reject", auth, rejectApplication);
router.patch("/:id/organ-status", auth, updateOrganStatus);
router.post("/:id/reanalyze", auth, reAnalyze);

module.exports = router;
