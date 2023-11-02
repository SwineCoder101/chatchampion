import dotenv from "dotenv";
import { MongoClient } from "mongodb";
import * as cheerio from "cheerio";
import * as fs from "fs";
import * as path from "path";
dotenv.config();

const { MONGO_CONNECTION_STRING } = process.env;
let _db;

export class Message {
  private userId;
  private username;
  private timestamp;
  private channelId;
  private message;
  private messageId;

  constructor(userId, username, timestamp, channelId, message, messageId) {
    this.userId = userId;
    this.username = username;
    this.timestamp = timestamp;
    this.channelId = channelId;
    this.message = message;
    this.messageId = messageId;
  }

  save() {
    const db = getDb();
    return db
      .collection("messages")
      .updateOne(
        { _id: this.messageId },
        { $set: this },
        { upsert: true } // This will insert a new document if one doesn't exist with the provided _id
      )
      .then((result) => {
        console.log(result);
      })
      .catch((err) => {
        console.log(err);
      });
  }
}

export function convertToMessageObject(telegramPayload: any): Message | null {
  const messageData = telegramPayload.message;
  if (!messageData) {
    return null;
  }

  const userId = messageData.from?.id;
  const username = messageData.from?.username;
  const timestamp = new Date(messageData.date * 1000); // Telegram date is in Unix timestamp format
  const channelId = messageData.chat?.id;
  const message = messageData.text;
  const messageId = telegramPayload.update_id;

  if (userId && username && channelId && message) {
    return new Message(
      userId,
      username,
      timestamp,
      channelId,
      message,
      messageId
    );
  }

  return null;
}

const mongoConnect = (callback) => {
  MongoClient.connect(MONGO_CONNECTION_STRING || "")
    .then((client) => {
      console.log("Connected to Database");
      _db = client.db();
      callback(client);
    })
    .catch((err) => {
      console.log(err);
    });
};

const getDb = () => {
  if (_db) {
    return _db;
  }
  throw "No database found!";
};
const filePath = path.join(__dirname, "resources", "yourfile.html"); // Update 'yourfile.html' with your actual file name

async function main() {
  mongoConnect((client) => {
    console.log(client);
  });
}

main();
