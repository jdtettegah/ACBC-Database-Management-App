import bcrypt from "bcryptjs";

const password = "Blessing@09";

const hash = await bcrypt.hash(password, 10);

console.log(hash);