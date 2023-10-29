import dotenv from 'dotenv';
import express, { Request, Response } from 'express';
import axios from 'axios';
import ChatCache from './ChatCache';
import startAnalysis from './flock-main';
import { Chat } from 'openai/resources';
import { addToDatabase, queryDatabaseByUserName, queryDatabaseByAddress } from './WalletStore';
import {queryDatabaseByUserId} from './WalletStore';

dotenv.config();

const { PORT, TELEGRAM_TOKEN, SERVER_URL } = process.env;


const app = express();
app.use(express.json());

const updateArray = [];

app.get("/", (req: Request, res: Response) => {
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

const deleteWebhook = async () => {
    try {
        const { data } = await axios.get(`${TELEGRAM_API}/deleteWebhook`);
        console.log(data);
    } catch (error: any) {
        console.error("Error deleting the webhook:", error.message);
    }
}

const getUpdates = async () => {
    try {
        const { data } = await axios.get(`${TELEGRAM_API}/getUpdates`);
        return data;
    } catch (error: any) {
        console.error("Error getting updates:", error.message);
    }
}

const getGroupUpdates = async () => {
    try {
        const { data } = await axios.get(`${TELEGRAM_API}/getUpdates`);
        const filteredMessages = filterMessagesByChannelTitle(data, "Chat Championship");
        return filteredMessages;
    } catch (error: any) {
        console.error("Error getting updates:", error.message);
    }
}

function filterMessagesByChannelTitle(messages, channelTitle) {
    return messages.result.filter(update => update.message.chat.title === channelTitle);
}

function filterGroupChannels(messages) {
    return messages.result.filter(update => update.message.chat.type === 'group');
}

function filterMessages(messages, options) {
    return messages.result.filter(update => {
      const message = update.message;
      const from = message.from;
      
      // Check if the message is from the specified user name
      const isUserNameMatch = options.userName ? from.username === options.userName : true;
  
      // Check if the message is from the specified user ID
      const isUserIdMatch = options.userId ? from.id === options.userId : true;
  
      // Check if the message is within the specified time range
      const isWithinTimeRange = options.startTime && options.endTime 
                                ? message.date >= options.startTime && message.date <= options.endTime
                                : true;
  
      return isUserNameMatch && isUserIdMatch && isWithinTimeRange;
    });
  }

  // Example usage:
const options = {
    userName: "LiamTel", // Filter by user name
    userId: 5338078853,  // Filter by user ID
    startTime: 1698452054, // Start time (Unix timestamp)
    endTime: 1698452093   // End time (Unix timestamp)
  };
  
  
  

const sendMessageCondition = async (sentMessage, condition, sendMessage) => {
    try {
        if (sentMessage === condition) {
        const { data } = await axios.post(`${TELEGRAM_API}/sendMessage`, {
            chat_id: 123456789,
            text: sendMessage
        });
        console.log(data);
        }
    } catch (error: any) {
        console.error("Error sending message:", error.message);
    }
};

const sendMessage = async (chatId, sendMessage) => {
    try {
        const { data } = await axios.post(`${TELEGRAM_API}/sendMessage`, {
            chat_id: chatId,
            text: sendMessage
        });
    } catch (error: any) {
        console.error("Error sending message:", error.message);
    }
};

const resetUpdates = async () => {
    await setupWebhook();
    await deleteWebhook();
};

app.post(URI, async (req: Request, res: Response) => {
    try {
        const chunk = req.body;
        const chatId = chunk.message.chat.id;
        const userId = chunk.message.from.id;
        const sentMessage = chunk.message.text;
        console.log('chatId',chatId);
        console.dir(req.body);
        updateArray.push(req.body);

        ChatCache.addUpdate(chatId, req.body);
        const regex = /^\/createWallet\s+(\S+)/;
        const match = sentMessage.match(regex);

        //create a wallet
        if (match){
            const username = match[1];
            sendMessage(chatId,'about to create wallet for ' + username);
        }

        //analyze the chat
        if(sentMessage === '/analyze'){
            const updates = ChatCache.getUpdates(chatId);
            sendMessage(chatId,'Analysing the chat now ...');
            const analysis = await startAnalysis(updates);
            console.log(analysis);
            sendMessage(chatId,analysis);
            ChatCache.resetChat(chatId);
        }

        // trial test the chat
        if(sentMessage === '/showchat'){
            const updates = ChatCache.getUpdates(chatId);
            console.log("=========UPDATES==========")
            console.log(updates);
            console.log("=========UPDATES==========")
        }

        // Send the response after the asynchronous operation is complete
        res.status(200).send('ok');
    } catch (error) {
        console.error(error);

        // Since no response has been sent yet, it's safe to send the error response here
        res.status(500).send('Internal Server Error');
    }
});


app.get(URI, (req, res) => {
    res.send('Hello');
 });

 let offset = 0;

app.listen(PORT, async () => {
    console.log(`Server running on port ${PORT}`); 
    console.log(`Webhook URL: ${webhookURL}`);
    try {
        await setupWebhook();
    } catch (error) {
        console.error("Webhook setup failed:", error.message);
    }
});
