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
require('dotenv').config();

const addresses = {
	WBNB: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
	pancakeRouter: '0x10ED43C718714eb63d5aA57B78B54704E256024E',
	BUSD: '0xe9e7cea3dedca5984780bafc599bd69add087d56',
	buyContract: '0xDC56800e179964C3C00a73f73198976397389d26',
	recipient: process.env.recipient
}
const mnemonic = process.env.mnemonic;
const apiId = parseInt(process.env.apiId);
const apiHash = process.env.apiHash;
const stringSession = new StringSession(process.env.stringSession);

/*-----------Default Settings-----------*/

const numberOfTokensToBuy = 10; // number of tokens you want to buy
const autoSell = true;  // If you want to auto sell or not 
const myGasPriceForApproval = ethers.utils.parseUnits('6', 'gwei');
const myGasLimit = 1500000;


var userStrategy = 'BA'; // BA, LL, ML, HL or Custom.  // Chose your strategy


/* Strategy for buying all tokens (BA)*/
const buyAllTokensStrategy = {

	investmentAmount: '0.1', // Amount to invest per token in BNB
	gasPrice: ethers.utils.parseUnits('6', 'gwei'),
	profitPercent: 100,      // 100% profit
	stopLossPercent: 10,  // 10% loss
	percentOfTokensToSellProfit: 75, // sell 75% when profit is reached
	percentOfTokensToSellLoss: 100, // sell 100% when stoploss is reached 
	trailingStopLossPercent: 15 // 15% trailing stoploss
}

/* Strategy for buying low-liquid tokens (LL) */
const strategyLL =
{
	investmentAmount: '0.1', 	// Investment amount per token
	maxBuyTax: 10, 			// max buy tax
	minBuyTax: 0,			// min buy tax
	maxSellTax: 10,			// max sell tax
	maxLiquidity: 150,	        // max Liquidity BNB
	minLiquidity: 1, 	  	// min Liquidity BNB
	profitPercent: 250,          // 2.5X
	stopLossPercent: 30,        // 30% loss
	platform: "COINMARKETCAP",      // Either COINMARKETCAP or COINGECKO
	gasPrice: ethers.utils.parseUnits('6', 'gwei'), // Gas Price. Higher is better for low liquidity
	percentOfTokensToSellProfit: 75, // sell 75% when profit is reached
	percentOfTokensToSellLoss: 100, // sell 100% when stoploss is reached 
	trailingStopLossPercent: 10 // % trailing stoploss
}

/* Strategy for buying medium-liquid tokens (ML) */
const strategyML =
{
	investmentAmount: '0.2', 	// Investment amount per token
	maxBuyTax: 11,           	 // max buy tax
	minBuyTax: 2,			// min buy tax
	maxSellTax: 11,			// max sell tax
	maxLiquidity: 300,	        // max Liquidity BNB
	minLiquidity: 150, 	  	// min Liquidity BNB
	profitPercent: 80,          // 80% profit
	stopLossPercent: 20,        // 20% loss
	platform: "COINMARKETCAP",          // Either COINMARKETCAP or COINGECKO
	gasPrice: ethers.utils.parseUnits('6', 'gwei'),
	percentOfTokensToSellProfit: 75, // sell 75% when profit is reached
	percentOfTokensToSellLoss: 100, // sell 100% when stoploss is reached
	trailingStopLossPercent: 10 // % trailing stoploss
}

