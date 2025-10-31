import dotenv from "dotenv";
import app from "./src/app.js";

dotenv.config();

const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
