const mongoose = require("mongoose")
const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

async function  connectDB(){
   try{
    await mongoose.connect(process.env.CONNECTING_STRING)
    
    console.log("DB connected")}
    catch(err){
        console.log(`fail to connect db ${err}`)
    }
}


module.exports=connectDB