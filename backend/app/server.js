import './config/dotenv.js';
import app from './app.js';

const PORT = process.env.PORT || 5000; //Get the port from .env or use 5000
app.listen(PORT, () => console.log(`Running on http://localhost:${PORT}`));