/* Strategy for buying high-liquid tokens (HL)*/
const strategyHL =
{
	investmentAmount: '0.2', 	// Investment amount per token
	maxBuyTax: 11,            	// max buy tax
	minBuyTax: 0,			// min buy tax
	maxSellTax: 11,			// max sell tax
	maxLiquidity: 700,	   	// max Liquidity BNB
	minLiquidity: 300, 	  	// min Liquidity BNB
	profitPercent: 50,          // 50% profit
	stopLossPercent: 10,        // 10% loss
	platform: "COINMARKETCAP",      // Either COINMARKETCAP or COINGECKO
	gasPrice: ethers.utils.parseUnits('6', 'gwei'),
	percentOfTokensToSellProfit: 75, // sell 75% of tokens when profit is reached
	percentOfTokensToSellLoss: 100, // sell 100% of tokens when stoploss is reached
	trailingStopLossPercent: 10 // % trailing stoploss
}
/* Custom Strategy  (Custom) */
const customStrategy = {
	investmentAmount: '0.3', 	// Investment amount per token
	maxBuyTax: 11,            	// max buy tax
	minBuyTax: 0,			// min buy tax
	maxSellTax: 11,			// max sell tax
	maxLiquidity: 1000,	   	// max Liquidity BNB
	minLiquidity: 250, 	  	// min Liquidity BNB
	profitPercent: 50,          // 50% profit
	stopLossPercent: 10,        // 10% loss
	platform: "COINMARKETCAP",      // Either COINMARKETCAP or COINGECKO
	gasPrice: ethers.utils.parseUnits('6', 'gwei'),
	percentOfTokensToSellProfit: 75, // sell 75% of tokens when profit is reached
	percentOfTokensToSellLoss: 100, // sell 100% of tokens when stoploss is reached
	trailingStopLossPercent: 10 // % trailing stoploss
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

let token = [];
var sellCount = 0;
var buyCount = 0;
const buyContract = new ethers.Contract(addresses.buyContract, tokenAbi, account);
const CoinMarketCapCoinGeckoChannel = 1517585345;

/**
 * 
 * Buy tokens
 * 
 * */
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
		console.log("Buy transaction hash: ", receipt.transactionHash);
		token[buyCount].didBuy = true;
		const poocoinURL = new URL(token[buyCount].tokenAddress, 'https://poocoin.app/tokens/');
		open(poocoinURL.href);
		buyCount++;
		approve();
	}

}
/**
 * 
 * Approve tokens
 * 
 * */
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
	console.log("Approve transaction hash: ", receipt.transactionHash);
	if (autoSell) {
		token[buyCount - 1].checkProfit();
	} else {
		if (buyCount == numberOfTokensToBuy) {
			process.exit();
		}
	}

}

/**
 * 
 * Check for profit
 * 
 * */
async function getCurrentValue(token) {
	let bal = await token.contract.balanceOf(addresses.recipient);
	const amount = await pancakeRouter.getAmountsOut(bal, token.sellPath);
	let currentValue = amount[1];
	return currentValue;
}
async function setStopLoss(token) {
	token.intitialValue = await getCurrentValue(token);
	token.stopLoss = ethers.utils.parseUnits((parseFloat(ethers.utils.formatUnits(await getCurrentValue(token))) - parseFloat(ethers.utils.formatUnits(await getCurrentValue(token))) * (token.stopLossPercent / 100)).toFixed(18).toString());
}
function setStopLossTrailing(token, stopLossTrailing) {
	token.trailingStopLossPercent += token.initialTrailingStopLossPercent;
	token.stopLoss = stopLossTrailing;
}

async function checkForProfit(token) {
	var sellAttempts = 0;
	await setStopLoss(token);
	token.contract.on("Transfer", async (from, to, value, event) => {
		const tokenName = await token.contract.name();
		let currentValue = await getCurrentValue(token);
		const takeProfit = (parseFloat(ethers.utils.formatUnits(token.intitialValue)) * (token.profitPercent + token.tokenSellTax) / 100 + parseFloat(ethers.utils.formatUnits(token.intitialValue))).toFixed(18).toString();
		const profitDesired = ethers.utils.parseUnits(takeProfit);
		let stopLossTrailing = ethers.utils.parseUnits((parseFloat(ethers.utils.formatUnits(token.intitialValue)) * (token.trailingStopLossPercent / 100 - token.tokenSellTax / 100) + parseFloat(ethers.utils.formatUnits(token.intitialValue))).toFixed(18).toString());
		let stopLoss = token.stopLoss;

		console.log(ethers.utils.formatUnits(stopLossTrailing));
		if (currentValue.gt(stopLossTrailing) && token.trailingStopLossPercent > 0) {
			setStopLossTrailing(token, stopLossTrailing);
			console.log(true, token.trailingStopLossPercent);
		}
		let timeStamp = new Date().toLocaleString();
		const enc = (s) => new TextEncoder().encode(s);
		process.stdout.write(enc(`${timeStamp} --- ${tokenName} --- Current Value in BNB: ${ethers.utils.formatUnits(currentValue)} --- Profit At: ${ethers.utils.formatUnits(profitDesired)} --- Stop Loss At: ${ethers.utils.formatUnits(stopLoss)}  \r`));
		//console.log(`${timeStamp} --- ${tokenName} --- Current Value in BNB: ${ethers.utils.formatUnits(currentValue)} --- Profit At: ${ethers.utils.formatUnits(profitDesired)} --- Stop Loss At: ${ethers.utils.formatUnits(token.stopLoss)} `);
		if (currentValue.gte(profitDesired)) {
			if (buyCount <= numberOfTokensToBuy && !token.didSell && token.didBuy && sellAttempts == 0) {
				sellAttempts++;
				console.log("Selling", tokenName, "now profit target reached", "\n");
				sell(token, true);
				token.contract.removeAllListeners();
			}
		}

		if (currentValue.lte(stopLoss)) {
			console.log("less than");
			if (buyCount <= numberOfTokensToBuy && !token.didSell && token.didBuy && sellAttempts == 0) {
				sellAttempts++;
				console.log("Selling", tokenName, "now stoploss reached", "\n");
				sell(token, false);
				token.contract.removeAllListeners();
			}
		}
	});
}

