import dotenv from "dotenv";
import http from "node:http";
import app from "./app.js";
import connectDB from "./db/index.js";
import { seedTestimonials } from "./utils/seedData.js";

// Global error handler for uncaught exceptions
process.on("uncaughtException", (error) => {
  console.error("UNCAUGHT EXCEPTION 💥", error.name, error.message);
  console.error("Stack:", error.stack);
  process.exit(1);
});

// Global unhandled promise rejection handler
process.on("unhandledRejection", (error) => {
  console.error("UNHANDLED REJECTION 💥", error.name, error.message);
  console.error("Stack:", error.stack);
  process.exit(1);
});

dotenv.config({
  path: "./.env",
});

const server = http.createServer(app);

connectDB()
  .then(() => {
    app.on("error", (err) => {
      console.log("App Error:", err);
    });

    // Seed initial data
    seedTestimonials().catch((err) => {
      console.error("Error seeding testimonials:", err);
    });

    app.get("/", (req, res) => {
      res.send("hello bro");
    });

    app.get("/api/connect", (req, res) => {
      res.send("hello Server is connected");
    });

    server.listen(process.env.PORT || 4000, () => {
      console.log(`Server is starting at PORT ${process.env.PORT || 4000}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection failed:", err);
    console.error("Stack:", err.stack);
    process.exit(1);
  });

// const port = 5000;

// app.get("/", (req, res) => {
//   res.send("Hello World!");
// });

// app.listen(port, () => {
//   console.log(`Example app listening at http://localhost:${port}`);
// });

// Special handling for Vercel serverless environment
export default app;
