/*
coinmarketcap-new-listings-sniper-bot
Coinmarketcap new listings sniper bot that uses 
telegram notifications from this telegram channel
https://t.me/joinchat/b17jE6EbQX5kNWY8 use this link and subscribe.
Turn on two step verification in telegram.
Go to my.telegram.org and create App to get api_id and api_hash.

*/
const { TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");
const input = require("input");
const { NewMessage } = require('telegram/events');
const ethers = require('ethers');
const open = require('open');

const addresses = {
    WBNB: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
    pancakeRouter: '0x10ED43C718714eb63d5aA57B78B54704E256024E',
    BUSD: '0xe9e7cea3dedca5984780bafc599bd69add087d56',
    buyContract: '0xDC56800e179964C3C00a73f73198976397389d26',

    recipient: '' // Your wallet address here
}

/*-----------Settings-----------*/
const mnemonic = ''; // Wallet seed phrase
const apiId = 111111; // Replace with your own api id 
const apiHash = '';   // Replace with your own api hash
const stringSession = new StringSession(""); // fill this later with the value from long string on command prompt to avoid logging in again

const numberOfTokensToBuy = 10; // number of different tokens you want to buy
const autoSell = true;  // If you want to auto sell or not 

const myGasPriceForApproval = ethers.utils.parseUnits('6', 'gwei');
const myGasLimit = 1500000;

const BUYALLTOKENS = true; // if true it will buy all tokens without stategies, change to false to use the strategy filters

/* if BUYALLTOKENS is true. Default Strategy to buy any token that we get notification for and liquidity is BNB */
const buyAllTokensStrategy = {

	investmentAmount: '0.5', // Amount to invest per token in BNB
	gasPrice: ethers.utils.parseUnits('10', 'gwei'),
	profitMultiplier: 2.5,      // 2.5X
	stopLossMultiplier: 0.7,  // 30% loss
	percentOfTokensToSellProfit: 75, // sell 75% when profit is reached
	percentOfTokensToSellLoss: 100 // sell 100% when stoploss is reached 
}

/*------------Advanced Settings-------------*/
/* if BUYALLTOKENS is false it will filter tokens to buy based on strategies below, you can adjust these filters to your preference.
   You can also use just one strategy, for example if I wanted to only use the low liquidity strategy I would change maxTax on lines 77 and 92 to a negative value ex -1 */


/* Strategy for buying low-liquid tokens */
const strategyLL =
{
	investmentAmount: '0.1', 	// Investment amount per token in BNB
	maxBuyTax: 20,            	// max buy slippage
	maxSellTax: 20,			// max sell slippage
	maxLiquidity: 100,	        // max Liquidity BNB
	minLiquidity: 10, 	  	// min Liquidity BNB
	profitMultiplier: 2.5,          // 2.5X
	stopLossMultiplier: 0.7,        // 30% loss
	platform: "COINMARKETCAP",      // Either COINMARKETCAP or COINGECKO
	gasPrice: ethers.utils.parseUnits('8', 'gwei'), // Gas Price
	percentOfTokensToSellProfit: 75, // sell 75% when profit is reached
	percentOfTokensToSellLoss: 100 // sell 100% when stoploss is reached 
}

/* Strategy for buying medium-liquid tokens */
const strategyML =
{
	investmentAmount: '0.2', 	// Investment amount per token in BNB
	maxBuyTax: 10,            // max buy slippage
	maxSellTax: 10,			// max sell slippage   
	maxLiquidity: 250,	        // max Liquidity BNB
	minLiquidity: 100, 	  	// min Liquidity BNB
	profitMultiplier: 1.8,          // 80% profit
	stopLossMultiplier: 0.8,        // 20% loss
	platform: "COINGECKO",          // Either COINMARKETCAP or COINGECKO
	gasPrice: ethers.utils.parseUnits('7', 'gwei'),
	percentOfTokensToSellProfit: 75, // sell 75% when profit is reached
	percentOfTokensToSellLoss: 100 // sell 100% when stoploss is reached 
}

/* Strategy for buying high-liquid tokens */
const strategyHL =
{
	investmentAmount: '0.3', 	// Investment amount per token in BNB
	maxBuyTax: 5,            	// max buy slippage
	maxSellTax: 5,			// max sell slippage
	maxLiquidity: 1000,	   	// max Liquidity BNB
	minLiquidity: 250, 	  	// min Liquidity BNB
	profitMultiplier: 1.5,          // 50% profit
	stopLossMultiplier: 0.9,        // 10% loss
	platform: "COINMARKETCAP",      // Either COINMARKETCAP or COINGECKO
	gasPrice: ethers.utils.parseUnits('6', 'gwei'),
	percentOfTokensToSellProfit: 75, // sell 75% of tokens when profit is reached
	percentOfTokensToSellLoss: 100 // sell 100% of tokens when stoploss is reached 
}
/*-----------End Settings-----------*/

const node = 'https://bsc-dataseed.binance.org/';
const wallet = new ethers.Wallet.fromMnemonic(mnemonic);
const provider = new ethers.providers.JsonRpcProvider(node);
const account = wallet.connect(provider);
const pancakeAbi = [
	'function getAmountsOut(uint amountIn, address[] calldata path) external view returns (uint[] memory amounts)',
	'function swapExactTokensForETHSupportingFeeOnTransferTokens(uint256 amountIn, uint256 amountOutMin, address[] path, address to, uint256 deadline)'
];
const pancakeRouter = new ethers.Contract(addresses.pancakeRouter, pancakeAbi, account);
let tokenAbi = [
	'function approve(address spender, uint amount) public returns(bool)',
	'function balanceOf(address account) external view returns (uint256)',
	'event Transfer(address indexed from, address indexed to, uint amount)',
	'function name() view returns (string)',
	'function buyTokens(address tokenAddress, address to) payable',
	'function decimals() external view returns (uint8)'
];
const channelId = 1517585345;
let token = [];
var sellCount = 0;
var buyCount = 0;
const buyContract = new ethers.Contract(addresses.buyContract, tokenAbi, account);

async function buy() {
	if (buyCount < numberOfTokensToBuy) {
		const value = ethers.utils.parseUnits(token[buyCount].investmentAmount, 'ether').toString();
		const tx = await buyContract.buyTokens(token[buyCount].tokenAddress, addresses.recipient,
			{
				value: value,
				gasPrice: token[buyCount].gasPrice,
				gasLimit: myGasLimit

			});
		const receipt = await tx.wait();
		console.log("Buy Transaction Hash:",receipt.transactionHash);
		const poocoinURL = new URL(token[buyCount].tokenAddress, 'https://poocoin.app/tokens/');
		open(poocoinURL.href);
		token[buyCount].didBuy = true;
		buyCount++;
		approve();
	}

}

async function approve() {
	let contract = token[buyCount - 1].contract;
	const valueToApprove = ethers.constants.MaxUint256;
	const tx = await contract.approve(
		pancakeRouter.address,
		valueToApprove, {
		gasPrice: myGasPriceForApproval,
		gasLimit: 210000
	}
	);
	const receipt = await tx.wait();
	console.log("Approve Transaction Hash:",receipt.transactionHash);
	if (autoSell) {
		token[buyCount - 1].checkProfit();
	} else {
		if (buyCount == numberOfTokensToBuy) {
			process.exit();
		}
	}

}

async function checkForProfit(token) {
	var sellAttempts = 0;
	token.contract.on("Transfer", async (from, to, value, event) => {
		const takeLoss = (parseFloat(token.investmentAmount) * (token.stopLossMultiplier - token.tokenSellTax / 100)).toFixed(18).toString();
		const takeProfit = (parseFloat(token.investmentAmount) * (token.profitMultiplier + token.tokenSellTax / 100)).toFixed(18).toString();
		const tokenName = await token.contract.name();
		let bal = await token.contract.balanceOf(addresses.recipient);
		const amount = await pancakeRouter.getAmountsOut(bal, token.sellPath);
		const profitDesired = ethers.utils.parseUnits(takeProfit);
		const stopLoss = ethers.utils.parseUnits(takeLoss);
		let currentValue;
		if (token.sellPath.length == 3) {
			currentValue = amount[2];
		} else {
			currentValue = amount[1];
		}
		console.log('--- ', tokenName, '--- Current Value in BNB:', ethers.utils.formatUnits(currentValue), '--- Profit At:', ethers.utils.formatUnits(profitDesired), '--- Stop Loss At:', ethers.utils.formatUnits(stopLoss), '\n');

		if (currentValue.gte(profitDesired)) {
			if (buyCount <= numberOfTokensToBuy && !token.didSell && token.didBuy && sellAttempts == 0) {
				sellAttempts++;
				console.log("Selling", tokenName, "now profit target reached", "\n");
				sell(token, true);
				token.contract.removeAllListeners();
			}
		}

		if (currentValue.lte(stopLoss)) {

			if (buyCount <= numberOfTokensToBuy && !token.didSell && token.didBuy && sellAttempts == 0) {
				sellAttempts++;
				console.log("Selling", tokenName, "now stoploss reached", "\n");
				sell(token, false);
				token.contract.removeAllListeners();
			}
		}
	});
}

async function sell(tokenObj, isProfit) {
	try {
		const bal = await tokenObj.contract.balanceOf(addresses.recipient);
		const decimals = await tokenObj.contract.decimals();
		var balanceString;
		if (isProfit) {
			balanceString = (parseFloat(ethers.utils.formatUnits(bal.toString(), decimals)) * (tokenObj.percentOfTokensToSellProfit / 100)).toFixed(decimals).toString();
		} else {
			balanceString = (parseFloat(ethers.utils.formatUnits(bal.toString(), decimals)) * (tokenObj.percentOfTokensToSellLoss / 100)).toFixed(decimals).toString();
		}
		const balanceToSell = ethers.utils.parseUnits(balanceString, decimals);
		const sellAmount = await pancakeRouter.getAmountsOut(balanceToSell, tokenObj.sellPath);
		const sellAmountsOutMin = sellAmount[1].sub(sellAmount[1].div(2));

		const tx = await pancakeRouter.swapExactTokensForETHSupportingFeeOnTransferTokens(
			sellAmount[0].toString(),
			sellAmountsOutMin,
			tokenObj.sellPath,
			addresses.recipient,
			Math.floor(Date.now() / 1000) + 60 * 3, {
			gasPrice: myGasPriceForApproval,
			gasLimit: myGasLimit,

		}
		);
		const receipt = await tx.wait();
		console.log("Sell Transaction Hash:",receipt.transactionHash);
		sellCount++;
		token[tokenObj.index].didSell = true;

		if (sellCount == numberOfTokensToBuy) {
			console.log("All tokens sold");
			process.exit();
		}

	} catch (e) {

	}
}

(async () => {
	const client = new TelegramClient(stringSession, apiId, apiHash, {
		connectionRetries: 5,
	});
	await client.start({
		phoneNumber: async () => await input.text("number?"),
		password: async () => await input.text("password?"),
		phoneCode: async () => await input.text("Code?"),
		onError: (err) => console.log(err),
	});
	console.log("You should now be connected.", '\n');
	console.log(client.session.save(), '\n');
	client.addEventHandler(onNewMessage, new NewMessage({}));
	console.log("Waiting for telegram notification to buy...");

})();

async function onNewMessage(event) {
	const message = event.message;
	if (message.peerId.channelId == channelId) {
		const msg = message.message.replace(/\n/g, " ").split(" ");
		var address = '';
		for (var i = 0; i < msg.length; i++) {
			if (ethers.utils.isAddress(msg[i])) {
				address = msg[i];
			}
			if (msg[i] == "BNB") {
				var liquidity = parseFloat(msg[i - 1]);
				console.log('--- NEW TOKEN FOUND ---');
				console.log('Liquidity:', liquidity, 'BNB');
			}
			if (msg[i] == "(buy)") {
				var slipBuy = parseInt(msg[i - 1]);
				console.log('Buy tax: ', slipBuy, '%');
			}
			if (msg[i] == "(sell)") {
				var slipSell = parseInt(msg[i - 1]);
				console.log('Sell tax:', slipSell, '%');
				console.log('--- --------------- ---');
			}
		}
		if (BUYALLTOKENS == false) {
			// Buy low-liquid tokens
			if (liquidity < strategyLL.maxLiquidity &&
				liquidity > strategyLL.minLiquidity &&
				slipBuy < strategyLL.maxBuyTax &&
				slipSell < strategyLL.maxSellTax && msg.includes("BNB") && msg.includes(strategyLL.platform)) {

				token.push({
					tokenAddress: address,
					didBuy: false,
					hasSold: false,
					tokenSellTax: slipSell,
					tokenLiquidityType: 'BNB',
					tokenLiquidityAmount: liquidity,
					buyPath: [addresses.WBNB, address],
					sellPath: [address, addresses.WBNB],
					contract: new ethers.Contract(address, tokenAbi, account),
					index: buyCount,
					investmentAmount: strategyLL.investmentAmount,
					profitMultiplier: strategyLL.profitMultiplier,
					stopLossMultiplier: strategyLL.stopLossMultiplier,
					gasPrice: strategyLL.gasPrice,
					checkProfit: function () { checkForProfit(this); },
					percentOfTokensToSellProfit: strategyLL.percentOfTokensToSellProfit,
					percentOfTokensToSellLoss: strategyLL.percentOfTokensToSellLoss 
				});
				console.log('<<< Attention! Buying token now! >>> Contract:', address);
				buy();

			}
			// Buy medium-liquid tokens
			else if (liquidity < strategyML.maxLiquidity &&
				liquidity > strategyML.minLiquidity &&
				slipBuy < strategyML.maxBuyTax &&
				slipSell < strategyML.maxSellTax && msg.includes("BNB") && msg.includes(strategyML.platform)) {

				token.push({
					tokenAddress: address,
					didBuy: false,
					hasSold: false,
					tokenSellTax: slipSell,
					tokenLiquidityType: 'BNB',
					tokenLiquidityAmount: liquidity,
					buyPath: [addresses.WBNB, address],
					sellPath: [address, addresses.WBNB],
					contract: new ethers.Contract(address, tokenAbi, account),
					index: buyCount,
					investmentAmount: strategyML.investmentAmount,
					profitMultiplier: strategyML.profitMultiplier,
					stopLossMultiplier: strategyML.stopLossMultiplier,
					gasPrice: strategyML.gasPrice,
					checkProfit: function () { checkForProfit(this); },
					percentOfTokensToSellProfit: strategyML.percentOfTokensToSellProfit,
					percentOfTokensToSellLoss: strategyML.percentOfTokensToSellLoss

				});
				console.log('<<< Attention! Buying token now! >>> Contract:', address);
				buy();

			}
			//Buy high-liquid tokens
			else if (liquidity < strategyHL.maxLiquidity &&
				liquidity > strategyHL.minLiquidity &&
				slipBuy < strategyHL.maxBuyTax &&
				slipSell < strategyHL.maxSellTax && msg.includes("BNB") && msg.includes(strategyHL.platform)) {

				token.push({
					tokenAddress: address,
					didBuy: false,
					hasSold: false,
					tokenSellTax: slipSell,
					tokenLiquidityType: 'BNB',
					tokenLiquidityAmount: liquidity,
					buyPath: [addresses.WBNB, address],
					sellPath: [address, addresses.WBNB],
					contract: new ethers.Contract(address, tokenAbi, account),
					index: buyCount,
					investmentAmount: strategyHL.investmentAmount,
					profitMultiplier: strategyHL.profitMultiplier,
					stopLossMultiplier: strategyHL.stopLossMultiplier,
					gasPrice: strategyHL.gasPrice,
					checkProfit: function () { checkForProfit(this); },
					percentOfTokensToSellProfit: strategyHL.percentOfTokensToSellProfit,
					percentOfTokensToSellLoss: strategyHL.percentOfTokensToSellLoss
				});
				console.log('<<< Attention! Buying token now! >>> Contract:', address);
				buy();
			} else {
				console.log('--- Not buying this token does not match strategy ---');
			}
		} else if (msg.includes('BNB')) {
			// Buy all tokens no strategy
			token.push({
				tokenAddress: address,
				didBuy: false,
				hasSold: false,
				tokenSellTax: slipSell,
				tokenLiquidityType: 'BNB',
				tokenLiquidityAmount: liquidity,
				buyPath: [addresses.WBNB, address],
				sellPath: [address, addresses.WBNB],
				contract: new ethers.Contract(address, tokenAbi, account),
				index: buyCount,
				investmentAmount: buyAllTokensStrategy.investmentAmount,
				profitMultiplier: buyAllTokensStrategy.profitMultiplier,
				stopLossMultiplier: buyAllTokensStrategy.stopLossMultiplier,
				gasPrice: buyAllTokensStrategy.gasPrice,
				checkProfit: function () { checkForProfit(this); },
				percentOfTokensToSellProfit: buyAllTokensStrategy.percentOfTokensToSellProfit,
				percentOfTokensToSellLoss: buyAllTokensStrategy.percentOfTokensToSellLoss
			});
			console.log('<<< Attention! Buying token now! >>> Contract:', address);
			buy();
		} else {
			console.log('--- Not buying this token liquidity is not BNB ---');
		}
	}
}
