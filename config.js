const ethers = require('ethers');
/**
** Configuration file
**/

/**
 * Choose your channel to buy from
 * You have to join these channels on your telegram app
 * 
 * GCCMC = CoinGecko & CoinmarketCap Listing Alerts Premium https://t.me/CMC_CG_listing_alerts
 * 
 * CFA = Coinmarketcap Fastest Alerts https://t.me/CMC_fastest_alerts
 * 
 *
 * 
 * **/
module.exports.channel = 'CGCMC';   // CGCMC or CFA 

module.exports.numberOfTokensToBuy = 1; // number of tokens you want to buy

module.exports.autoSell = true;  // If you want to auto sell or not 

module.exports.myGasPriceForApproval = ethers.utils.parseUnits('6', 'gwei'); // Gas to approve and sell

module.exports.myGasLimit = 1000000; // gas limit doesnt need to be changed if too low transaction will fail



module.exports.strategy =
{
    investmentAmount: '0.15', 	// Investment amount per token
    maxBuyTax: 12, 			// max buy tax
    minBuyTax: 0,			// min buy tax
    maxSellTax: 12,			// max sell tax
    minSellTax: 0,           // min sell tax
    maxLiquidity: 300,	        // max Liquidity BNB
    minLiquidity: 50, 	  	// min Liquidity BNB
    profitPercent: 200,          // 2.5X
    stopLossPercent: 30,        // 30% loss
    platform: "COINMARKETCAP",      // Either COINMARKETCAP or COINGECKO  OR BOTH
    gasPrice: ethers.utils.parseUnits('7', 'gwei'), // Gas Price. Higher is better for low liquidity
    percentOfTokensToSellProfit: 40, // sell 75% when profit is reached
    percentOfTokensToSellLoss: 60, // sell 100% when stoploss is reached 
    trailingStopLossPercent: 10 // % trailing stoploss
}


