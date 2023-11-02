import dotenv from "dotenv";
import express, { Request, Response } from "express";
import axios from "axios";
import ChatCache from "./ChatCache";
import { Message } from "./MongoRepository";
import { WeiPerEther, ethers, formatEther } from "ethers";
import OpenAI from "openai";
import { Chat } from "openai/resources";
import { convertToMessageObject } from "./MongoRepository";
import {
  addToDatabase,
  queryDatabaseByUserName,
  queryDatabaseByAddress,
  deleteRowByUsername,
} from "./WalletStore";
import { queryDatabaseByUserId } from "./WalletStore";

dotenv.config();

const { PORT, TELEGRAM_TOKEN, SERVER_URL, MAINET_EXPLORER_URL } = process.env;

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
    const { data } = await axios.get(
      `${TELEGRAM_API}/setWebhook?url=${webhookURL}&drop_pending_updates=true`
    );
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
};

const getUpdates = async () => {
  try {
    const { data } = await axios.get(`${TELEGRAM_API}/getUpdates`);
    return data;
  } catch (error: any) {
    console.error("Error getting updates:", error.message);
  }
};

const getGroupUpdates = async () => {
  try {
    const { data } = await axios.get(`${TELEGRAM_API}/getUpdates`);
    const filteredMessages = filterMessagesByChannelTitle(
      data,
      "Chat Championship"
    );
    return filteredMessages;
  } catch (error: any) {
    console.error("Error getting updates:", error.message);
  }
};

function filterMessagesByChannelTitle(messages, channelTitle) {
  return messages.result.filter(
    (update) => update.message.chat.title === channelTitle
  );
}

function filterGroupChannels(messages) {
  return messages.result.filter(
    (update) => update.message.chat.type === "group"
  );
}

function filterMessages(messages, options) {
  return messages.result.filter((update) => {
    const message = update.message;
    const from = message.from;

    // Check if the message is from the specified user name
    const isUserNameMatch = options.userName
      ? from.username === options.userName
      : true;

    // Check if the message is from the specified user ID
    const isUserIdMatch = options.userId ? from.id === options.userId : true;

    // Check if the message is within the specified time range
    const isWithinTimeRange =
      options.startTime && options.endTime
        ? message.date >= options.startTime && message.date <= options.endTime
        : true;

    return isUserNameMatch && isUserIdMatch && isWithinTimeRange;
  });
}

// Example usage:
const options = {
  userName: "LiamTel", // Filter by user name
  userId: 5338078853, // Filter by user ID
  startTime: 1698452054, // Start time (Unix timestamp)
  endTime: 1698452093, // End time (Unix timestamp)
};

