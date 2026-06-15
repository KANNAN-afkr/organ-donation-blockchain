const router = require("express").Router();
const { createListing, getListings, getMyListings, downloadReport, markUnavailable } = require("../controllers/organListingController");
const auth = require("../middleware/auth");
const { uploadToGridFS } = require("../middleware/upload");

router.post("/", auth, ...uploadToGridFS("report"), createListing);
router.get("/", auth, getListings);  // only registered hospitals can view
router.get("/mine", auth, getMyListings);
router.get("/report/:fileId", auth, downloadReport);
router.patch("/:id/unavailable", auth, markUnavailable);

module.exports = router;
