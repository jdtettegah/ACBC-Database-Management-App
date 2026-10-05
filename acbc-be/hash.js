import bcrypt from "bcryptjs";

const password = "Johnson";

const hash = await bcrypt.hash(password, 10);

console.log(hash);