import fs from "fs";
import path from "path";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";
dotenv.config();

const { MONGO_CONNECTION_STRING } = process.env;

class Message {
  timestamp: Date;
  username: string;
  message: string;

  constructor(timestamp: Date, username: string, message: string) {
    this.timestamp = timestamp;
    this.username = username;
    this.message = message;
  }
}

function parseDateLine(line: string): Date {
  const isoFormattedStr =
    line.replace(/\./g, "-").replace(" ", "T") + "00:00:00Z";
  return new Date(isoFormattedStr);
}

function parseMessagesFromFile(filePath: string): Message[] {
  const lines = fs.readFileSync(filePath, "utf-8").split("\n");
  let currentDate: Date | null = null;
  const messages: Message[] = [];

  for (let line of lines) {
    if (line.match(/^\d{2}:\d{2}$/)) {
      // If it's just a time and we have a date, create a timestamp
      if (currentDate) {
        const timestamp = new Date(
          `${currentDate.toISOString().split("T")[0]}T${line}:00Z`
        );
        const messageText = lines.shift() || "";
        const username = lines.shift() || "";
        messages.push(new Message(timestamp, username, messageText));
      }
    } else if (line.match(/^\d+ \w+ \d{4}$/)) {
      currentDate = parseDateLine(line);
    }
  }

  return messages;
}

async function uploadMessages(messages: Message[]) {
  const client = new MongoClient(MONGO_CONNECTION_STRING || "");

  try {
    await client.connect();
    console.log("Connected to Database");

    const db = client.db();
    const collection = db.collection("messages");

    await collection.insertMany(messages);
    console.log("Messages uploaded successfully");
  } catch (err) {
    console.error(err);
  } finally {
    await client.close();
  }
}

async function main() {
  const filePath = path.join(__dirname, "resources", "raw_messages.txt"); // Update 'yourfile.html' with your actual file name

  const messages = parseMessagesFromFile(filePath);
  console.log(messages);

  //   await uploadMessages(messages);
}

main();
