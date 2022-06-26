const config = require('./config');
const ethers = require('ethers');
const input = require("input");
/**
** Don't Change this file, change settings in config.js
**/


async function getUserInput() {
    const choices = ['Default', 'Buy Only Low Liquidity Tokens 1-150 BNB', 'Buy Only Medium Liquidity Tokens 150-300 BNB', 'Buy Only High Liquidity Tokens 300-700 BNB', 'Custom Liquidity Strategy']
    const choices2 = ['COINMARKETCAP', 'COINGECKO', 'BOTH'];
    const channelChoices = ['CoinGecko & CoinMarketCap Listing Alerts', 'Coinmarketcap Fastest Alerts'];
    await input.select('Welcome, please choose a buying strategy', choices).then(async function (answers) {
        if (answers == 'Default') {
            console.log(config.strategy);
        }

        if (answers == "Buy Only Low Liquidity Tokens 1-150 BNB") {
            config.numberOfTokensToBuy = parseInt(await input.text("Enter number of different tokens you want to buy"));
            config.strategy.investmentAmount = await input.text("Enter Investment Amount in BNB");
            config.strategy.gasPrice = ethers.utils.parseUnits(await input.text("Enter Gas Price"), 'gwei');
            config.strategy.maxBuyTax = parseFloat(await input.text("Enter max buying tax"));
            config.strategy.minBuyTax = parseFloat(await input.text("Enter min buying tax"));
            config.strategy.maxSellTax = parseFloat(await input.text("Enter max sell tax"));
            config.strategy.minSellTax = parseFloat(await input.text("Enter min sell tax"));
            config.strategy.profitPercent = parseFloat(await input.text("Enter profit percent you want"));
            config.strategy.stopLossPercent = parseFloat(await input.text("Enter max loss percent"));
            config.strategy.trailingStopLossPercent = parseFloat(await input.text("Enter trailing stop loss percent"));
            config.strategy.percentOfTokensToSellProfit = parseFloat(await input.text("Enter percent of tokens to sell when profit reached"));
            config.strategy.percentOfTokensToSellLoss = parseFloat(await input.text("Enter percent of tokens to sell when stop loss reached"));
            config.strategy.maxLiquidity = 150;
            config.strategy.minLiquidity = 1;
            await input.select('Choose a channel to buy from', channelChoices).then(async function (channelAnswer) {
                if (channelAnswer == "CoinGecko & CoinMarketCap Listing Alerts") {
                    config.channel = 'CGCMC'
                    await input.select('Choose coinmarketcap, coingecko or both', choices2).then(async function (answers2) {
                        if (answers2 == "COINMARKETCAP") {
                            config.strategy.platform = "COINMARKETCAP";
                        }
                        else if (answers2 == "COINGECKO") {
                            config.strategy.platform = "COINGECKO";
                        } else {
                            config.strategy.platform = "BOTH";
                        }
                    });
                }
                else {
                    config.channel = 'CFA';
                }
            });
            console.log(config.strategy);
        }
        if (answers == "Buy Only Medium Liquidity Tokens 150-300 BNB") {
            config.numberOfTokensToBuy = parseInt(await input.text("Enter number of different tokens you want to buy"));
            config.strategy.investmentAmount = await input.text("Enter Investment Amount in BNB");
            config.strategy.gasPrice = ethers.utils.parseUnits(await input.text("Enter Gas Price"), 'gwei');
            config.strategy.maxBuyTax = parseFloat(await input.text("Enter max buying tax"));
            config.strategy.minBuyTax = parseFloat(await input.text("Enter min buying tax"));
            config.strategy.maxSellTax = parseFloat(await input.text("Enter max sell tax"));
            config.strategy.minSellTax = parseFloat(await input.text("Enter min sell tax"));
            config.strategy.profitPercent = parseFloat(await input.text("Enter profit percent you want"));
            config.strategy.stopLossPercent = parseFloat(await input.text("Enter max loss percent"));
            config.strategy.trailingStopLossPercent = parseFloat(await input.text("Enter trailing stop loss percent"));
            config.strategy.percentOfTokensToSellProfit = parseFloat(await input.text("Enter percent of tokens to sell when profit reached"));
            config.strategy.percentOfTokensToSellLoss = parseFloat(await input.text("Enter percent of tokens to sell when stop loss reached"));
            config.strategy.maxLiquidity = 300;
            config.strategy.minLiquidity = 150;
            await input.select('Choose a channel to buy from', channelChoices).then(async function (channelAnswer) {
                if (channelAnswer == "CoinGecko & CoinMarketCap Listing Alerts") {
                    config.channel = 'CGCMC'
                    await input.select('Choose coinmarketcap, coingecko or both', choices2).then(async function (answers2) {
                        if (answers2 == "COINMARKETCAP") {
                            config.strategy.platform = "COINMARKETCAP";
                        }
                        else if (answers2 == "COINGECKO") {
                            config.strategy.platform = "COINGECKO";
                        } else {
                            config.strategy.platform = "BOTH";
                        }
                    });
                }
                else {
                    config.channel = 'CFA';
                }
            });

            console.log(config.strategy);

        }
        if (answers == "Buy Only High Liquidity Tokens 300-700 BNB") {
            config.numberOfTokensToBuy = parseInt(await input.text("Enter number of different tokens you want to buy"));
            config.strategy.investmentAmount = await input.text("Enter Investment Amount in BNB");
            config.strategy.gasPrice = ethers.utils.parseUnits(await input.text("Enter Gas Price"), 'gwei');
            config.strategy.maxBuyTax = parseFloat(await input.text("Enter max buying tax"));
            config.strategy.minBuyTax = parseFloat(await input.text("Enter min buying tax"));
            config.strategy.maxSellTax = parseFloat(await input.text("Enter max sell tax"));
            config.strategy.minSellTax = parseFloat(await input.text("Enter min sell tax"));
            config.strategy.profitPercent = parseFloat(await input.text("Enter profit percent you want"));
            config.strategy.stopLossPercent = parseFloat(await input.text("Enter max loss percent"));
            config.strategy.trailingStopLossPercent = parseFloat(await input.text("Enter trailing stop loss percent"));
            config.strategy.percentOfTokensToSellProfit = parseFloat(await input.text("Enter percent of tokens to sell when profit reached"));
            config.strategy.percentOfTokensToSellLoss = parseFloat(await input.text("Enter percent of tokens to sell when stop loss reached"));
            config.strategy.maxLiquidity = 700;
            config.strategy.minLiquidity = 300;
            await input.select('Choose a channel to buy from', channelChoices).then(async function (channelAnswer) {
                if (channelAnswer == "CoinGecko & CoinMarketCap Listing Alerts") {
                    config.channel = 'CGCMC'
                    await input.select('Choose coinmarketcap, coingecko or both', choices2).then(async function (answers2) {
                        if (answers2 == "COINMARKETCAP") {
                            config.strategy.platform = "COINMARKETCAP";
                        }
                        else if (answers2 == "COINGECKO") {
                            config.strategy.platform = "COINGECKO";
                        } else {
                            config.strategy.platform = "BOTH";
                        }
                    });
                }
                else {
                    config.channel = 'CFA';
                }
            });

            console.log(config.strategy);
        }
        if (answers == "Custom Liquidity Strategy") {
            config.numberOfTokensToBuy = parseInt(await input.text("Enter number of different tokens you want to buy"));
            config.strategy.investmentAmount = await input.text("Enter Investment Amount in BNB");
            config.strategy.gasPrice = ethers.utils.parseUnits(await input.text("Enter Gas Price"), 'gwei');
            config.strategy.minLiquidity = parseFloat(await input.text("Enter minimum liquidity"));
            config.strategy.maxLiquidity = parseFloat(await input.text("Enter maximum liquidity"));
            config.strategy.maxBuyTax = parseFloat(await input.text("Enter max buying tax"));
            config.strategy.minBuyTax = parseFloat(await input.text("Enter min buying tax"));
            config.strategy.maxSellTax = parseFloat(await input.text("Enter max sell tax"));
            config.strategy.minSellTax = parseFloat(await input.text("Enter min sell tax"));
            config.strategy.profitPercent = parseFloat(await input.text("Enter profit percent you want"));
            config.strategy.stopLossPercent = parseFloat(await input.text("Enter max loss percent"));
            config.strategy.trailingStopLossPercent = parseFloat(await input.text("Enter trailing stop loss percent"));
            config.strategy.percentOfTokensToSellProfit = parseFloat(await input.text("Enter percent of tokens to sell when profit reached"));
            config.strategy.percentOfTokensToSellLoss = parseFloat(await input.text("Enter percent of tokens to sell when stop loss reached"));
            await input.select('Choose a channel to buy from', channelChoices).then(async function (channelAnswer) {
                if (channelAnswer == "CoinGecko & CoinMarketCap Listing Alerts") {
                    config.channel = 'CGCMC'
                    await input.select('Choose coinmarketcap, coingecko or both', choices2).then(async function (answers2) {
                        if (answers2 == "COINMARKETCAP") {
                            config.strategy.platform = "COINMARKETCAP";
                        }
                        else if (answers2 == "COINGECKO") {
                            config.strategy.platform = "COINGECKO";
                        } else {
                            config.strategy.platform = "BOTH";
                        }
                    });
                }
                else {
                    config.channel = 'CFA';
                }
            });

            console.log(config.strategy);

        }

    });
}

module.exports = {
    getUserInput
}
