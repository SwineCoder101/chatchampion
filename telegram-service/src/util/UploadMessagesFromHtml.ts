import * as cheerio from "cheerio";
import * as fs from "fs";
import * as path from "path";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

const { MONGO_CONNECTION_STRING } = process.env;

class Message {
  userId: string;
  username: string;
  timestamp: string;
  channelId: string | null;
  message: string;

  constructor(
    userId: string,
    username: string,
    timestamp: string,
    channelId: string | null,
    message: string
  ) {
    this.userId = userId;
    this.username = username;
    this.timestamp = timestamp;
    this.channelId = channelId;
    this.message = message;
  }
}

function convertToTimestamp(dateStr: string): Date {
  if (!dateStr) {
    return new Date();
  }
  // Convert the string into ISO 8601 format
  const isoFormattedStr =
    dateStr.replace(/\./g, "-").replace(" ", "T").split(" ")[0] + "Z";

  // Create a new Date object
  const timestamp = new Date(isoFormattedStr);

  return timestamp;
}

async function parseHTML(filePath: string): Promise<Message[]> {
  const htmlContent = fs.readFileSync(filePath, { encoding: "utf-8" });
  const $ = cheerio.load(htmlContent);
  const messages: Message[] = [];

  $(".message.default.clearfix").each((_, element) => {
    const userInitials = $(element).find(".initials").text().trim();
    const userId = userInitials;
    const username = $(element).find(".from_name").text().trim();
    let timestamp = $(element).find(".date.details").attr("title");
    // const dateTimeStamp = convertToTimestamp(timestamp);
    const channelId = null; // Assuming channel ID is not available in the HTML
    const messageContent = $(element).find(".text").text().trim();

    const message = new Message(
      userId,
      username,
      timestamp,
      channelId,
      messageContent
    );
    messages.push(message);
  });

  return messages;
}

async function storeMessagesInMongoDB(messages: Message[]) {
  const client = await MongoClient.connect(MONGO_CONNECTION_STRING || "");
  console.log("Connected to Database");

  const db = client.db();
  const collection = db.collection("messages");

  await collection.insertMany(messages);
  console.log("Messages stored in MongoDB");

  await client.close();
}

async function main() {
  const filePath = path.join(__dirname, "resources", "messages.html"); // Update 'yourfile.html' with your actual file name

  try {
    const messages = await parseHTML(filePath);
    console.log(messages);
    // await storeMessagesInMongoDB(messages);
  } catch (err) {
    console.error(err);
  }
}

main();
