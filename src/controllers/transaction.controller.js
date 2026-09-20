const transactionModel = require("../models/transaction.model.js")
const ledgerModel = require("../models/ledger.model.js")
const emailService = require("../services/email.service.js");
const accountModel = require("../models/account.model.js");
const mongoose = require('mongoose')


/* 10 steps transaction flow:
1)  Validate Request
2)   Validate idempotency key
3)   Check account status
4)   Derive sender balance from ledger
5)  Create transaction (Pending state)
6)   Create debit ledger entry
7)   Create credit ledger entry
8)   Mark transaction completed
9)   Commit MongoDB session
10)   Send email notification
*/


async function createTransaction(req,res){
       
    const {fromAccount, toAccount, amount, idempotencyKey} = req.body;   
     
    if(!fromAccount || !toAccount || !amount || !idempotencyKey){
        return res.status(400).json({
            message: "FromAccount, toAccount, amout, idempotencyKey is required"
        })
    }

    const fromUserAccount = await accountModel.findOne({
        _id: fromAccount
    })
       
    const toUserAccount = await accountModel.findOne({
        _id: toAccount
    })

    if(!fromUserAccount || !toUserAccount){
        return res.status(400).json({
            message:"Invalid fromAccount or toAccount"
        })
    }
   
     const isTransactionAlreadyExists = await transactionModel.findOne({
        idempotencyKey: idempotencyKey
     })
   
     if(isTransactionAlreadyExists){
        if(isTransactionAlreadyExists.status === "Complete"){
           return res.status(200).json({
                message: "Transaction already processed",
                transaction: isTransactionAlreadyExists
            })
        }
        if(isTransactionAlreadyExists.status==="Pending"){
          return  res.status(200).json({
                message:"Transaction is still pending"
            })
        }
        if(isTransactionAlreadyExists.status==="Failed"){
           return res.status(200).json({
                message:"Transaction is Failed"
            })
        }
        if(isTransactionAlreadyExists.status==="Reversed"){
           return res.status(500).json({
                message:"Transaction was reversed, please retry"
            })
        }
     }
        
     if(fromUserAccount.status !== "Active" || toUserAccount.status !== "Active"){
        return res.status(400).json({
            message: "Both fromAccount and toAccount must be Active to process transaction"
        })
     }

      
     const balance = await fromUserAccount.getBalance()

      if(balance<amount){
        return res.status(400).json({
            message: `Insufficient balance. Current balance is ${balance}. Requested balance is ${amount} `
        })
      }
    
      // sessions : It ensures that either all the operations succeed or, if something fails, all the previous changes are rolled back. For example, while transferring money, deducting money from one user and adding it to another should happen together. The session keeps track of these operations, and you can either commit them to save everything or abort them to undo everything.

       const session = await mongoose.startSession();

       //startTransaction() is a method provided by Mongoose's session object.


       session.startTransaction();

       const transaction = new transactionModel({
        fromAccount,
        toAccount,
        amount,
        idempotencyKey,
        status:"Pending"
       })

        const debitLedgerEntry = await ledgerModel.create([{
        account: fromAccount,
        amount:amount,
        transaction: transaction._id,
        type:"Debited"
    }],{session})

    const creditLedgerEntry = await ledgerModel.create([{
        account: toAccount,
        amount:amount,
        transaction: transaction._id,
        type:"Credited"
    }],{session})

    transaction.status = "Complete"
    await transaction.save({session})

    await session.commitTransaction();
    session.endSession();

   await emailService.sendTransactionEmail(
       req.user.email, req.user.name, amount, toAccount
   )
    
   return res.status(201).json({
    message: "Transaction complete successfully",
    transaction: transaction
   })

}

async function createInitialFundsTransaction(req,res){
           const{toAccount, amount, idempotencyKey} = req.body;
    
           if(!toAccount || !amount || !idempotencyKey){
              return res.status(400).json({
                message: "toAccount, amount and idempotency are required"
              })
           }

             

           const toUserAccount = await accountModel.findOne({
                _id: toAccount
           })
   
            if(!toUserAccount){
                return res.status(400).json({
                    message: "Invalid toAccount"
                })
            }

          const fromUserAccount = await accountModel.findOne({
            user: req.user._id
          })

          if(!fromUserAccount){
            return res.status(400).json({
                message: "System user account not found"
            })
          }

          // session created so that further functions either works all together or not at all if anyone in between fails

           const session = await mongoose.startSession();
           session.startTransaction();

           const transaction = new transactionModel({
            fromAccount: fromUserAccount._id,
            toAccount,
            amount,
            idempotencyKey,
            status:"Pending"
           })
      
    const debitLedgerEntry = await ledgerModel.create([{
        account: fromUserAccount._id,
        amount:amount,
        transaction: transaction._id,
        type:"Debited"
    }],{session})

    const creditLedgerEntry = await ledgerModel.create([{
        account: toAccount,
        amount:amount,
        transaction: transaction._id,
        type:"Credited"
    }],{session})

    transaction.status = "Complete"
    await transaction.save({session})

    await session.commitTransaction();
    session.endSession();

    return res.status(201).json({
        message:"Initial funds transaction complete successful",
        transaction: transaction
    })

}

module.exports = {
    createTransaction,
    createInitialFundsTransaction
}