/**
 * 
 * Sell tokens
 * 
 * */
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
			0,
			tokenObj.sellPath,
			addresses.recipient,
			Math.floor(Date.now() / 1000) + 60 * 3, {
			gasPrice: myGasPriceForApproval,
			gasLimit: myGasLimit,

		}
		);
		const receipt = await tx.wait();
		console.log("Sell transaction hash: ", receipt.transactionHash);
		sellCount++;
		token[tokenObj.index].didSell = true;

		if (sellCount == numberOfTokensToBuy) {
			console.log("All tokens sold");
			process.exit();
		}

	} catch (e) {
	}
}

/**
 * 
 * Configure Strategies User Input
 * 
 * */
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
	console.log("You should now be connected to Telegram");
	console.log("String session:", client.session.save(), '\n');

	const choices = ['Default','Buy All Tokens', 'Buy Only Low Liquidity Tokens 1-150 BNB', 'Buy Only Medium Liquidity Tokens 150-300 BNB', 'Buy Only High Liquidity Tokens 300-700 BNB', 'Custom Strategy']
	const choices2 = ['COINMARKETCAP', 'COINGECKO'];
	await input.select('Welcome, please choose a buying strategy', choices).then(async function (answers) {
		if (answers == 'Buy All Tokens') {
			buyAllTokensStrategy.investmentAmount = await input.text("Enter Investment Amount in BNB");
			buyAllTokensStrategy.gasPrice = ethers.utils.parseUnits(await input.text("Enter Gas Price"), 'gwei');
			buyAllTokensStrategy.profitPercent = parseFloat(await input.text("Enter profit percent you want"));
			buyAllTokensStrategy.stopLossPercent = parseFloat(await input.text("Enter max loss percent"));
			buyAllTokensStrategy.trailingStopLossPercent = parseFloat(await input.text("Enter trailing stop loss percent"));
			buyAllTokensStrategy.percentOfTokensToSellProfit = parseFloat(await input.text("Enter percent of tokens to sell when profit reached"));
			buyAllTokensStrategy.percentOfTokensToSellLoss = parseFloat(await input.text("Enter percent of tokens to sell when stop loss reached"));
			BUYALLTOKENS = true;
			userStrategy = 'BA';
		}
		if (answers == "Buy Only Low Liquidity Tokens 1-150 BNB") {
			strategyLL.investmentAmount = await input.text("Enter Investment Amount in BNB");
			strategyLL.gasPrice = ethers.utils.parseUnits(await input.text("Enter Gas Price"), 'gwei');
			strategyLL.maxBuyTax = parseFloat(await input.text("Enter max buying tax"));
			strategyLL.minBuyTax = parseFloat(await input.text("Enter min buying tax"));
			strategyLL.maxSellTax = parseFloat(await input.text("Enter max sell tax"));
			strategyLL.profitPercent = parseFloat(await input.text("Enter profit percent you want"));
			strategyLL.stopLossPercent = parseFloat(await input.text("Enter max loss percent"));
			strategyLL.trailingStopLossPercent = parseFloat(await input.text("Enter trailing stop loss percent"));
			strategyLL.percentOfTokensToSellProfit = parseFloat(await input.text("Enter percent of tokens to sell when profit reached"));
			strategyLL.percentOfTokensToSellLoss = parseFloat(await input.text("Enter percent of tokens to sell when stop loss reached"));
			await input.select('Choose coinmarketcap or coingecko', choices2).then(async function (answers2) {
				if (answers2 == "COINMARKETCAP") {
					strategyLL.platform = "COINMARKETCAP";
				}
				else {
					strategyLL.platform = "COINGECKO";
				}
			});
		
			userStrategy = 'LL';

		}
		if (answers == "Buy Only Medium Liquidity Tokens 150-300 BNB") {
			strategyML.investmentAmount = await input.text("Enter Investment Amount in BNB");
			strategyML.gasPrice = ethers.utils.parseUnits(await input.text("Enter Gas Price"), 'gwei');
			strategyML.maxBuyTax = parseFloat(await input.text("Enter max buying tax"));
			strategyML.minBuyTax = parseFloat(await input.text("Enter min buying tax"));
			strategyML.maxSellTax = parseFloat(await input.text("Enter max sell tax"));
			strategyML.profitPercent = parseFloat(await input.text("Enter profit percent you want"));
			strategyML.stopLossPercent = parseFloat(await input.text("Enter max loss percent"));
			strategyML.trailingStopLossPercent = parseFloat(await input.text("Enter trailing stop loss percent"));
			strategyML.percentOfTokensToSellProfit = parseFloat(await input.text("Enter percent of tokens to sell when profit reached"));
			strategyML.percentOfTokensToSellLoss = parseFloat(await input.text("Enter percent of tokens to sell when stop loss reached"));
			await input.select('Choose coinmarketcap or coingecko', choices2).then(async function (answers2) {
				if (answers2 == "COINMARKETCAP") {
					strategyML.platform = "COINMARKETCAP";
				}
				else {
					strategyML.platform = "COINGECKO";
				}
			});

			userStrategy = 'ML';

		}
		if (answers == "Buy Only High Liquidity Tokens 300-700 BNB") {
			strategyHL.investmentAmount = await input.text("Enter Investment Amount in BNB");
			strategyHL.gasPrice = ethers.utils.parseUnits(await input.text("Enter Gas Price"), 'gwei');
			strategyHL.maxBuyTax = parseFloat(await input.text("Enter max buying tax"));
			strategyHL.minBuyTax = parseFloat(await input.text("Enter min buying tax"));
			strategyHL.maxSellTax = parseFloat(await input.text("Enter max sell tax"));
			strategyHL.profitPercent = parseFloat(await input.text("Enter profit percent you want"));
			strategyHL.stopLossPercent = parseFloat(await input.text("Enter max loss percent"));
			strategyHL.trailingStopLossPercent = parseFloat(await input.text("Enter trailing stop loss percent"));
			strategyHL.percentOfTokensToSellProfit = parseFloat(await input.text("Enter percent of tokens to sell when profit reached"));
			strategyHL.percentOfTokensToSellLoss = parseFloat(await input.text("Enter percent of tokens to sell when stop loss reached"));
			await input.select('Choose coinmarketcap or coingecko', choices2).then(async function (answers2) {
				if (answers2 == "COINMARKETCAP") {
					strategyHL.platform = "COINMARKETCAP";
				}
				else {
					strategyHL.platform = "COINGECKO";
				}

			});
		
			userStrategy = 'HL';
		}
		if (answers == "Custom Strategy") {
			customStrategy.investmentAmount = await input.text("Enter Investment Amount in BNB");
			customStrategy.gasPrice = ethers.utils.parseUnits(await input.text("Enter Gas Price"), 'gwei');
			customStrategy.minLiquidity = parseFloat(await input.text("Enter minimum liquidity"));
			customStrategy.maxLiquidity = parseFloat(await input.text("Enter maximum liquidity"));
			customStrategy.maxBuyTax = parseFloat(await input.text("Enter max buying tax"));
			customStrategy.minBuyTax = parseFloat(await input.text("Enter min buying tax"));
			customStrategy.maxSellTax = parseFloat(await input.text("Enter max sell tax"));
			customStrategy.profitPercent = parseFloat(await input.text("Enter profit percent you want"));
			customStrategy.stopLossPercent = parseFloat(await input.text("Enter max loss percent"));
			customStrategy.trailingStopLossPercent = parseFloat(await input.text("Enter trailing stop loss percent"));
			customStrategy.percentOfTokensToSellProfit = parseFloat(await input.text("Enter percent of tokens to sell when profit reached"));
			customStrategy.percentOfTokensToSellLoss = parseFloat(await input.text("Enter percent of tokens to sell when stop loss reached"));
			await input.select('Choose coinmarketcap or coingecko', choices2).then(async function (answers2) {
				if (answers2 == "COINMARKETCAP") {
					customStrategy.platform = "COINMARKETCAP";
				}
				else {
					customStrategy.platform = "COINGECKO";
				}
			});
			userStrategy = 'Custom';
		}

	});

	client.addEventHandler(onNewMessage, new NewMessage({}));
	console.log('\n', "Waiting for telegram notification to buy...");

})();

