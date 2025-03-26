const express = require("express");
const { registerStudent, loginStudent, getStudentInfo, storeRegisterNumber, getRegisterNumber } = require("../controller/studentcontroller");
const authMiddleware = require("../controller/middelware");
const { upload } = require("../config/cloudinary");
const router = express.Router();

router.post("/register", upload.single("image"), registerStudent);
router.post("/reg", storeRegisterNumber);
router.get("/validate/:num", getRegisterNumber);
router.get("/info",authMiddleware, getStudentInfo);

module.exports = router;
