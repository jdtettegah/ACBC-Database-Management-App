const bcrypt = require('bcryptjs');

const password = 'Finance'; // choose your password
const hash = bcrypt.hashSync(password, 10);

console.log(hash);
