const mongoose = require("mongoose");


const transactionSchema = new mongoose.Schema({
     
        fromAccount: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "account",
            required: [true,"Transaction must be associated with a from account"],
            index: true
        },

        toAccount: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "account",required: [true,"Transaction must be associated with a from account"],
            index: true
        },
       
        status:{
            type: String,
            enum:{
                values: ["Pending","Complete","Failed","Reversed"],
                message: "Status can be either pending, completed, failed or reversed"
            },
            default: "Pending"
        },

        amount:{
            type: Number,
            required: [true, "Amount is required for creating transaction"],
            min: [0,"Transaction amount cannot be negative"]
        },

        idempotencyKey:{
            type: String,
            required: [true,"Idempotency key is required for making transactions"], 
            index: true,
            unique: true
        }
},{timestamps:true})

const transactionModel = mongoose.model("transaction", transactionSchema)
module.exports = transactionModel;