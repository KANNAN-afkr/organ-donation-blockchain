const router = require("express").Router();
const { createRequest, getAllRequests, getMyRequests, downloadReport } = require("../controllers/organRequestController");
const auth = require("../middleware/auth");
const { uploadToGridFS } = require("../middleware/upload");

router.post("/", auth, ...uploadToGridFS("report"), createRequest);
router.get("/", auth, getAllRequests);  // all hospitals can see all requests
router.get("/mine", auth, getMyRequests);
router.get("/report/:fileId", auth, downloadReport);

module.exports = router;
