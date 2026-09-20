const userModel = require("../models/user.model.js")
const jwt = require("jsonwebtoken")
const tokenBlackListModel = require("../models/blacklist.model.js")

async function authMiddleware(req,res,next){

    const token = req.cookies.token || req.header.authorization.split(" ")[1];

     if(!token){
        return res.status(401).json({
            message: "Unauthorized access,token is missing"
        })
     }

     const isBlacklisted = await tokenBlackListModel.findOne({token})

     if(isBlacklisted){
      return res.status(401).json({
        message:"Unauthorized access, token is invalid"
      })
     }

  try {
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await userModel.findById(decoded.userId);
    req.user = user;
    next();

  } catch (error) {
      return res.status(401).json({
        message: "Unauthorized access, token is invalid"
      })
    }

}

async function authSystemUserMiddleware(req,res,next){
       const token = req.cookies.token || req.header.authorization.split(" ")[1];

     if(!token){
        return res.status(401).json({
            message: "Unauthorized access,token is missing"
        })
     }

     const isBlacklisted = await tokenBlackListModel.findOne({token})

     if(isBlacklisted){
      return res.status(401).json({
        message:"Unauthorized access, token is invalid"
      })
     }

  try {
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await userModel.findById(decoded.userId).select("+systemUser");
    if(!user.systemUser){
      return res.status(403).json({
        message:"Forbidden access,not a system user"
      })
    }
    req.user = user;
    next();

  } catch (error) {
      return res.status(401).json({
        message: "Unauthorized access, token is invalid"
      })
    }

}

module.exports = {
    authMiddleware,
    authSystemUserMiddleware
}