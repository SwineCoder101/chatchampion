"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const openai_1 = __importDefault(require("openai"));
const dotenv = __importStar(require("dotenv"));
dotenv.config({ path: "/.env" });
const ethers_1 = require("ethers");
const openai = new openai_1.default({
    apiKey: "",
    baseURL: "http://flock.tools:8001/v1", // defaults to https://api.openai.com/v1
});
const instruction = `can you rate the participants in this conversation based on their humor? Take 1000 points and distrbute them amongst each user based on their level of humor and map it against their name. The format is a json array of username: score  Only write the json data and not any text. At the end of the analysis give a json summary`;
const instruction1 = `can you rate the participants in this conversation based on their humor? Take 1000 points and distrbute them amongst each user based on their level of humor and map it against their name. The format is a json array of username: score  Only write the json data and not any text.`;
const instruction2 = `In the chatroom below, participants were rated based on the humor level of their messages. Using the provided leaderboard and messages, determine the reasoning behind each participant's score. How do their messages reflect their ranking on the leaderboard? Consider elements such as wit, puns, timing, and the context of the conversation.`;
const tokenAbi = [
    "function mint(address to, uint256 amount) public"
];
function getMessages() {
    return `{"ok":true,"result":[{"update_id":177312581,
  "message":{"message_id":23,"from":{"id":5338078853,"is_bot":false,"first_name":"Liam","username":"LiamTel","language_code":"en"},"chat":{"id":-4066054986,"title":"Chat Championship","type":"group","all_members_are_administrators":true},"date":1698452054,"text":"hey henrik whatsup , this is a test"}},{"update_id":177312582,
  "message":{"message_id":24,"from":{"id":1386759162,"is_bot":false,"first_name":"Henrik","username":"henrik1111","language_code":"en"},"chat":{"id":-4066054986,"title":"Chat Championship","type":"group","all_members_are_administrators":true},"date":1698452068,"text":"Thanks for giving sample text"}},{"update_id":177312583,
  "message":{"message_id":25,"from":{"id":1386759162,"is_bot":false,"first_name":"Henrik","username":"henrik1111","language_code":"en"},"chat":{"id":-4066054986,"title":"Chat Championship","type":"group","all_members_are_administrators":true},"date":1698452071,"text":"lol"}},{"update_id":177312584,
  "message":{"message_id":26,"from":{"id":5338078853,"is_bot":false,"first_name":"Liam","username":"LiamTel","language_code":"en"},"chat":{"id":-4066054986,"title":"Chat Championship","type":"group","all_members_are_administrators":true},"date":1698452083,"text":"do you know whats blue and not heavy?"}},{"update_id":177312585,
  "message":{"message_id":27,"from":{"id":1386759162,"is_bot":false,"first_name":"Henrik","username":"henrik1111","language_code":"en"},"chat":{"id":-4066054986,"title":"Chat Championship","type":"group","all_members_are_administrators":true},"date":1698452088,"text":"no"}},{"update_id":177312586,
  "message":{"message_id":28,"from":{"id":5338078853,"is_bot":false,"first_name":"Liam","username":"LiamTel","language_code":"en"},"chat":{"id":-4066054986,"title":"Chat Championship","type":"group","all_members_are_administrators":true},"date":1698452093,"text":"light blue"}},{"update_id":177312587,
  "message":{"message_id":29,"from":{"id":1386759162,"is_bot":false,"first_name":"Henrik","username":"henrik1111","language_code":"en"},"chat":{"id":-4066054986,"title":"Chat Championship","type":"group","all_members_are_administrators":true},"date":1698452097,"text":"ahhahhah'"}}]}`;
}
function formatMessages(jsonData) {
    const data = JSON.parse(jsonData);
    // Check if the structure of the JSON is as expected
    if (!data.ok || !data.result || !Array.isArray(data.result)) {
        throw new Error("Invalid JSON format");
    }
    const messages = data.result.map((item) => {
        const username = item.message.from.username || item.message.from.first_name;
        const messageText = item.message.text;
        return `${username}: ${messageText}`;
    });
    return messages.join("\n");
}
function analyzeChat(prompt) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        const currentDateTime = new Date().toLocaleString();
        //console.log(`Routine executed at: ${currentDateTime}`);
        //console.log("Prompt:", prompt);
        //console.log("Model:", process.env.model_name);
        try {
            const chatCompletion = yield openai.chat.completions.create({
                messages: [{ role: "user", content: prompt }],
                model: "hackathon-chat",
            });
            //console.log("Response:", chatCompletion);
            //console.log("Choices:", chatCompletion?.choices[0].message);
            return (_a = chatCompletion === null || chatCompletion === void 0 ? void 0 : chatCompletion.choices[0]) === null || _a === void 0 ? void 0 : _a.message.content;
        }
        catch (error) {
            console.error("Error getting completion from OpenAI:", error);
            throw error;
        }
    });
}
function mintTokens(providerUrl, privateKey, contractAddress, mintInfos) {
    return __awaiter(this, void 0, void 0, function* () {
        const provider = new ethers_1.ethers.JsonRpcProvider(providerUrl);
        const wallet = new ethers_1.ethers.Wallet(privateKey, provider);
        const contract = new ethers_1.ethers.Contract(contractAddress, tokenAbi, wallet);
        for (let info of mintInfos) {
            try {
                const tx = yield contract.mint(info.address, info.amount);
                yield tx.wait(); // Wait for the transaction to be mined
                console.log(`Minted ${info.amount} tokens for address: ${info.address}`);
            }
            catch (err) {
                console.error(`Error minting tokens for address: ${info.address}. Error: ${err.message}`);
            }
        }
    });
}
function startAnalysis(messages) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log("Result:\n");
        var result = yield analyzeChat(instruction + messages);
        console.log(result);
        console.log("Reasoning:\n");
        var reasoning = yield analyzeChat(instruction2 + "\n\nLeaderboard:\n" + result + "\n\nChatroom messages:\n" + messages);
        return reasoning;
    });
}
// async function main() {
//   var messages = formatMessages(getMessages());
//   console.log("Result:\n");
//   var result = await analyzeChat(instruction + messages);
//   console.log(result);
//   console.log("Reasoning:\n");
//   var reasoning = await analyzeChat(instruction2 + "\n\nLeaderboard:\n" + result + "\n\nChatroom messages:\n" + messages);
//   console.log(reasoning);
// }
// main();
exports.default = startAnalysis;
//# sourceMappingURL=flock-main.js.map