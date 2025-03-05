const jwt = require("jsonwebtoken");
const User = require("../models/User");

const generateToken = (userId) => {
   return jwt.sign({ userId }, process.env.JWT_SECRET, {
      expiresIn: "7d", // Token expires in 7 days
   });
};

const auth = async (req, res, next) => {
   try {
      let token;
      // Get token from Authorization header
      if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
         token = req.headers.authorization.split(' ')[1];
      }

      if (!token) {
         return res.status(401).json({ message: "No token, authorization denied" });
      }

      try {
         const decoded = jwt.verify(token, process.env.JWT_SECRET);

         // Check if token is about to expire (less than 1 day)
         const expirationTime = decoded.exp * 1000; // Convert to milliseconds
         const now = Date.now();
         const oneDayFromNow = now + 24 * 60 * 60 * 1000;

         if (expirationTime < oneDayFromNow) {
            // Generate new token
            const newToken = generateToken(decoded.userId);
            res.set('Authorization', `Bearer ${newToken}`);
         }

         const user = await User.findById(decoded.userId).select("-password");

         if (!user) {
            return res.status(401).json({ message: "User not found" });
         }

         req.user = user;
         next();
      } catch (error) {
         return res.status(401).json({
            message: "Token is invalid or expired",
            error: process.env.NODE_ENV === "development" ? error.message : undefined,
         });
      }
   } catch (error) {
      res.status(500).json({
         message: "Server error",
         error: process.env.NODE_ENV === "development" ? error.message : undefined,
      });
   }
};

module.exports = { auth, generateToken };
