import express from "express";
import dotenv from "dotenv";
import Routes from "./routes/auth";
import { swaggerSpec, swaggerUi } from "./config/swagger";
dotenv.config();

const app = express();
app.use(express.json());

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use("/api/auth", Routes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server Running on Port ${PORT}`);
});