const sendMessageCondition = async (sentMessage, condition, sendMessage) => {
  try {
    if (sentMessage === condition) {
      const { data } = await axios.post(`${TELEGRAM_API}/sendMessage`, {
        chat_id: 123456789,
        text: sendMessage,
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
      text: sendMessage,
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
const instruction = `Analyze the participants of the conversation below based on their humor. Consider elements like wit, puns, timing, and context. Assign scores with a maximum of 100. The scores should normally be under 10. Write a json object like this: { name: score }`;
//const instruction1 = `can you rate the participants in this conversation based on their humor? Take 1000 points and distrbute them amongst each user based on their level of humor and map it against their name. The format is a json array of username: score  Only write the json data and not any text.`;
const instruction2 = `In the chatroom below, participants were rated based on the humor level of their messages. Using the provided leaderboard and messages, determine the reasoning behind each participant's score. How do their messages reflect their ranking on the leaderboard? Consider elements such as wit, puns, timing, and the context of the conversation.`;

const tokenAbi = [
  "function mint(address to, uint256 amount) public",
  "function transfer(address to, uint256 value) public returns (bool)",
  "function balanceOf(address owner) view returns (uint256)",
];

const provider = new ethers.JsonRpcProvider(process.env.RPC);
const deployerWallet = new ethers.Wallet(
  process.env.DEPLOYER_PRIVATE_KEY,
  provider
);
const ChatChampionContract = new ethers.Contract(
  process.env.CONTRACT_ADDRESS,
  tokenAbi,
  deployerWallet
);

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

async function analyzeChat(prompt: string): Promise<string> {
  //const currentDateTime = new Date().toLocaleString();
  try {
    const chatCompletion = await openai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "hackathon-chat",
      temperature: 0,
    });
    return chatCompletion?.choices[0]?.message.content;
  } catch (error) {
    console.error("Error getting completion from OpenAI:", error);
    throw error;
  }
}

// Should get the evm address of the telegram username.
async function usernameToAddress(username: string): Promise<string> {
  const userInfo = await queryDatabaseByUserName(username);
  return userInfo.address;
}
async function usernameToPrivateKey(username: string): Promise<string> {
  const userInfo = await queryDatabaseByUserName(username);
  return userInfo.key;
}

async function usernameCanJoin(username: string): Promise<boolean> {
  const address = usernameToAddress(username);

  if (!address) {
    return false;
  }
  const balance: ethers.BigNumberish = await ChatChampionContract.balanceOf(
    address
  );
  return (
    ethers.getBigInt(balance) >= ethers.getBigInt(1000) * ethers.WeiPerEther
  );
}

// Mints new tokens for the token reward
async function mintTokens(address: string, amount: BigInt) {
  try {
    const tx = await ChatChampionContract.mint(address, amount);
    await tx.wait(); // Wait for the transaction to be mined
    console.log(`Minted ${amount} tokens for address: ${address}`);
    return tx;
  } catch (err) {
    console.error(
      `Error minting tokens for address: ${address}. Error: ${err.message}`
    );
  }
}

// Switch to a self custody wallet
async function redeemTokens(
  telegramUsername: string,
  personalWallet: string,
  privateKey: string,
  custodialWallet: string
) {
  try {
    console.log(`private key ${privateKey}`);
    const AAWallet = new ethers.Wallet(privateKey, provider);
    const ChatChampionContractAsUser = new ethers.Contract(
      process.env.CONTRACT_ADDRESS,
      tokenAbi,
      AAWallet
    );

    await deployerWallet.sendTransaction({
      to: AAWallet,
      value: ethers.parseEther("0.05"),
    });

    const balance: ethers.BigNumberish =
      await ChatChampionContractAsUser.balanceOf(custodialWallet);

    if (ethers.getBigInt(balance) == ethers.getBigInt(0)) {
      console.error(
        `ERROR: User ${telegramUsername} has zero balance. Cannot proceed with the transfer.`
      );
      return;
    }
    const result = await ChatChampionContractAsUser.transfer(
      personalWallet,
      balance
    );
    console.log(
      `Successfully transferred ${balance.toString()} tokens to ${personalWallet} for user ${telegramUsername}. Transaction Hash: ${
        result.hash
      }`
    );

    return `${MAINET_EXPLORER_URL}${result.hash}`;
  } catch (error) {
    console.error(
      `ERROR: Failed to redeem tokens for user ${telegramUsername}. Details: ${error.message}`
    );
  }
}

async function balanceOf(address: string) {
  const balance: ethers.BigNumberish = await ChatChampionContract.balanceOf(
    address
  );
  return balance;
}

// Mints a pre-funded wallet that we use to invite people for free.
// Returns [address, privateKey]
async function mintWallet(
  telegramUsername: string
): Promise<[string, string, string]> {
  const wallet = ethers.Wallet.createRandom();
  //Temporarily disabled:
  //const primeSdk = new PrimeSdk({ privateKey: wallet.privateKey }, { chainId: parseInt(process.env.CHAINID), projectKey: process.env.ETHERSPOT_PROJECT_KEY  });
  //const address: string = await primeSdk.getCounterFactualAddress();
  const address: string = wallet.address;
  console.log("\x1b[33m%s\x1b[0m", `EtherspotWallet address: ${address}`);

  const tx = await mintTokens(
    address,
    ethers.getBigInt(1000) * ethers.WeiPerEther
  );

  console.log(tx);

  const transactionReceiptURL = `${MAINET_EXPLORER_URL}${tx.hash}`;

  return [address, wallet.privateKey, transactionReceiptURL];
}

async function distribute(jsonData: string) {
  const recieptUrls = [];
  type UserScores = {
    [username: string]: number;
  };
  let parsedData: UserScores = JSON.parse(jsonData);

  for (let username in parsedData) {
    if (parsedData.hasOwnProperty(username)) {
      let score = parsedData[username];
      console.log(`Username: ${username}, Score: ${score}`);
      let address = await usernameToAddress(username);
      let tx = await ChatChampionContract.mint(
        address,
        ethers.toBigInt(score) * ethers.WeiPerEther
      );
      recieptUrls.push(
        `Transfering  ${score} tokens to ${username} https://coston2-explorer.flare.network/tx/${tx.hash}`
      );
    }
  }
  return recieptUrls;
}

async function startAnalysis(messages: string) {
  console.log("Result:\n");
  var result = await analyzeChat(instruction + messages);
  console.log(result);

  const reciepts = await distribute(result);

  console.log("Reasoning:\n");
  var reasoning = await analyzeChat(
    instruction2 +
      "\n\nLeaderboard:\n" +
      result +
      "\n\nChatroom messages:\n" +
      messages
  );
  return { reasoning, reciepts };
}

app.post(URI, async (req: Request, res: Response) => {
  try {
    const chunk = req.body;
    const chatId = chunk.message.chat.id;
    const userId = chunk.message.from.id;
    const sentMessage = chunk.message.text;
    console.log("chatId", chatId);
    console.dir(req.body);
    updateArray.push(req.body);

    // ChatCache.addUpdate(chatId, req.body);
    const message: Message = convertToMessageObject(req.body);
    message.save();

    const regexCreateWallet = /^\/createWallet\s+(\S+)/;
    const matchForCreateWallet = sentMessage.match(regexCreateWallet);

    const regexRedeem = /^\/redeem\s+(\S+)/;
    const matchForRedeem = sentMessage.match(regexRedeem);

    if (matchForRedeem) {
      const address = matchForRedeem[1];
      let userWalletInfo = await queryDatabaseByUserId(userId + "A");
      console.log(userWalletInfo);

      if (!userWalletInfo || !userWalletInfo.address) {
        await sendMessage(
          chatId,
          "The following user does not have a wallet: " +
            userWalletInfo.username
        );
      }

      if (!userWalletInfo || !userWalletInfo.address) {
        await sendMessage(
          chatId,
          "The following user had already redeemed" +
            userWalletInfo.username +
            " to address: " +
            userWalletInfo.address
        );
      }

      await sendMessage(
        chatId,
        "about to redeem tokens for " +
          userWalletInfo.username +
          " to address: " +
          address
      );

      const urlReciept = await redeemTokens(
        userWalletInfo.username,
        address,
        userWalletInfo.key,
        userWalletInfo.address
      );

      // await deleteRowByUsername(userWalletInfo.username);
      // await addToDatabase(userId + "A", userWalletInfo.username, '', address);

      const numberOftokens = await balanceOf(address);
      await sendMessage(
        chatId,
        "Redeemed " +
          numberOftokens +
          " tokens for username: " +
          userWalletInfo.username +
          "\n\n reciept url:" +
          urlReciept
      );
    }

    //create a wallet
    if (matchForCreateWallet) {
      const username = matchForCreateWallet[1];
      const userWalletInfo = await queryDatabaseByUserName(username);
      console.log(userWalletInfo);

      if (userWalletInfo) {
        await sendMessage(
          chatId,
          "The following user already has a wallet: " + username
        );
      } else {
        await sendMessage(chatId, "about to create wallet for " + username);
        const result = await mintWallet(userId);
        const address = result[0];
        const privateKey = result[1];
        const recieptUrl = result[2];
        await addToDatabase(userId + "A", username, privateKey, address);
        await sendMessage(
          chatId,
          "Here is your wallet address: " +
            address +
            "\n\n reciept url:" +
            recieptUrl
        );
      }
    }

    //analyze the chat
    if (sentMessage === "/analyze") {
      const updates = ChatCache.getUpdates(chatId);
      await sendMessage(chatId, "Analysing the chat now ...");
      const { reasoning, reciepts } = await startAnalysis(updates);
      console.log(reasoning);
      await sendMessage(chatId, reasoning + "\n" + reciepts.join("\n"));
      ChatCache.resetChat(chatId);
    }

    // trial test the chat
    if (sentMessage === "/showchat") {
      const updates = ChatCache.getUpdates(chatId);
      console.log("=========UPDATES==========");
      console.log(updates);
      console.log("=========UPDATES==========");
    }

    if (sentMessage === "/start") {
      const welcomeMsg = `Welcome Chat Champion! 🌟🚀🎉

            Welcome to Chat Champions, an engaging Telegram community where you can earn tokens by chatting, engaging with communities, and sharing your humor through jokes. Join us, climb the leaderboard for rewards, participate in fun challenges, and reach out to our Chatbot Champions for assistance. Don't forget to create your wallet by messaging our admins to enhance your Chat Champions experience! 🌟💬🚀🎉
            
            Why be a Chat Champion?
            - Earn tokens by chatting and engaging with communities. 💬💰
            - Share humor and make jokes to add positivity. 😂😁
            - Climb the leaderboard for exciting rewards. 🏆🎁
            - Participate in regular challenges and special events. 🌈🎉
            - Chatbot Champions are ready to assist you. 🤖💼
            - Create your wallet for an enhanced experience. 💼✨
            - To redeem your tokens, type /redeem <address>💰
            
            Join now and DM our admins to get EXCLUSIVE ACCESS and WIN CHAMP Tokens!💬🏆`;

      await sendMessage(chatId, welcomeMsg);
    }

    // Send the response after the asynchronous operation is complete
    res.status(200).send("ok");
  } catch (error) {
    console.error(error);

    // Since no response has been sent yet, it's safe to send the error response here
    res.status(500).send("Internal Server Error");
  }
});

app.get(URI, (req, res) => {
  res.send("Hello");
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

/*
async function main () {
  const analysis = await analyzeChat(instruction + "\n\n\n" + formatMessages(`{"ok":true,"result":[{"update_id":177312581,
  "message":{"message_id":23,"from":{"id":5338078853,"is_bot":false,"first_name":"Liam","username":"LiamTel","language_code":"en"},"chat":{"id":-4066054986,"title":"Chat Championship","type":"group","all_members_are_administrators":true},"date":1698452054,"text":"hey henrik whatsup , this is a test"}},{"update_id":177312582,
  "message":{"message_id":24,"from":{"id":1386759162,"is_bot":false,"first_name":"Henrik","username":"henrik1111","language_code":"en"},"chat":{"id":-4066054986,"title":"Chat Championship","type":"group","all_members_are_administrators":true},"date":1698452068,"text":"Thanks for giving sample text"}},{"update_id":177312583,
  "message":{"message_id":25,"from":{"id":1386759162,"is_bot":false,"first_name":"Henrik","username":"henrik1111","language_code":"en"},"chat":{"id":-4066054986,"title":"Chat Championship","type":"group","all_members_are_administrators":true},"date":1698452071,"text":"lol"}},{"update_id":177312584,
  "message":{"message_id":26,"from":{"id":5338078853,"is_bot":false,"first_name":"Liam","username":"LiamTel","language_code":"en"},"chat":{"id":-4066054986,"title":"Chat Championship","type":"group","all_members_are_administrators":true},"date":1698452083,"text":"do you know whats blue and not heavy?"}},{"update_id":177312585,
  "message":{"message_id":27,"from":{"id":1386759162,"is_bot":false,"first_name":"Henrik","username":"henrik1111","language_code":"en"},"chat":{"id":-4066054986,"title":"Chat Championship","type":"group","all_members_are_administrators":true},"date":1698452088,"text":"no"}},{"update_id":177312586,
  "message":{"message_id":28,"from":{"id":5338078853,"is_bot":false,"first_name":"Liam","username":"LiamTel","language_code":"en"},"chat":{"id":-4066054986,"title":"Chat Championship","type":"group","all_members_are_administrators":true},"date":1698452093,"text":"light blue"}},{"update_id":177312587,
  "message":{"message_id":29,"from":{"id":1386759162,"is_bot":false,"first_name":"Henrik","username":"henrik1111","language_code":"en"},"chat":{"id":-4066054986,"title":"Chat Championship","type":"group","all_members_are_administrators":true},"date":1698452097,"text":"ahhahhah'"}}]}`));
  distribute(analysis);
}
main();*/
