const express = require("express")
const cookieParser=require("cookie-parser");
const authRouter = require("./routes/auth.routes");
const adminRouter = require("./routes/admin.routes");

const app=express()


app.use(cookieParser());
app.use(express.json())
app.use("/api/admin", adminRouter);



app.use("/api/auth",authRouter)




module.exports = app




