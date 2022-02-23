
<p align="center"><a href="https://github.com/Scott-778/coinmarketcap-sniperbot"><img src="https://user-images.githubusercontent.com/91510798/154884209-769e345f-7e1a-46b5-ae64-1dff8752b564.PNG" alt="Logo" height="100"/></a></p>
<h1 align="center">CoinMarketCap Sniper Bot</h1>
<p align="center">Sniper bot to buy new tokens listed on CoinMarketCap.</p>



## Getting Started
CoinMarketCap sniper bot that buys BSC tokens when you recieve Telegram notification from this channel https://t.me/joinchat/b17jE6EbQX5kNWY8 use this link and subscribe. 
Use at your own risk. Investing in cryptocurrency is risky. This is not financial advice.
There is a small 0.7% buying fee per buy. This is to help me buy a cup of coffee and support for this project. 
If you have an issue please don't post screenshots with personal information like seed phrase, telephone number, Telegram code, Telegram two factor password, or Telegram string session. Please keep that information private!
This bot uses Smart Chain BNB to buy tokens not WBNB.

First, if you don't have node.js installed go to nodejs.org and install the lastest LTS version.
install git https://git-scm.com/downloads, or you can just download zip file if you don't want to clone repository.
Then go to my.telegram.org and create an app to get apiID and apiHash.
Then subscribe to this channel on Telegram https://t.me/joinchat/b17jE6EbQX5kNWY8.
Then Use the following commands either in VScode terminal or command prompt 
```
git clone https://github.com/Scott-778/coinmarketcap-sniperbot.git
```
```
cd coinmarketcap-sniperbot
```
```
npm install
```
Then edit .env file with your bsc wallet address, mnemonic, apiId and apiHash in your code editor and save file.

To start bot run this command
```
node cmcBot.js
```

When bot is running it it will ask for your telephone number to log in to Telegram enter your telephone number with country code ex 15555555555 then press enter. Then telegram will send you a code to log in enter that number and press enter. If you have two step verification on the bot will ask for your two step password. Then pick your buying strategy default, low liquidity, medium liquidity, high liquidity or create a custom strategy. Then leave the bot running and when you recieve a notification from this channel https://t.me/joinchat/b17jE6EbQX5kNWY8 the bot will buy that token.

## Strategies
#### Default strategy: 
This strategy buys all CoinmarketCap token and CoinGecko tokens no tax limit and no liquidity limit. High risk.
#### Low liquidity strategy: 
This strategy buys all low liquid tokens 1-150 BNB. You can choose your buy and sell tax limits. Choose either CoinMarketCap or CoinGecko. High risk.
#### Medium liquidity strategy:
This strategy buys all medium liquid tokens 150-300 BNB. You can choose your buy and sell tax limits. Choose either CoinMarketCap or CoinGecko. Medium risk.
#### High liquidity strategy:
This strategy buys all high liquid tokens 300-700 BNB. You can choose your buy and sell tax limits. Choose either CoinMarketCap or CoinGecko.
#### Custom strategy:
This strategy buys any token within your own custom settings. You can set you own liquidity and tax limits.Choose either CoinMarketCap or CoinGecko. Low risk.

## Screenshots
![ghss3](https://user-images.githubusercontent.com/91510798/154159554-cd6a2d3a-c0ca-4710-9c10-b0fe388467a1.png)
![ghss2](https://user-images.githubusercontent.com/91510798/154159575-bdebb6cb-b81d-4567-8733-3dca4ae743d6.png)
## Features coming soon
Soon I will add support for different Telegram channels.

## Social
Join my telegram group where we can talk about this project, tokens and the best strategies. https://t.me/CoinMarketCapSniperBot

## Contribute
If you can code and want to make this project better please feel free to contribute.
## Supporters
[![Stargazers repo roster for @Scott-778/coinmarketcap-sniperbot](https://reporoster.com/stars/Scott-778/coinmarketcap-sniperbot)](https://github.com/Scott-778/coinmarketcap-sniperbot/stargazers)

