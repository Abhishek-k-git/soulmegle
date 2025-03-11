const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const { auth, generateToken } = require("../middleware/auth");

// Register
router.post("/register", async (req, res) => {
   try {
      const { username, email, password } = req.body;

      // Check if user already exists
      let user = await User.findOne({ email });
      if (user) {
         return res.status(400).json({ message: "User already exists" });
      }

      // Create new user
      user = new User({
         username,
         email,
         password,
      });

      await user.save();

      // Generate token
      const token = generateToken(user._id);

      const userToReturn = { ...user.toObject() };
      delete userToReturn.password;

      res.status(201).json({ user: userToReturn, token });
   } catch (error) {
      res.status(500).json({ message: "Server error" });
   }
});

// Login
router.post("/login", async (req, res) => {
   try {
      const { email, password } = req.body;

      // Check if user exists
      const user = await User.findOne({ email });
      if (!user) {
         return res.status(400).json({ message: "Invalid credentials" });
      }

      // Validate password
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
         return res.status(400).json({ message: "Invalid credentials" });
      }

      // Generate token
      const token = generateToken(user._id);

      const userToReturn = { ...user.toObject() };
      delete userToReturn.password;

      res.json({ user: userToReturn, token });
   } catch (error) {
      console.log("\nerror: ", error);
      res.status(500).json({ message: "Server error" });
   }
});

// Logout
router.post("/logout", auth, (req, res) => {
   res.json({ message: "Logged out successfully" });
});

module.exports = router;
