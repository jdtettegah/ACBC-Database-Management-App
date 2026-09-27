import bcrypt from "bcryptjs";

const password = "Admin";

const hash = await bcrypt.hash(password, 10);

console.log(hash);