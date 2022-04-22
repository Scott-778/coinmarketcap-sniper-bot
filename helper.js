const config = require('./config');
const ethers = require('ethers');
const input = require("input");
/**
** Don't Change this file, change settings in config.js
**/


async function getUserInput() {
    const choices = ['Default', 'Buy All Tokens', 'Buy Only Low Liquidity Tokens 1-150 BNB', 'Buy Only Medium Liquidity Tokens 150-300 BNB', 'Buy Only High Liquidity Tokens 300-700 BNB', 'Custom Strategy']
    const choices2 = ['COINMARKETCAP', 'COINGECKO'];
    const channelChoices = ['CoinGecko & CoinMarketCap Listing Alerts', 'Coinmarketcap Fastest Alerts'];
    await input.select('Welcome, please choose a buying strategy', choices).then(async function (answers) {
         if (answers == 'Default') {
            console.log('\n', 'Your strategy is', config.userStrategy);
            if (config.userStrategy == "LL") {
                console.log(config.strategyLL);
            } else if (config.userStrategy == "ML") {
                console.log(config.strategyML);
            } else if (config.userStrategy == "HL") {
                console.log(config.strategyHL);
            } else if (config.userStrategy == "BA") {
                console.log(config.buyAllTokensStrategy);
            } else if (config.userStrategy == "Custom") {
                console.log(config.customStrategy);
            } else {
                console.log("Invalid Strategy");
            }
        }
        if (answers == 'Buy All Tokens') {
            config.numberOfTokensToBuy = parseInt(await input.text("Enter number of different tokens you want to buy"));
            config.buyAllTokensStrategy.investmentAmount = await input.text("Enter Investment Amount in BNB");
            config.buyAllTokensStrategy.gasPrice = ethers.utils.parseUnits(await input.text("Enter Gas Price"), 'gwei');
            config.buyAllTokensStrategy.profitPercent = parseFloat(await input.text("Enter profit percent you want"));
            config.buyAllTokensStrategy.stopLossPercent = parseFloat(await input.text("Enter max loss percent"));
            config.buyAllTokensStrategy.trailingStopLossPercent = parseFloat(await input.text("Enter trailing stop loss percent"));
            config.buyAllTokensStrategy.percentOfTokensToSellProfit = parseFloat(await input.text("Enter percent of tokens to sell when profit reached"));
            config.buyAllTokensStrategy.percentOfTokensToSellLoss = parseFloat(await input.text("Enter percent of tokens to sell when stop loss reached"));
            await input.select('Choose a channel to buy from', channelChoices).then(async function (channelAnswer) {
                if (channelAnswer == "CoinGecko & CoinMarketCap Listing Alerts") {
                    config.channel = 'CGCMC'
                }
                else {
                    config.channel = 'CFA'
                }
            });
            config.userStrategy = 'BA';
        }
        if (answers == "Buy Only Low Liquidity Tokens 1-150 BNB") {
            config.numberOfTokensToBuy = parseInt(await input.text("Enter number of different tokens you want to buy"));
            config.strategyLL.investmentAmount = await input.text("Enter Investment Amount in BNB");
            config.strategyLL.gasPrice = ethers.utils.parseUnits(await input.text("Enter Gas Price"), 'gwei');
            config.strategyLL.maxBuyTax = parseFloat(await input.text("Enter max buying tax"));
            config.strategyLL.minBuyTax = parseFloat(await input.text("Enter min buying tax"));
            config.strategyLL.maxSellTax = parseFloat(await input.text("Enter max sell tax"));
            config.strategyLL.profitPercent = parseFloat(await input.text("Enter profit percent you want"));
            config.strategyLL.stopLossPercent = parseFloat(await input.text("Enter max loss percent"));
            config.strategyLL.trailingStopLossPercent = parseFloat(await input.text("Enter trailing stop loss percent"));
            config.strategyLL.percentOfTokensToSellProfit = parseFloat(await input.text("Enter percent of tokens to sell when profit reached"));
            config.strategyLL.percentOfTokensToSellLoss = parseFloat(await input.text("Enter percent of tokens to sell when stop loss reached"));
            await input.select('Choose a channel to buy from', channelChoices).then(async function (channelAnswer) {
                if (channelAnswer == "CoinGecko & CoinMarketCap Listing Alerts") {
                    config.channel = 'CGCMC'
                    await input.select('Choose coinmarketcap or coingecko', choices2).then(async function (answers2) {
                        if (answers2 == "COINMARKETCAP") {
                            config.strategyLL.platform = "COINMARKETCAP";
                        }
                        else {
                            config.strategyLL.platform = "COINGECKO";
                        }
                    });
                }
                else {
                    config.channel = 'CFA'
                }
            });
            config.userStrategy = 'LL';
        }
        if (answers == "Buy Only Medium Liquidity Tokens 150-300 BNB") {
            config.numberOfTokensToBuy = parseInt(await input.text("Enter number of different tokens you want to buy"));
            config.strategyML.investmentAmount = await input.text("Enter Investment Amount in BNB");
            config.strategyML.gasPrice = ethers.utils.parseUnits(await input.text("Enter Gas Price"), 'gwei');
            config.strategyML.maxBuyTax = parseFloat(await input.text("Enter max buying tax"));
            config.strategyML.minBuyTax = parseFloat(await input.text("Enter min buying tax"));
            config.strategyML.maxSellTax = parseFloat(await input.text("Enter max sell tax"));
            config.strategyML.profitPercent = parseFloat(await input.text("Enter profit percent you want"));
            config.strategyML.stopLossPercent = parseFloat(await input.text("Enter max loss percent"));
            config.strategyML.trailingStopLossPercent = parseFloat(await input.text("Enter trailing stop loss percent"));
            config.strategyML.percentOfTokensToSellProfit = parseFloat(await input.text("Enter percent of tokens to sell when profit reached"));
            config.strategyML.percentOfTokensToSellLoss = parseFloat(await input.text("Enter percent of tokens to sell when stop loss reached"));
            await input.select('Choose a channel to buy from', channelChoices).then(async function (channelAnswer) {
                if (channelAnswer == "CoinGecko & CoinMarketCap Listing Alerts") {
                    config.channel = 'CGCMC'
                    await input.select('Choose coinmarketcap or coingecko', choices2).then(async function (answers2) {
                        if (answers2 == "COINMARKETCAP") {
                            config.strategyML.platform = "COINMARKETCAP";
                        }
                        else {
                            config.strategyML.platform = "COINGECKO";
                        }
                    });
                }
                else {
                    config.channel = 'CFA'
                }
            });

            config.userStrategy = 'ML';

        }
        if (answers == "Buy Only High Liquidity Tokens 300-700 BNB") {
            config.numberOfTokensToBuy = parseInt(await input.text("Enter number of different tokens you want to buy"));
            config.strategyHL.investmentAmount = await input.text("Enter Investment Amount in BNB");
            config.strategyHL.gasPrice = ethers.utils.parseUnits(await input.text("Enter Gas Price"), 'gwei');
            config.strategyHL.maxBuyTax = parseFloat(await input.text("Enter max buying tax"));
            config.strategyHL.minBuyTax = parseFloat(await input.text("Enter min buying tax"));
            config.strategyHL.maxSellTax = parseFloat(await input.text("Enter max sell tax"));
            config.strategyHL.profitPercent = parseFloat(await input.text("Enter profit percent you want"));
            config.strategyHL.stopLossPercent = parseFloat(await input.text("Enter max loss percent"));
            config.strategyHL.trailingStopLossPercent = parseFloat(await input.text("Enter trailing stop loss percent"));
            config.strategyHL.percentOfTokensToSellProfit = parseFloat(await input.text("Enter percent of tokens to sell when profit reached"));
            config.strategyHL.percentOfTokensToSellLoss = parseFloat(await input.text("Enter percent of tokens to sell when stop loss reached"));
            await input.select('Choose a channel to buy from', channelChoices).then(async function (channelAnswer) {
                if (channelAnswer == "CoinGecko & CoinMarketCap Listing Alerts") {
                    config.channel = 'CGCMC'
                    await input.select('Choose coinmarketcap or coingecko', choices2).then(async function (answers2) {
                        if (answers2 == "COINMARKETCAP") {
                            config.strategyHL.platform = "COINMARKETCAP";
                        }
                        else {
                            config.strategyHL.platform = "COINGECKO";
                        }
                    });
                }
                else {
                    config.channel = 'CFA'
                }
            });

            config.userStrategy = 'HL';
        }
        if (answers == "Custom Strategy") {
            config.numberOfTokensToBuy = parseInt(await input.text("Enter number of different tokens you want to buy"));
            config.customStrategy.investmentAmount = await input.text("Enter Investment Amount in BNB");
            config.customStrategy.gasPrice = ethers.utils.parseUnits(await input.text("Enter Gas Price"), 'gwei');
            config.customStrategy.minLiquidity = parseFloat(await input.text("Enter minimum liquidity"));
            config.customStrategy.maxLiquidity = parseFloat(await input.text("Enter maximum liquidity"));
            config.customStrategy.maxBuyTax = parseFloat(await input.text("Enter max buying tax"));
            config.customStrategy.minBuyTax = parseFloat(await input.text("Enter min buying tax"));
            config.customStrategy.maxSellTax = parseFloat(await input.text("Enter max sell tax"));
            config.customStrategy.profitPercent = parseFloat(await input.text("Enter profit percent you want"));
            config.customStrategy.stopLossPercent = parseFloat(await input.text("Enter max loss percent"));
            config.customStrategy.trailingStopLossPercent = parseFloat(await input.text("Enter trailing stop loss percent"));
            config.customStrategy.percentOfTokensToSellProfit = parseFloat(await input.text("Enter percent of tokens to sell when profit reached"));
            config.customStrategy.percentOfTokensToSellLoss = parseFloat(await input.text("Enter percent of tokens to sell when stop loss reached"));
            await input.select('Choose a channel to buy from', channelChoices).then(async function (channelAnswer) {
                if (channelAnswer == "CoinGecko & CoinMarketCap Listing Alerts") {
                    config.channel = 'CGCMC'
                    await input.select('Choose coinmarketcap or coingecko', choices2).then(async function (answers2) {
                        if (answers2 == "COINMARKETCAP") {
                            config.customStrategy.platform = "COINMARKETCAP";
                        }
                        else {
                            config.customStrategy.platform = "COINGECKO";
                        }
                    });
                }
                else {
                    config.channel = 'CFA'
                }
            });
            config.userStrategy = 'Custom';
        }

    });
}

module.exports = {
    getUserInput
}
