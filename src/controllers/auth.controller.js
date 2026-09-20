const userModel = require("../models/user.model.js")
const jwt = require("jsonwebtoken")
const emailService = require("../services/email.service.js");
const tokenBlackListModel = require("../models/blacklist.model.js");
const tokenBlackListModel = require("../models/blacklist.model.js")

// USER REGISTER CONTROLLER

async function userRegisterController(req,res){

   const {email,name,password} = req.body;

    const isExist = await userModel.findOne({
        email:email
    })
    
    if(isExist){
        return res.status(422).json({
            message: "User already exist with email",
            status: "failed"
        })
    }

    const user = await userModel.create({
        email,
        password,
        name
    })
   
     const token = jwt.sign({userId: user._id}, process.env.JWT_SECRET,{expiresIn: '3d'})

     res.cookie("token",token)

     res.status(201).json({
        user:{
            _id:user._id,
            email:user.email,
            name: user.name
        },
        token
     })

     await emailService.sendRegisterationEmail(user.email, user.name);
}

// USER LOGIN CONTROLLER

async function userLoginController(req,res){
     
       const {email, password} = req.body;

       const user = await userModel.findOne({email}).select("+password");
       if(!user){
         return res.status(401).json({
            message:"Email or password is invalid"
         })
       }
        
         
    const isValidPassword = await user.comparePassword(password);
    if(!isValidPassword){
        return res.status(401).json({
            message:"Email or password is incorrect"
        })
    }
        
    const token = jwt.sign({userId: user._id}, process.env.JWT_SECRET,{expiresIn: '3d'})

     res.cookie("token",token)

    return res.status(200).json({
        user:{
            _id:user._id,
            email:user.email,
            name: user.name
        },
        token
     })
  
      

}

async function userLogoutController(req,res){
     const token = req.cookies.token || req.headers.authorization?.split(" ")[1];

   if(!token){
    return res.status(400).json({
        message:"User logout successfull"
    })
   }

   res.clearCookie("token");

   await tokenBlackListModel.create({
    token: token
   })

   res.status(200).json({
    message: "User logout successfully"
   })

}

module.exports = {
    userRegisterController,
    userLoginController,
    userLogoutController
}


