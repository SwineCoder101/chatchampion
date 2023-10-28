"use strict";
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
const dotenv_1 = __importDefault(require("dotenv"));
const express_1 = __importDefault(require("express"));
const axios_1 = __importDefault(require("axios"));
const ChatCache_1 = __importDefault(require("./ChatCache"));
const flock_main_1 = __importDefault(require("./flock-main"));
dotenv_1.default.config();
const { PORT, TELEGRAM_TOKEN, SERVER_URL } = process.env;
const app = (0, express_1.default)();
app.use(express_1.default.json());
const updateArray = [];
app.get("/", (req, res) => {
    res.send("Welcome to the bot server!");
});
const TELEGRAM_API = `https://api.telegram.org/bot${TELEGRAM_TOKEN}`;
const URI = `/webhook/${TELEGRAM_TOKEN}`;
const webhookURL = `${SERVER_URL}${URI}`;
const setupWebhook = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { data } = yield axios_1.default.get(`${TELEGRAM_API}/setWebhook?url=${webhookURL}&drop_pending_updates=true`);
        console.log(data);
    }
    catch (error) {
        console.error("Error setting up the webhook:", error.message);
    }
});
const deleteWebhook = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { data } = yield axios_1.default.get(`${TELEGRAM_API}/deleteWebhook`);
        console.log(data);
    }
    catch (error) {
        console.error("Error deleting the webhook:", error.message);
    }
});
const getUpdates = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { data } = yield axios_1.default.get(`${TELEGRAM_API}/getUpdates`);
        return data;
    }
    catch (error) {
        console.error("Error getting updates:", error.message);
    }
});
const getGroupUpdates = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { data } = yield axios_1.default.get(`${TELEGRAM_API}/getUpdates`);
        const filteredMessages = filterMessagesByChannelTitle(data, "Chat Championship");
        return filteredMessages;
    }
    catch (error) {
        console.error("Error getting updates:", error.message);
    }
});
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
    userName: "LiamTel",
    userId: 5338078853,
    startTime: 1698452054,
    endTime: 1698452093 // End time (Unix timestamp)
};
const sendMessageCondition = (sentMessage, condition, sendMessage) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (sentMessage === condition) {
            const { data } = yield axios_1.default.post(`${TELEGRAM_API}/sendMessage`, {
                chat_id: 123456789,
                text: sendMessage
            });
            console.log(data);
        }
    }
    catch (error) {
        console.error("Error sending message:", error.message);
    }
});
const sendMessage = (chatId, sendMessage) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { data } = yield axios_1.default.post(`${TELEGRAM_API}/sendMessage`, {
            chat_id: chatId,
            text: sendMessage
        });
    }
    catch (error) {
        console.error("Error sending message:", error.message);
    }
});
const resetUpdates = () => __awaiter(void 0, void 0, void 0, function* () {
    yield setupWebhook();
    yield deleteWebhook();
});
app.post(URI, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const chunk = req.body;
        const chatId = chunk.message.chat.id;
        const userId = chunk.message.from.id;
        const sentMessage = chunk.message.text;
        console.log('chatId', chatId);
        console.dir(req.body);
        updateArray.push(req.body);
        ChatCache_1.default.addUpdate(chatId, req.body);
        //create a wallet
        if (sentMessage === '/createWallet') {
            sendMessage(chatId, 'about to create wallet here');
        }
        //analyze the chat
        if (sentMessage === '/analyze') {
            const updates = ChatCache_1.default.getUpdates(chatId);
            sendMessage(chatId, 'Analysing the chat now ...');
            const analysis = yield (0, flock_main_1.default)(updates);
            console.log(analysis);
            sendMessage(chatId, analysis);
            ChatCache_1.default.resetChat(chatId);
        }
        // trial test the chat
        if (sentMessage === '/showchat') {
            const updates = ChatCache_1.default.getUpdates(chatId);
            console.log("=========UPDATES==========");
            console.log(updates);
            console.log("=========UPDATES==========");
        }
        // Send the response after the asynchronous operation is complete
        res.status(200).send('ok');
    }
    catch (error) {
        console.error(error);
        // Since no response has been sent yet, it's safe to send the error response here
        res.status(500).send('Internal Server Error');
    }
}));
app.get(URI, (req, res) => {
    res.send('Hello');
});
let offset = 0;
app.listen(PORT, () => __awaiter(void 0, void 0, void 0, function* () {
    console.log(`Server running on port ${PORT}`);
    console.log(`Webhook URL: ${webhookURL}`);
    try {
        yield setupWebhook();
    }
    catch (error) {
        console.error("Webhook setup failed:", error.message);
    }
}));
//# sourceMappingURL=bot.js.map