/**
 * 
 * Check Strategies
 * 
 * */
function didNotBuy(address) {
	for (var i = 0; i < token.length; i++) {
		if (address == token[i].tokenAddress) {
			return false;
		} else {
			return true;
		}
	}
	return true;
}

function isStrategy(liquidity, buyTax, sellTax, msg, address) {
	if (userStrategy == 'BA') {
		if (msg.includes('BNB') && didNotBuy(address)) {
			return true;
		}

	} else if (userStrategy == 'LL') {
		if (liquidity <= strategyLL.maxLiquidity &&
			liquidity >= strategyLL.minLiquidity &&
			buyTax <= strategyLL.maxBuyTax &&
			buyTax >= strategyLL.minBuyTax &&
			sellTax <= strategyLL.maxSellTax &&
			msg.includes("BNB") && msg.includes(strategyLL.platform) && didNotBuy(address)) {
			return true;
		}

	} else if (userStrategy == 'ML') {
		if (liquidity <= strategyML.maxLiquidity &&
			liquidity >= strategyML.minLiquidity &&
			buyTax <= strategyML.maxBuyTax &&
			buyTax >= strategyML.minBuyTax &&
			sellTax <= strategyML.maxSellTax &&
			msg.includes("BNB") && msg.includes(strategyML.platform) && didNotBuy(address)) {
			return true;
		}

	} else if (userStrategy == 'HL') {
		if (liquidity <= strategyHL.maxLiquidity &&
			liquidity >= strategyHL.minLiquidity &&
			buyTax <= strategyHL.maxBuyTax &&
			buyTax >= strategyHL.minBuyTax &&
			sellTax <= strategyHL.maxSellTax && msg.includes("BNB") && msg.includes(strategyHL.platform) && didNotBuy(address)) {
			return true;
		}

	} else if (userStrategy == 'Custom') {
		if (liquidity <= customStrategy.maxLiquidity &&
			liquidity >= customStrategy.minLiquidity &&
			buyTax <= customStrategy.maxBuyTax &&
			buyTax >= customStrategy.minBuyTax &&
			sellTax <= customStrategy.maxSellTax && msg.includes("BNB") && msg.includes(customStrategy.platform) && didNotBuy(address)) {
			return true;
		}

	}
	return false;
}

