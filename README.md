# chatchampion

##Welcome Chat Champion! 🌟🚀🎉

Welcome to Chat Champions, an engaging Telegram community where you can earn tokens by chatting, engaging with communities, and sharing your humor through jokes. Join us, climb the leaderboard for rewards, participate in fun challenges, and reach out to our Chatbot Champions for assistance. Don't forget to create your wallet by messaging our admins to enhance your Chat Champions experience! 🌟💬🚀🎉


Why be a Chat Champion?
- Earn tokens by chatting and engaging with communities. 💬💰
- Share humor and make jokes to add positivity. 😂😁
- Climb the leaderboard for exciting rewards. 🏆🎁
- Participate in regular challenges and special events. 🌈🎉
- Chatbot Champions are ready to assist you. 🤖💼
- Create your wallet for an enhanced experience. 💼✨
- To redeem your tokens, type /redeem <address>💰

Join now and DM our admins to get EXCLUSIVE ACCESS and WIN CHAMP Tokens!💬🏆

This project is built on node express with FlockSDK and deployed to Flare network mainnet

##How To
To Run locally:
```
npm run dev
```

To Deploy
```
vercel prod
```
##Architecture

![telegram-cloud-photo-size-4-5904440092301312797-y](https://github.com/SwineCoder101/chatchampion/assets/20050550/00fae679-fed5-45d5-baf6-8d0621023913)


1. Flock SDK for AI Agent: We integrated the Flock SDK to enable an AI agent within our Chat Champions chatbot. This AI agent played a crucial role in analyzing conversations using sentiment analysis and assigning sentiment scores to interactions, enhancing community engagement and participation.

2. Deployed Flare Mainnet: We successfully deployed the Flare Mainnet, which played a pivotal role in our token reward system. It allowed us to create and manage our native tokens, which users earned by actively participating in the community.

3. Etherspot Account Abstraction and SDK: We utilized Etherspot's Account Abstraction and SDK to streamline the user experience and facilitate the creation of wallets for our Chat Champions community members. This technology ensured a smooth process for users to manage their earned tokens and interact with our chatbot's reward system effectively.

By implementing these technologies, we were able to create a seamless and engaging experience for our Chat Champions community, enhancing interaction, rewarding participation, and encouraging positive engagement within the community."

##Code Structure
We have two packages one for foundry smart contract deployment of the erc20 token and the telegram service which consists of the sdks and interaction with telegram under a webhook implementation. The server caches the messages per channel and gives the option to analyze


