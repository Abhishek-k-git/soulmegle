const express = require("express");
const router = express.Router();
const { auth } = require("../middleware/auth");
const User = require("../models/User");
const { INTERESTS } = require("../utils/constants");

// Update user interests
router.put("/interests", auth, async (req, res) => {
   try {
      const { interests } = req.body;
      const user = await User.findById(req.user._id);

      if (!user) {
         return res.status(404).json({ message: "User not found" });
      }

      // Update interests
      user.interests = interests;

      // Calculate interest vector (simple one-hot encoding)
      const interestVector = INTERESTS.map((interest) =>
         interests.includes(interest) ? 1 : 0
      );

      user.interestVector = interestVector;

      await user.save();

      res.json({
         interests: user.interests,
         interestVector: user.interestVector,
      });
   } catch (error) {
      res.status(500).json({ message: "Server error" });
   }
});

// Get user profile
router.get("/profile", auth, async (req, res) => {
   try {
      if (!req.user) {
         return res.status(404).json({ message: "User not found" });
      }

      res.json(req.user);
   } catch (error) {
      console.error("Error fetching profile:", error);
      res.status(500).json({ message: "Server error" });
   }
});

module.exports = router;
