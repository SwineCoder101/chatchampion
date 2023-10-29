import dotenv from 'dotenv';
import express, { Request, Response } from 'express';
import axios from 'axios';
import ChatCache from './ChatCache';
import { WeiPerEther, ethers, formatEther } from "ethers";
import OpenAI from "openai";


import { Chat } from 'openai/resources';

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

type MessageInfo = {
    update_id: number;
    message: {
        message_id: number;
        from: {
            id: number;
            is_bot: boolean;
            first_name: string;
            username: string;
            language_code: string;
        };
        chat: {
            id: number;
            title: string;
            type: string;
            all_members_are_administrators: boolean;
        };
        date: number;
        text: string;
    };
  };
  
  const openai = new OpenAI({
    apiKey: "",
    baseURL: "http://flock.tools:8001/v1", // defaults to https://api.openai.com/v1
  });
  const instruction = `can you rate the participants in this conversation based on their humor? Take 1000 points and distrbute them amongst each user based on their level of humor and map it against their name. The format is a json array of username: score  Only write the json data and not any text. At the end of the analysis give a json summary`;
  
  const instruction1 = `can you rate the participants in this conversation based on their humor? Take 1000 points and distrbute them amongst each user based on their level of humor and map it against their name. The format is a json array of username: score  Only write the json data and not any text.`;
  const instruction2 = `In the chatroom below, participants were rated based on the humor level of their messages. Using the provided leaderboard and messages, determine the reasoning behind each participant's score. How do their messages reflect their ranking on the leaderboard? Consider elements such as wit, puns, timing, and the context of the conversation.`;
  
  const tokenAbi = [
    "function mint(address to, uint256 amount) public",
    'function transfer(address to, uint256 value) public returns (bool)'
  ];
  
  const provider = new ethers.JsonRpcProvider(process.env.RPC);
  const deployerWallet = new ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY, provider);
  const ChatChampionContract = new ethers.Contract(process.env.CONTRACT_ADDRESS, tokenAbi, deployerWallet);
  
  
  function formatMessages(jsonData: string): string {
    const data = JSON.parse(jsonData);
  
    // Check if the structure of the JSON is as expected
    if (!data.ok || !data.result || !Array.isArray(data.result)) {
        throw new Error("Invalid JSON format");
    }
  
    const messages: string[] = data.result.map((item: MessageInfo) => {
        const username = item.message.from.username || item.message.from.first_name;
        const messageText = item.message.text;
        return `${username}: ${messageText}`;
    });
  
    return messages.join("\n");
  }

  console.log(formatMessages(`{"ok":true,"result":[{"update_id":177312581,
  "message":{"message_id":23,"from":{"id":5338078853,"is_bot":false,"first_name":"Liam","username":"LiamTel","language_code":"en"},"chat":{"id":-4066054986,"title":"Chat Championship","type":"group","all_members_are_administrators":true},"date":1698452054,"text":"hey henrik whatsup , this is a test"}},{"update_id":177312582,
  "message":{"message_id":24,"from":{"id":1386759162,"is_bot":false,"first_name":"Henrik","username":"henrik1111","language_code":"en"},"chat":{"id":-4066054986,"title":"Chat Championship","type":"group","all_members_are_administrators":true},"date":1698452068,"text":"Thanks for giving sample text"}},{"update_id":177312583,
  "message":{"message_id":25,"from":{"id":1386759162,"is_bot":false,"first_name":"Henrik","username":"henrik1111","language_code":"en"},"chat":{"id":-4066054986,"title":"Chat Championship","type":"group","all_members_are_administrators":true},"date":1698452071,"text":"lol"}},{"update_id":177312584,
  "message":{"message_id":26,"from":{"id":5338078853,"is_bot":false,"first_name":"Liam","username":"LiamTel","language_code":"en"},"chat":{"id":-4066054986,"title":"Chat Championship","type":"group","all_members_are_administrators":true},"date":1698452083,"text":"do you know whats blue and not heavy?"}},{"update_id":177312585,
  "message":{"message_id":27,"from":{"id":1386759162,"is_bot":false,"first_name":"Henrik","username":"henrik1111","language_code":"en"},"chat":{"id":-4066054986,"title":"Chat Championship","type":"group","all_members_are_administrators":true},"date":1698452088,"text":"no"}},{"update_id":177312586,
  "message":{"message_id":28,"from":{"id":5338078853,"is_bot":false,"first_name":"Liam","username":"LiamTel","language_code":"en"},"chat":{"id":-4066054986,"title":"Chat Championship","type":"group","all_members_are_administrators":true},"date":1698452093,"text":"light blue"}},{"update_id":177312587,
  "message":{"message_id":29,"from":{"id":1386759162,"is_bot":false,"first_name":"Henrik","username":"henrik1111","language_code":"en"},"chat":{"id":-4066054986,"title":"Chat Championship","type":"group","all_members_are_administrators":true},"date":1698452097,"text":"ahhahhah'"}}]}`));
  
  async function analyzeChat(prompt: string): Promise<string> {
    //const currentDateTime = new Date().toLocaleString();
    try {
      const chatCompletion = await openai.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: "hackathon-chat",
      });
      return chatCompletion?.choices[0]?.message.content;
    } catch (error) {
      console.error("Error getting completion from OpenAI:", error);
      throw error;
    }
  }
  
  // Should get the evm address of the telegram username.
  async function usernameToAddress(username: string): Promise<string> {
    return "";
    return "0x8fc941eBFAbB795488B60869f410C9553108F6C3";
  }
  async function usernameToPrivateKey(username: string): Promise<string> {
    return "";
  }
  
  async function usernameCanJoin(username: string): Promise<boolean> {
    const address = usernameToAddress(username);
  
    if (!address) { return false; }
    const balance: ethers.BigNumberish = await ChatChampionContract.balanceOf(address);
    return ethers.getBigInt(balance) >= ethers.getBigInt(1000) * ethers.WeiPerEther;
  }
  
  // Mints new tokens for the token reward
  async function mintTokens(address: string, amount: BigInt) {
      try {
        const tx = await ChatChampionContract.mint(address, amount);
        await tx.wait();  // Wait for the transaction to be mined
        console.log(`Minted ${amount} tokens for address: ${address}`);
      } catch (err) {
        console.error(`Error minting tokens for address: ${address}. Error: ${err.message}`);
      }
  }
  
  // Switch to a self custody wallet
  async function redeemTokens(telegramUsername: string, personalWallet: string) {
    try {
      const address = await usernameToAddress(telegramUsername);
      if (!address) {
        console.error(`ERROR: The user ${telegramUsername} has no wallet connected.`);
        return;
      }
      
      const privateKey = await usernameToPrivateKey(telegramUsername);
      if (!privateKey) {
        console.error(`ERROR: Couldn't retrieve the private key for user ${telegramUsername}.`);
        return;
      }
      
      const AAWallet = new ethers.Wallet(privateKey, provider);
      const ChatChampionContractAsUser = new ethers.Contract(process.env.CONTRACT_ADDRESS, tokenAbi, AAWallet);
      
      const balance: ethers.BigNumberish = await ChatChampionContractAsUser.balanceOf(address);
      if (ethers.getBigInt(balance) == ethers.getBigInt(0)) {
        console.error(`ERROR: User ${telegramUsername} has zero balance. Cannot proceed with the transfer.`);
        return;
      }
      const result = await ChatChampionContractAsUser.transfer(personalWallet, balance);
      console.log(`Successfully transferred ${balance.toString()} tokens to ${personalWallet} for user ${telegramUsername}. Transaction Hash: ${result.hash}`);
      //TODO: Update the address in the database here.
    } catch (error) {
      console.error(`ERROR: Failed to redeem tokens for user ${telegramUsername}. Details: ${error.message}`);
    }
  }
  
  
  // Mints a pre-funded wallet that we use to invite people for free.
  // Returns [address, privateKey]
  async function mintWallet(telegramUsername: string): Promise<[string, string]> {
    if (await usernameToAddress(telegramUsername) != "") {
      console.log("User already has an address.");
      return null;
    }
    const wallet = ethers.Wallet.createRandom();
    //Temporarily disabled:
    //const primeSdk = new PrimeSdk({ privateKey: wallet.privateKey }, { chainId: parseInt(process.env.CHAINID), projectKey: process.env.ETHERSPOT_PROJECT_KEY  });
    //const address: string = await primeSdk.getCounterFactualAddress();
    const address: string = wallet.address;
    console.log('\x1b[33m%s\x1b[0m', `EtherspotWallet address: ${address}`);
  
    await mintTokens(address, ethers.getBigInt(1000) * ethers.WeiPerEther);
  
    return [address, wallet.privateKey];
  }
  
  async function startAnalysis(messages: string){
      console.log("Result:\n");
      var result = await analyzeChat(instruction + messages);
      console.log(result);
    
      console.log("Reasoning:\n");
      var reasoning = await analyzeChat(instruction2 + "\n\nLeaderboard:\n" + result + "\n\nChatroom messages:\n" + messages);
      return reasoning;
  }

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

        //create a wallet
        if (sentMessage === '/createWallet'){
            sendMessage(chatId,'about to create wallet here');
            const result = mintWallet(userId);
            const address = result[0];
            const privateKey = result[1];
            // Put the info in the database here.
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
