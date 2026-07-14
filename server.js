require("dotenv").config()
const app = require("./src/app");
const connectDB = require("./src/configs/db");

const PORT=3000






connectDB()


app.listen(PORT,()=>{
    console.log("server started")
})
