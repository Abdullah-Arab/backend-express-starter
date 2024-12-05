// Import the 'express' module along with 'Request' and 'Response' types from express
import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";

import authRouter from "./routes/v1/auth";
import asyncHandler from "express-async-handler";

dotenv.config();

// Create an Express application
const app = express();
app.use(cors());
app.use(express.json());

// Specify the port number for the server
const PORT = process.env.PORT;

// Define a route for the root path ('/')

app.get("/", (req: Request, res: Response) => {
  // Send a response to the client
  res.send("Hi!");
});

// Define a route for the '/api/auth' path
app.use("/api/v1/auth", authRouter);



// Start the server and listen on the specified port
app.listen(PORT, () => {
  // Log a message when the server is successfully running
  console.log(`Server is running on http://localhost:${PORT}`);
});