/**
 * 
 * Recieved new Telegram message
 * 
 * */
async function onNewMessage(event) {
	const message = event.message;
	if (message.peerId.channelId == CoinMarketCapCoinGeckoChannel) {
		console.log('--- NEW TOKEN FOUND ---');
		let timeStamp = new Date().toLocaleString();
		console.log(timeStamp);
		const msg = message.message.replace(/\n/g, " ").split(" ");
		var address = '';
		if (msg.includes("COINMARKETCAP")) {
			console.log('Platform: COINMARKETCAP');
		}
		if (msg.includes("COINGECKO")) {
			console.log('Platform: COINGECKO');
		}
		for (var i = 0; i < msg.length; i++) {
			if (ethers.utils.isAddress(msg[i])) {
				address = msg[i];
				console.log('Contract:', address);
				console.log('--- --------------- ---');
			}
			if (msg[i] == "BNB") {
				var liquidity = parseFloat(msg[i - 1]);
				console.log('Liquidity:', liquidity, 'BNB');
			}
			if (msg[i] == "(buy)") {
				var slipBuy = parseInt(msg[i - 1]);
				console.log('Buy tax: ', slipBuy, '%');
			}
			if (msg[i] == "(sell)") {
				var slipSell = parseInt(msg[i - 1]);
				console.log('Sell tax:', slipSell, '%');
			}
		}
		// Buy low-liquid tokens
		if (isStrategy(liquidity, slipBuy, slipSell, msg, address)) {
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
				profitPercent: strategyLL.profitPercent,
				stopLossPercent: strategyLL.stopLossPercent,
				gasPrice: strategyLL.gasPrice,
				checkProfit: function () { checkForProfit(this); },
				percentOfTokensToSellProfit: strategyLL.percentOfTokensToSellProfit,
				percentOfTokensToSellLoss: strategyLL.percentOfTokensToSellLoss,
				initialTrailingStopLossPercent: strategyLL.trailingStopLossPercent,
				trailingStopLossPercent: strategyLL.trailingStopLossPercent,
				stopLoss: 0,
				intitialValue: 0
			});
			console.log('<<< Attention! Buying token now! >>> Contract:', address);
			buy();
		}
		// Buy medium-liquid tokens
		else if (isStrategy(liquidity, slipBuy, slipSell, msg, address)) {
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
				profitPercent: strategyML.profitPercent,
				stopLossPercent: strategyML.stopLossPercent,
				gasPrice: strategyML.gasPrice,
				checkProfit: function () { checkForProfit(this); },
				percentOfTokensToSellProfit: strategyML.percentOfTokensToSellProfit,
				percentOfTokensToSellLoss: strategyML.percentOfTokensToSellLoss,
				initialTrailingStopLossPercent: strategyML.trailingStopLossPercent,
				trailingStopLossPercent: strategyML.trailingStopLossPercent,
				stopLoss: 0,
				intitialValue: 0

			});
			console.log('<<< Attention! Buying token now! >>> Contract:', address);
			buy();
		}
		//Buy high-liquid tokens
		else if (isStrategy(liquidity, slipBuy, slipSell, msg, address)) {
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
				profitPercent: strategyHL.profitPercent,
				stopLossPercent: strategyHL.stopLossPercent,
				gasPrice: strategyHL.gasPrice,
				checkProfit: function () { checkForProfit(this); },
				percentOfTokensToSellProfit: strategyHL.percentOfTokensToSellProfit,
				percentOfTokensToSellLoss: strategyHL.percentOfTokensToSellLoss,
				initialTrailingStopLossPercent: strategyHL.trailingStopLossPercent,
				trailingStopLossPercent: strategyHL.trailingStopLossPercent,
				stopLoss: 0,
				intitialValue: 0
			});
			console.log('<<< Attention! Buying token now! >>> Contract:', address);
			buy();

		}
		// Custom Strategy
		else if (isStrategy(liquidity, slipBuy, slipSell, msg, address)) {
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
				investmentAmount: customStrategy.investmentAmount,
				profitPercent: customStrategy.profitPercent,
				stopLossPercent: customStrategy.stopLossPercent,
				gasPrice: customStrategy.gasPrice,
				checkProfit: function () { checkForProfit(this); },
				percentOfTokensToSellProfit: customStrategy.percentOfTokensToSellProfit,
				percentOfTokensToSellLoss: customStrategy.percentOfTokensToSellLoss,
				initialTrailingStopLossPercent: customStrategy.trailingStopLossPercent,
				trailingStopLossPercent: customStrategy.trailingStopLossPercent,
				stopLoss: 0,
				intitialValue: 0
			});
			console.log('<<< Attention! Buying token now! >>> Contract:', address);
			buy();
		}
		// Buy all tokens no strategy
		else if (isStrategy(liquidity, slipBuy, slipSell, msg, address)) {
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
				profitPercent: buyAllTokensStrategy.profitPercent,
				stopLossPercent: buyAllTokensStrategy.stopLossPercent,
				gasPrice: buyAllTokensStrategy.gasPrice,
				checkProfit: function () { checkForProfit(this); },
				percentOfTokensToSellProfit: buyAllTokensStrategy.percentOfTokensToSellProfit,
				percentOfTokensToSellLoss: buyAllTokensStrategy.percentOfTokensToSellLoss,
				initialTrailingStopLossPercent: buyAllTokensStrategy.trailingStopLossPercent,
				trailingStopLossPercent: buyAllTokensStrategy.trailingStopLossPercent,
				stopLoss: 0,
				intitialValue: 0
			});
			console.log('<<< Attention! Buying token now! >>> Contract:', address);
			buy();
		} else {
			console.log('Not buying this token does not match strategy or liquidity is not BNB. Waiting for telegram notification to buy...', '\n');
		}
	}
}


