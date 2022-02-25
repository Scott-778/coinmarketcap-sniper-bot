/*
coinmarketcap-new-listings-sniper-bot
Coinmarketcap new listings sniper bot that uses 
telegram notifications from this telegram channel
https://t.me/joinchat/b17jE6EbQX5kNWY8 use this link and subscribe.
Turn on two step verification in telegram.
Go to my.telegram.org and create App to get api_id and api_hash.
*/
const { Api, TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");
const input = require("input");
const { NewMessage } = require('telegram/events');
const ethers = require('ethers');
const open = require('open');
require('dotenv').config();
const fs = require('fs');
const config = require('./config');

/*-----------Default Settings-----------*/

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
const node = process.env.node;
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
var dontBuyTheseTokens;

/**
 * 
 * Buy tokens
 * 
 * */
async function buy() {
	if (buyCount < config.numberOfTokensToBuy) {
		const value = ethers.utils.parseUnits(token[buyCount].investmentAmount, 'ether').toString();
		const tx = await buyContract.buyTokens(token[buyCount].tokenAddress, addresses.recipient,
			{
				value: value,
				gasPrice: token[buyCount].gasPrice,
				gasLimit: config.myGasLimit

			});
		const receipt = await tx.wait();
		console.log("Buy transaction hash: ", receipt.transactionHash);
		token[buyCount].didBuy = true;
		const poocoinURL = new URL(token[buyCount].tokenAddress, 'https://poocoin.app/tokens/');
		open(poocoinURL.href);
		buyCount++;
		fs.readFile('tokensBought.json', 'utf8', function readFileCallback(err, data) {
			if (err) {

			} else {
				var obj = JSON.parse(data);
				obj.tokens.push({ address: token[buyCount - 1].tokenAddress });
				json = JSON.stringify(obj, null, 4);
				fs.writeFile('tokensBought.json', json, 'utf8', function (err) {
					if (err) throw err;
				});
			}
		});
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
		gasPrice: config.myGasPriceForApproval,
		gasLimit: 210000
	}
	);
	const receipt = await tx.wait();
	console.log("Approve transaction hash: ", receipt.transactionHash);
	if (config.autoSell) {
		token[buyCount - 1].checkProfit();
	} else {
		if (buyCount == config.numberOfTokensToBuy) {
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
	token.stopLoss = ethers.utils.parseUnits((parseFloat(ethers.utils.formatUnits(token.intitialValue)) * (token.trailingStopLossPercent / 100 - token.tokenSellTax / 100) + parseFloat(ethers.utils.formatUnits(token.intitialValue))).toFixed(18).toString());;
}

async function checkForProfit(token) {
	var sellAttempts = 0;
	await setStopLoss(token);
	token.contract.on("Transfer", async (from, to, value, event) => {
		const tokenName = await token.contract.name();
		let currentValue = await getCurrentValue(token);
		const takeProfit = (parseFloat(ethers.utils.formatUnits(token.intitialValue)) * (token.profitPercent + token.tokenSellTax) / 100 + parseFloat(ethers.utils.formatUnits(token.intitialValue))).toFixed(18).toString();
		const profitDesired = ethers.utils.parseUnits(takeProfit);
		let stopLossTrailing = ethers.utils.parseUnits((parseFloat(ethers.utils.formatUnits(token.intitialValue)) * (token.trailingStopLossPercent / 100 + token.tokenSellTax / 100) + parseFloat(ethers.utils.formatUnits(token.intitialValue))).toFixed(18).toString());
		let stopLoss = token.stopLoss;
		if (currentValue.gt(stopLossTrailing) && token.trailingStopLossPercent > 0) {
			setStopLossTrailing(token, stopLossTrailing);

		}
		let timeStamp = new Date().toLocaleString();
		const enc = (s) => new TextEncoder().encode(s);
		//process.stdout.write(enc(`${timeStamp} --- ${tokenName} --- Current Value in BNB: ${ethers.utils.formatUnits(currentValue)} --- Profit At: ${ethers.utils.formatUnits(profitDesired)} --- Stop Loss At: ${ethers.utils.formatUnits(stopLoss)} \r`));
		console.log(`${timeStamp} --- ${tokenName} --- Current Value in BNB: ${ethers.utils.formatUnits(currentValue)} --- Profit At: ${ethers.utils.formatUnits(profitDesired)} --- Stop Loss At: ${ethers.utils.formatUnits(token.stopLoss)}`);
		if (currentValue.gte(profitDesired)) {
			if (buyCount <= config.numberOfTokensToBuy && !token.didSell && token.didBuy && sellAttempts == 0) {
				sellAttempts++;
				console.log("Selling", tokenName, "now profit target reached", "\n");
				sell(token, true);
				token.contract.removeAllListeners();
			}
		}

		if (currentValue.lte(stopLoss)) {
			if (buyCount <= config.numberOfTokensToBuy && !token.didSell && token.didBuy && sellAttempts == 0) {
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
			gasPrice: config.myGasPriceForApproval,
			gasLimit: config.myGasLimit,

		}
		);
		const receipt = await tx.wait();
		console.log("Sell transaction hash: ", receipt.transactionHash);
		sellCount++;
		token[tokenObj.index].didSell = true;

		if (sellCount == config.numberOfTokensToBuy) {
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

	const choices = ['Default', 'Buy All Tokens', 'Buy Only Low Liquidity Tokens 1-150 BNB', 'Buy Only Medium Liquidity Tokens 150-300 BNB', 'Buy Only High Liquidity Tokens 300-700 BNB', 'Custom Strategy']
	const choices2 = ['COINMARKETCAP', 'COINGECKO'];
	await input.select('Welcome, please choose a buying strategy', choices).then(async function (answers) {
		if (answers == 'Buy All Tokens') {
			config.buyAllTokensStrategy.investmentAmount = await input.text("Enter Investment Amount in BNB");
			config.buyAllTokensStrategy.gasPrice = ethers.utils.parseUnits(await input.text("Enter Gas Price"), 'gwei');
			config.buyAllTokensStrategy.profitPercent = parseFloat(await input.text("Enter profit percent you want"));
			config.buyAllTokensStrategy.stopLossPercent = parseFloat(await input.text("Enter max loss percent"));
			config.buyAllTokensStrategy.trailingStopLossPercent = parseFloat(await input.text("Enter trailing stop loss percent"));
			config.buyAllTokensStrategy.percentOfTokensToSellProfit = parseFloat(await input.text("Enter percent of tokens to sell when profit reached"));
			config.buyAllTokensStrategy.percentOfTokensToSellLoss = parseFloat(await input.text("Enter percent of tokens to sell when stop loss reached"));

			config.userStrategy = 'BA';
		}
		if (answers == "Buy Only Low Liquidity Tokens 1-150 BNB") {
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
			await input.select('Choose coinmarketcap or coingecko', choices2).then(async function (answers2) {
				if (answers2 == "COINMARKETCAP") {
					config.strategyLL.platform = "COINMARKETCAP";
				}
				else {
					config.strategyLL.platform = "COINGECKO";
				}
			});

			config.userStrategy = 'LL';
			console.log(config.strategyLL);

		}
		if (answers == "Buy Only Medium Liquidity Tokens 150-300 BNB") {
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
			await input.select('Choose coinmarketcap or coingecko', choices2).then(async function (answers2) {
				if (answers2 == "COINMARKETCAP") {
					config.strategyML.platform = "COINMARKETCAP";
				}
				else {
					config.strategyML.platform = "COINGECKO";
				}
			});

			config.userStrategy = 'ML';

		}
		if (answers == "Buy Only High Liquidity Tokens 300-700 BNB") {
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
			await input.select('Choose coinmarketcap or coingecko', choices2).then(async function (answers2) {
				if (answers2 == "COINMARKETCAP") {
					config.strategyHL.platform = "COINMARKETCAP";
				}
				else {
					config.strategyHL.platform = "COINGECKO";
				}

			});

			config.userStrategy = 'HL';
		}
		if (answers == "Custom Strategy") {
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
			await input.select('Choose coinmarketcap or coingecko', choices2).then(async function (answers2) {
				if (answers2 == "COINMARKETCAP") {
					config.customStrategy.platform = "COINMARKETCAP";
				}
				else {
					config.customStrategy.platform = "COINGECKO";
				}
			});
			config.userStrategy = 'Custom';
		}

	});
	let raw = await readFile('tokensBought.json');
	let tokensBought = JSON.parse(raw);
	dontBuyTheseTokens = tokensBought.tokens;
	client.addEventHandler(onNewMessage, new NewMessage({}));
	console.log('\n', "Waiting for telegram notification to buy...");

})();
async function readFile(path) {
	return new Promise((resolve, reject) => {
		fs.readFile(path, 'utf8', function (err, data) {
			if (err) {
				reject(err);
			}
			resolve(data);
		});
	});
}
/**
 * 
 * Check Strategies
 * 
 * */
function didNotBuy(address) {
	for (var j = 0; j < dontBuyTheseTokens.length; j++) {
		if (address == dontBuyTheseTokens[j].address) {
			return false;
		} else {
			return true;
		}
	}
	return true;
}

function isStrategy(liquidity, buyTax, sellTax, msg, address) {
	if (config.userStrategy == 'BA') {
		if (msg.includes('BNB') && didNotBuy(address)) {
			return true;
		}

	} else if (config.userStrategy == 'LL') {
		if (liquidity <= config.strategyLL.maxLiquidity &&
			liquidity >= config.strategyLL.minLiquidity &&
			buyTax <= config.strategyLL.maxBuyTax &&
			buyTax >= config.strategyLL.minBuyTax &&
			sellTax <= config.strategyLL.maxSellTax &&
			msg.includes("BNB") && msg.includes(config.strategyLL.platform) && didNotBuy(address)) {
			return true;
		}

	} else if (config.userStrategy == 'ML') {
		if (liquidity <= config.strategyML.maxLiquidity &&
			liquidity >= config.strategyML.minLiquidity &&
			buyTax <= config.strategyML.maxBuyTax &&
			buyTax >= config.strategyML.minBuyTax &&
			sellTax <= config.strategyML.maxSellTax &&
			msg.includes("BNB") && msg.includes(config.strategyML.platform) && didNotBuy(address)) {
			return true;
		}

	} else if (config.userStrategy == 'HL') {
		if (liquidity <= config.strategyHL.maxLiquidity &&
			liquidity >= config.strategyHL.minLiquidity &&
			buyTax <= config.strategyHL.maxBuyTax &&
			buyTax >= config.strategyHL.minBuyTax &&
			sellTax <= config.strategyHL.maxSellTax && msg.includes("BNB") && msg.includes(config.strategyHL.platform) && didNotBuy(address)) {
			return true;
		}

	} else if (config.userStrategy == 'Custom') {
		if (liquidity <= config.customStrategy.maxLiquidity &&
			liquidity >= config.customStrategy.minLiquidity &&
			buyTax <= config.customStrategy.maxBuyTax &&
			buyTax >= config.customStrategy.minBuyTax &&
			sellTax <= config.customStrategy.maxSellTax && msg.includes("BNB") && msg.includes(config.customStrategy.platform) && didNotBuy(address)) {
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
				investmentAmount: config.strategyLL.investmentAmount,
				profitPercent: config.strategyLL.profitPercent,
				stopLossPercent: config.strategyLL.stopLossPercent,
				gasPrice: config.strategyLL.gasPrice,
				checkProfit: function () { checkForProfit(this); },
				percentOfTokensToSellProfit: config.strategyLL.percentOfTokensToSellProfit,
				percentOfTokensToSellLoss: config.strategyLL.percentOfTokensToSellLoss,
				initialTrailingStopLossPercent: config.strategyLL.trailingStopLossPercent,
				trailingStopLossPercent: config.strategyLL.trailingStopLossPercent,
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
				investmentAmount: config.strategyML.investmentAmount,
				profitPercent: config.strategyML.profitPercent,
				stopLossPercent: config.strategyML.stopLossPercent,
				gasPrice: config.strategyML.gasPrice,
				checkProfit: function () { checkForProfit(this); },
				percentOfTokensToSellProfit: config.strategyML.percentOfTokensToSellProfit,
				percentOfTokensToSellLoss: config.strategyML.percentOfTokensToSellLoss,
				initialTrailingStopLossPercent: config.strategyML.trailingStopLossPercent,
				trailingStopLossPercent: config.strategyML.trailingStopLossPercent,
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
				investmentAmount: config.strategyHL.investmentAmount,
				profitPercent: config.strategyHL.profitPercent,
				stopLossPercent: config.strategyHL.stopLossPercent,
				gasPrice: config.strategyHL.gasPrice,
				checkProfit: function () { checkForProfit(this); },
				percentOfTokensToSellProfit: config.strategyHL.percentOfTokensToSellProfit,
				percentOfTokensToSellLoss: config.strategyHL.percentOfTokensToSellLoss,
				initialTrailingStopLossPercent: config.strategyHL.trailingStopLossPercent,
				trailingStopLossPercent: config.strategyHL.trailingStopLossPercent,
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
				investmentAmount: config.customStrategy.investmentAmount,
				profitPercent: config.customStrategy.profitPercent,
				stopLossPercent: config.customStrategy.stopLossPercent,
				gasPrice: config.customStrategy.gasPrice,
				checkProfit: function () { checkForProfit(this); },
				percentOfTokensToSellProfit: config.customStrategy.percentOfTokensToSellProfit,
				percentOfTokensToSellLoss: config.customStrategy.percentOfTokensToSellLoss,
				initialTrailingStopLossPercent: config.customStrategy.trailingStopLossPercent,
				trailingStopLossPercent: config.customStrategy.trailingStopLossPercent,
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
				investmentAmount: config.buyAllTokensStrategy.investmentAmount,
				profitPercent: config.buyAllTokensStrategy.profitPercent,
				stopLossPercent: config.buyAllTokensStrategy.stopLossPercent,
				gasPrice: config.buyAllTokensStrategy.gasPrice,
				checkProfit: function () { checkForProfit(this); },
				percentOfTokensToSellProfit: config.buyAllTokensStrategy.percentOfTokensToSellProfit,
				percentOfTokensToSellLoss: config.buyAllTokensStrategy.percentOfTokensToSellLoss,
				initialTrailingStopLossPercent: config.buyAllTokensStrategy.trailingStopLossPercent,
				trailingStopLossPercent: config.buyAllTokensStrategy.trailingStopLossPercent,
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
