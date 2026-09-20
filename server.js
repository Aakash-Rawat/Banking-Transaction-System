require("dotenv").config();
const app = require("./src/app.js")
const connectToDb = require("./src/config/db.js")


connectToDb();

app.listen(3000,()=>{
    
   console.log("Server is running on port 3000");

})

