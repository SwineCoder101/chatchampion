import OpenAI from "openai";
import * as dotenv from "dotenv";
dotenv.config({ path: "/.env" });
import { ethers } from "ethers";

type MintInfo = {
  address: string;
  amount: ethers.BigNumberish;
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
const instruction = `can you rate the participants in this conversation based on their humor? Take 1000 points and distrbute them amongst each user based on their level of humor and map it against their name. The format is a json array of username: score  Only write the json data and not any text.`;
const instruction2 = `In the chatroom below, participants were rated based on the humor level of their messages. Using the provided leaderboard and messages, determine the reasoning behind each participant's score. How do their messages reflect their ranking on the leaderboard? Consider elements such as wit, puns, timing, and the context of the conversation.`;
const tokenAbi = [
  "function mint(address to, uint256 amount) public"
];

function getMessages(): string {
  return `{"ok":true,"result":[{"update_id":177312581,
  "message":{"message_id":23,"from":{"id":5338078853,"is_bot":false,"first_name":"Liam","username":"LiamTel","language_code":"en"},"chat":{"id":-4066054986,"title":"Chat Championship","type":"group","all_members_are_administrators":true},"date":1698452054,"text":"hey henrik whatsup , this is a test"}},{"update_id":177312582,
  "message":{"message_id":24,"from":{"id":1386759162,"is_bot":false,"first_name":"Henrik","username":"henrik1111","language_code":"en"},"chat":{"id":-4066054986,"title":"Chat Championship","type":"group","all_members_are_administrators":true},"date":1698452068,"text":"Thanks for giving sample text"}},{"update_id":177312583,
  "message":{"message_id":25,"from":{"id":1386759162,"is_bot":false,"first_name":"Henrik","username":"henrik1111","language_code":"en"},"chat":{"id":-4066054986,"title":"Chat Championship","type":"group","all_members_are_administrators":true},"date":1698452071,"text":"lol"}},{"update_id":177312584,
  "message":{"message_id":26,"from":{"id":5338078853,"is_bot":false,"first_name":"Liam","username":"LiamTel","language_code":"en"},"chat":{"id":-4066054986,"title":"Chat Championship","type":"group","all_members_are_administrators":true},"date":1698452083,"text":"do you know whats blue and not heavy?"}},{"update_id":177312585,
  "message":{"message_id":27,"from":{"id":1386759162,"is_bot":false,"first_name":"Henrik","username":"henrik1111","language_code":"en"},"chat":{"id":-4066054986,"title":"Chat Championship","type":"group","all_members_are_administrators":true},"date":1698452088,"text":"no"}},{"update_id":177312586,
  "message":{"message_id":28,"from":{"id":5338078853,"is_bot":false,"first_name":"Liam","username":"LiamTel","language_code":"en"},"chat":{"id":-4066054986,"title":"Chat Championship","type":"group","all_members_are_administrators":true},"date":1698452093,"text":"light blue"}},{"update_id":177312587,
  "message":{"message_id":29,"from":{"id":1386759162,"is_bot":false,"first_name":"Henrik","username":"henrik1111","language_code":"en"},"chat":{"id":-4066054986,"title":"Chat Championship","type":"group","all_members_are_administrators":true},"date":1698452097,"text":"ahhahhah'"}}]}`;
}

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

  const currentDateTime = new Date().toLocaleString();
  //console.log(`Routine executed at: ${currentDateTime}`);
  //console.log("Prompt:", prompt);
  //console.log("Model:", process.env.model_name);
  try {
    const chatCompletion = await openai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "hackathon-chat",
    });
    //console.log("Response:", chatCompletion);
    //console.log("Choices:", chatCompletion?.choices[0].message);
    return chatCompletion?.choices[0]?.message.content;
  } catch (error) {
    console.error("Error getting completion from OpenAI:", error);
    throw error;
  }
}




async function mintTokens(providerUrl: string, privateKey: string, contractAddress: string, mintInfos: MintInfo[]) {
  const provider = new ethers.JsonRpcProvider(providerUrl);
  const wallet = new ethers.Wallet(privateKey, provider);
  const contract = new ethers.Contract(contractAddress, tokenAbi, wallet);

  for (let info of mintInfos) {
    try {
      const tx = await contract.mint(info.address, info.amount);
      await tx.wait();  // Wait for the transaction to be mined
      console.log(`Minted ${info.amount} tokens for address: ${info.address}`);
    } catch (err) {
      console.error(`Error minting tokens for address: ${info.address}. Error: ${err.message}`);
    }
  }
}

async function main() {
  var messages = formatMessages(getMessages());
  console.log("Result:\n");
  var result = await analyzeChat(instruction + messages);
  console.log(result);

  console.log("Reasoning:\n");
  var reasoning = await analyzeChat(instruction2 + "\n\nLeaderboard:\n" + result + "\n\nChatroom messages:\n" + messages);
  console.log(reasoning);
}
main();
