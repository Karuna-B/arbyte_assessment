import express from "express";
import dotenv from "dotenv";
import Routes from "./routes/auth";
dotenv.config();

const app = express();
app.use(express.json());

app.use("/api/auth", Routes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server Running on Port ${PORT}`);
});
