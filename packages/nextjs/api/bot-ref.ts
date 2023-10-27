import axios from "axios";
import dotenv from "dotenv";
import express, { Request, Response } from "express";

dotenv.config();

const { PORT, TELEGRAM_TOKEN, SERVER_URL } = process.env;

const app = express();
app.use(express.json());

app.get("/", (req: Request, res: Response) => {
  // ... handle the root get request
  res.send("Welcome to the bot server!");
});

const TELEGRAM_API = `https://api.telegram.org/bot${TELEGRAM_TOKEN}`;
const URI = `/webhook/${TELEGRAM_TOKEN}`;
const webhookURL = `${SERVER_URL}${URI}`;

const setupWebhook = async () => {
  try {
    const { data } = await axios.get(`${TELEGRAM_API}/setWebhook?url=${webhookURL}&drop_pending_updates=true`);
    console.log(data);
  } catch (error: any) {
    console.error("Error setting up the webhook:", error.message);
  }
};

app.post(URI, (req: Request, res: Response) => {
  console.log(req.body);
  res.status(200).send("ok");
});

// app.listen(PORT, async () => {
//     console.log(`Server
