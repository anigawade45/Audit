const express = require("express");
const router = express.Router();
const {
    register,
    login,
} = require("../controllers/userController");
const { requireAuth } = require("../middlewares/authMiddleware");

router.post("/register", register);
router.post("/login", login);
router.get("/me", requireAuth, (req, res) => {
    res.json(req.user);
});

module.exports = router;
