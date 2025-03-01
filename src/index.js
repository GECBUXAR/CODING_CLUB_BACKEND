import dotenv from "dotenv";
import http from "http";
import app from "./app.js";
import connectDB from "./db/index.js";

dotenv.config({
  path: "./.env",
});

const server = http.createServer(app);

connectDB()
  .then(() => {
    app.on("Error", (Error) => {
      console.log("ERR:", Error);
    });

    app.get("/", (req, res) => {
      res.send("hello bro");
    });
    app.get("/api/connet", (req, res) => {
      res.send("hello Server is connected");
    });
    server.listen(process.env.PORT || 4000, () => {
      console.log(`Server is starting at PORT ${process.env.PORT || 4000}`);
    });
  })
  .catch((err) => {
    console.log(`mongoDB Connection FAILED !!!!! `, err);
  });

// const port = 5000;

// app.get("/", (req, res) => {
//   res.send("Hello World!");
// });

// app.listen(port, () => {
//   console.log(`Example app listening at http://localhost:${port}`);
// });
