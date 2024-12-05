import app from "./app";
import dotenv from "dotenv";

dotenv.config();

// Specify the port number for the server
const PORT = process.env.PORT;

// Start the server and listen on the specified port
app.listen(PORT, () => {
  // Log a message when the server is successfully running
  console.log(`Server is running on http://localhost:${PORT}`);
});
