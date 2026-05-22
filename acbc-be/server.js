import "./config/env.js"

import app from "./src/app.js";
import pool from "./src/services/db.js";

const PORT = process.env.PORT || 3000;



pool.connect()
  .then(() => {
    console.log("PostgreSQL connected");
  })
  .catch((err) => {
    console.error("DB connection error:", err);
  });

app.listen(PORT, () => {
  console.log(`ACBC server running on port ${PORT}`);
});