const mongoose = require("mongoose")

function connectToDb(){
    mongoose.connect(process.env.MONGO_URI)
    .then(()=>{
        console.log("Server is connected to DB");
        
    })
    .catch(err=>{
        console.log(err,"Error connecting to DB");
        process.exit(1);
    })
}

module.exports = connectToDb;