const router = require("express").Router();
const { saveProfile, saveApplicationProfile, getMyProfile, getRecipients, downloadReport } = require("../controllers/recipientController");
const auth = require("../middleware/auth");
const { uploadToGridFS } = require("../middleware/upload");

router.post("/profile", auth, saveProfile);
router.post("/application-profile", auth, ...uploadToGridFS("report"), saveApplicationProfile);
router.get("/me", auth, getMyProfile);
router.get("/", auth, getRecipients);
router.get("/report/:fileId", auth, downloadReport);

module.exports = router;
