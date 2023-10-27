import axios from "axios";
import dotenv from "dotenv";
import type { NextApiRequest, NextApiResponse } from "next";

dotenv.config();

const { TELEGRAM_TOKEN, SERVER_URL } = process.env;

const TELEGRAM_API = `https://api.telegram.org/bot${TELEGRAM_TOKEN}`;
const URI = `/webhook/${TELEGRAM_TOKEN}`;
const webhookURL = `${SERVER_URL}${URI}`;

export const setupWebhook = async () => {
  try {
    const { data } = await axios.get(`${TELEGRAM_API}/setWebhook?url=${webhookURL}&drop_pending_updates=true`);
    console.log(data);
  } catch (error: any) {
    console.error("Error setting up the webhook:", error.message);
  }
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    // Extract token from URL
    const { token } = req.query;

    console.log(req.body);

    // Add your logic here...

    res.status(200).send("ok");
  } else {
    // Handle any other HTTP method
    res.setHeader("Allow", ["POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
