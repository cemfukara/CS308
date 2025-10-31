//the main Express app; sets up routes, middleware, etc.
//app/app.js → should only handle app configuration and middleware setup (no server start logic here).
import express from "express";
import cors from "cors"; //Cross Origin Resource Sharing, Frontend can make a request
import userRoutes from "./routes/userRoutes.js";

const app = express();
app.use(cors({ //Connection with frontend only in the given port
    origin: "http://localhost:" //ADD FRONTEND's PORT!!!
}));
app.use(express.json());

// Sample route
app.use("/api/users", userRoutes);

export default app;