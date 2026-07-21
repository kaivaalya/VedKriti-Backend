const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Admin = require("./src/models/Admin.model");

mongoose.connect(process.env.MONGO_URI);

async function seedAdmin() {
    const hashedPassword = await bcrypt.hash("admin123", 10);

    await Admin.create({
        name: "Admin",
        email: "admin@gmail.com",
        password: hashedPassword
    });

    console.log("Admin created");
    process.exit();
}

seedAdmin();
