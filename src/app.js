const express = require ("express")
const authRouter = require("./routes/auth.routes.js")
const cookieParser = require("cookie-parser");
const accountRouter = require("./routes/account.routes.js")
const transactionRoutes = require("./routes/transaction.route.js")

const app = express();

app.use(express.json());
app.use(cookieParser());

app.get("/",(req,res)=>{
    res.send(
        "Ledger is up and running"
    )
})

app.use('/api/auth',authRouter)
app.use("/api/accounts",accountRouter)
app.use("/api/transactions", transactionRoutes)

module.exports = app;