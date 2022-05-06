const ethers = require('ethers');

/**
** Strategy Configuration file
**/

/**
 * Choose your channel to buy from
 * You have to join these channels on your telegram app
 * 
 * CGCMC = CoinGecko & CoinmarketCap Listing Alerts Premium https://t.me/CMC_CG_listing_alerts
 * 
 * CFA = Coinmarketcap Fastest Alerts https://t.me/CMC_fastest_alerts
 * 
 *
 * 
 * **/
module.exports.channel = 'CGCMC';   // CGCMC or CFA 
module.exports.numberOfTokensToBuy = 10; // number of different tokens you want to buy

module.exports.autoSell = true;  // If you want to auto sell or not 

module.exports.myGasPriceForApproval = ethers.utils.parseUnits('6', 'gwei'); // Gas to approve and sell

module.exports.myGasLimit = 1500000; // gas limit doesnt need to be changed if too low transaction will fail

module.exports.userStrategy = 'BA'; // BA, LL, ML, HL or Custom.  // Choose your strategy


/* Strategy for buying all tokens (BA)*/
module.exports.buyAllTokensStrategy = {

    investmentAmount: '0.01', // Amount to invest per token in BNB
    gasPrice: ethers.utils.parseUnits('5', 'gwei'),
    profitPercent: 100,      // 100% profit
    stopLossPercent: 10,  // 10% loss
    percentOfTokensToSellProfit: 100, // sell 75% when profit is reached
    percentOfTokensToSellLoss: 100, // sell 100% when stoploss is reached 
    trailingStopLossPercent: 15// 15% trailing stoploss
}

/* Strategy for buying low-liquid tokens (LL) */
module.exports.strategyLL =
{
    investmentAmount: '0.15', 	// Investment amount per token
    maxBuyTax: 2, 			// max buy tax
    minBuyTax: 0,			// min buy tax
    maxSellTax: 2,			// max sell tax
    minSellTax: 0,           // min sell tax
    maxLiquidity: 250,	        // max Liquidity BNB
    minLiquidity: 45, 	  	// min Liquidity BNB
    profitPercent: 300,          // 2.5X
    stopLossPercent: 30,        // 30% loss
    platform: "COINMARKETCAP",      // Either COINMARKETCAP or COINGECKO
    gasPrice: ethers.utils.parseUnits('9', 'gwei'), // Gas Price. Higher is better for low liquidity
    percentOfTokensToSellProfit: 60, // sell 75% when profit is reached
    percentOfTokensToSellLoss: 60, // sell 100% when stoploss is reached 
    trailingStopLossPercent: 5 // % trailing stoploss
}

/* Strategy for buying medium-liquid tokens (ML) */
module.exports.strategyML =
{
    investmentAmount: '0.2', 	// Investment amount per token
    maxBuyTax: 11,           	 // max buy tax
    minBuyTax: 2,			// min buy tax
    maxSellTax: 11,			// max sell tax
    minSellTax: 0,           // min sell tax
    maxLiquidity: 300,	        // max Liquidity BNB
    minLiquidity: 150, 	  	// min Liquidity BNB
    profitPercent: 80,          // 80% profit
    stopLossPercent: 20,        // 20% loss
    platform: "COINMARKETCAP",          // Either COINMARKETCAP or COINGECKO
    gasPrice: ethers.utils.parseUnits('1', 'gwei'),
    percentOfTokensToSellProfit: 75, // sell 75% when profit is reached
    percentOfTokensToSellLoss: 100, // sell 100% when stoploss is reached
    trailingStopLossPercent: 10 // % trailing stoploss
}

/* Strategy for buying high-liquid tokens (HL)*/
module.exports.strategyHL =
{
    investmentAmount: '0.2', 	// Investment amount per token
    maxBuyTax: 11,            	// max buy tax
    minBuyTax: 0,			// min buy tax
    maxSellTax: 11,			// max sell tax
    minSellTax: 0,           // min sell tax
    maxLiquidity: 700,	   	// max Liquidity BNB
    minLiquidity: 300, 	  	// min Liquidity BNB
    profitPercent: 50,          // 50% profit
    stopLossPercent: 10,        // 10% loss
    platform: "COINMARKETCAP",      // Either COINMARKETCAP or COINGECKO
    gasPrice: ethers.utils.parseUnits('1', 'gwei'),
    percentOfTokensToSellProfit: 75, // sell 75% of tokens when profit is reached
    percentOfTokensToSellLoss: 100, // sell 100% of tokens when stoploss is reached
    trailingStopLossPercent: 10 // % trailing stoploss
}
/* Custom Strategy  (Custom) */
module.exports.customStrategy = {
    investmentAmount: '0.3', 	// Investment amount per token
    maxBuyTax: 3,            	// max buy tax
    minBuyTax: 0,			// min buy tax
    maxSellTax: 3,			// max sell tax
    minSellTax: 0,           // min sell tax
    maxLiquidity: 1000,	   	// max Liquidity BNB
    minLiquidity: 250, 	  	// min Liquidity BNB
    profitPercent: 50,          // 50% profit
    stopLossPercent: 10,        // 10% loss
    platform: "COINMARKETCAP",      // Either COINMARKETCAP or COINGECKO
    gasPrice: ethers.utils.parseUnits('1', 'gwei'),
    percentOfTokensToSellProfit: 75, // sell 75% of tokens when profit is reached
    percentOfTokensToSellLoss: 100, // sell 100% of tokens when stoploss is reached
    trailingStopLossPercent: 10 // % trailing stoploss
}

