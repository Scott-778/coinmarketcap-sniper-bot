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
const helper = require('./helper');
var client;
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
	'function swapExactTokensForETHSupportingFeeOnTransferTokens(uint256 amountIn, uint256 amountOutMin, address[] path, address to, uint256 deadline)',
	'function swapExactTokensForETH(uint256 amountIn, uint256 amountOutMin, address[] path, address to, uint256 deadline)'
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
const CoinmarketcapFastestAlertsChannel = 1519789792;
var dontBuyTheseTokens;
const version = 'v1.3';

/**
 * 
 * Buy tokens
 * 
 * */
async function buy() {
	try {
		if (buyCount < config.numberOfTokensToBuy) {
			const value = ethers.utils.parseUnits(token[buyCount].investmentAmount, 'ether').toString();
			const tx = await buyContract.buyTokens(token[buyCount].tokenAddress, addresses.recipient,
				{
					value: value,
					gasPrice: token[buyCount].gasPrice,
					gasLimit: config.myGasLimit

				});
			const receipt = await tx.wait();
			console.log("\u001b[1;32m" + "✔ Buy transaction hash: ", receipt.transactionHash, "\u001b[0m");
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
			await client.sendMessage('me', {message:`You bought a new token pooCoin Link: ${poocoinURL.href}`, schedule:(15 * 1) + (Date.now() / 1000)});
			approve();
		}
	} catch (e) {
		console.log("\u001b[1;31m" + "❌ Buy transaction error, check on BscScan.com" + "\u001b[0m");
		console.log("\u001b[1;31m" + "Attention! Make sure that all active transactions and trading sessions are completed and restart the bot." + "\u001b[0m", "\n");
	}

}
/**
 * 
 * Approve tokens
 * 
 * */
async function approve() {
	try {
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
		console.log("✔ Approve transaction hash: ", receipt.transactionHash, "\n");
		if (config.autoSell) {
			token[buyCount - 1].checkProfit();
		} else {
			if (buyCount == config.numberOfTokensToBuy) {
				process.exit();
			}
		}
	} catch (e) {
		console.log("\u001b[1;31m" + "❌ Approve transaction error, check on BscScan.com" + "\u001b[0m");
		console.log("\u001b[1;31m" + "Attention! Make sure that all active transactions and trading sessions are completed and restart the bot." + "\u001b[0m", "\n");
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
async function setInitialStopLoss(token) {
	token.intitialValue = await getCurrentValue(token);
	token.newValue = token.intitialValue;
	token.stopLoss = ethers.utils.parseUnits((parseFloat(ethers.utils.formatUnits(token.intitialValue)) - parseFloat(ethers.utils.formatUnits(token.intitialValue)) * (token.stopLossPercent / 100)).toFixed(8).toString());
}

async function setNewStopLoss(token) {
	token.tslValue = await getCurrentValue(token);
	token.newValue = token.currentValue;
	// new stop loss equals current value - (current value * stop loss percent) 
	token.stopLoss = ethers.utils.parseUnits((parseFloat(ethers.utils.formatUnits(token.tslValue)) - parseFloat(ethers.utils.formatUnits(token.tslValue)) * (token.stopLossPercent / 100)).toFixed(8).toString());
}
async function checkForProfit(token) {
	try {
		var sellAttempts = 0;
		await setInitialStopLoss(token);
		token.contract.on("Transfer", async (from, to, value, event) => {
			const tokenName = await token.contract.name();
			let currentValue = await getCurrentValue(token);
			token.currentValue = currentValue;
			const takeProfit = (parseFloat(ethers.utils.formatUnits(token.intitialValue)) * (token.profitPercent + token.tokenSellTax) / 100 + parseFloat(ethers.utils.formatUnits(token.intitialValue))).toFixed(8).toString();
			const profitDesired = ethers.utils.parseUnits(takeProfit);
			let targetValueToSetNewStopLoss = ethers.utils.parseUnits((parseFloat(ethers.utils.formatUnits(token.newValue)) * (token.trailingStopLossPercent / 100) + parseFloat(ethers.utils.formatUnits(token.newValue))).toFixed(8).toString());
			console.log("\u001b[38;5;81m" + "Target value for trailing StopLoss:", ethers.utils.formatUnits(targetValueToSetNewStopLoss), "\u001b[0m");
			let stopLoss = token.stopLoss;

			// if current value is greater than targetValue, set a new stop loss
			if (currentValue.gt(targetValueToSetNewStopLoss) && token.trailingStopLossPercent > 0) {
				setNewStopLoss(token);
				console.log("\u001b[38;5;33m" + "Setting new StopLoss!" + "\u001b[0m");
			}
			let timeStamp = new Date().toLocaleString();
			const enc = (s) => new TextEncoder().encode(s);
			//process.stdout.write(enc(`${timeStamp} --- ${tokenName} --- Current Value in BNB: ${ethers.utils.formatUnits(currentValue)} --- Profit At: ${ethers.utils.formatUnits(profitDesired)} --- Stop Loss At: ${ethers.utils.formatUnits(stopLoss)} \r`));
			console.log(`${version} ${timeStamp} --- ${tokenName} --- Current Value in BNB: ${ethers.utils.formatUnits(currentValue)} --- Profit At: ${ethers.utils.formatUnits(profitDesired)} --- Stop Loss At: ${ethers.utils.formatUnits(token.stopLoss)}`);
			if (currentValue.gte(profitDesired)) {
				if (buyCount <= config.numberOfTokensToBuy && !token.didSell && token.didBuy && sellAttempts == 0) {
					sellAttempts++;
					console.log("<<< Selling -", tokenName, "- now" + "\u001b[1;32m" + " Profit target " + "\u001b[0m" + "reached >>>", "\n");
					sell(token, true);
					token.contract.removeAllListeners();
				}
			}

			if (currentValue.lte(stopLoss)) {
				console.log("\u001b[38;5;33m" + "less than StopLoss!" + "\u001b[0m");
				if (buyCount <= config.numberOfTokensToBuy && !token.didSell && token.didBuy && sellAttempts == 0) {
					sellAttempts++;
					console.log("<<< Selling -", tokenName, "- now" + "\u001b[1;31m" + " StopLoss " + "\u001b[0m" + "reached >>>", "\n");
					sell(token, false);
					token.contract.removeAllListeners();
				}
			}
		});
	} catch (e) {
		console.log(e);
	}
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
		if (tokenObj.tokenSellTax > 1) {
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
			console.log("\u001b[1;32m" + "✔ Sell transaction hash: ", receipt.transactionHash, "\u001b[0m", "\n");
			sellCount++;
			token[tokenObj.index].didSell = true;
			let name = await tokenObj.contract.name();
			await client.sendMessage('me', { message: `You sold ${name}`, schedule: (15 * 1) + (Date.now() / 1000) });
		} else {
			const tx = await pancakeRouter.swapExactTokensForETH(
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
			console.log("\u001b[1;32m" + "✔ Sell transaction hash: ", receipt.transactionHash, "\u001b[0m", "\n");
			sellCount++;
			token[tokenObj.index].didSell = true;
			let name = await tokenObj.contract.name();
			await client.sendMessage('me', { message: `You sold ${name}`, schedule: (15 * 1) + (Date.now() / 1000) });

		}

		if (buyCount == config.numberOfTokensToBuy) {
			console.log("All tokens sold");
			process.exit();
		}

	} catch (e) {
		console.log("\u001b[1;31m" + "❌ Receipt error: transaction failed! Check on BscScan.com" + "\u001b[0m", "\n");
	}
}

/**
 * 
 * Main
 * 
 * */
(async () => {
	 client = new TelegramClient(stringSession, apiId, apiHash, {
		connectionRetries: 5,
	});
	await client.start({
		phoneNumber: async () => await input.text("number?"),
		password: async () => await input.text("password?"),
		phoneCode: async () => await input.text("Code?"),
		onError: (err) => console.log(err),
	});
	console.log(`\nCurrent Version is ${version}\n`);
	console.log("Your string session is:", client.session.save(), '\n');
	console.log(`Connected to wallet: ${wallet.address} \n`);

	await helper.getUserInput();
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
			msg.includes("BNB") && didNotBuy(address)) {
			return true;
		}

	} else if (config.userStrategy == 'ML') {
		if (liquidity <= config.strategyML.maxLiquidity &&
			liquidity >= config.strategyML.minLiquidity &&
			buyTax <= config.strategyML.maxBuyTax &&
			buyTax >= config.strategyML.minBuyTax &&
			sellTax <= config.strategyML.maxSellTax &&
			msg.includes("BNB") && didNotBuy(address)) {
			return true;
		}

	} else if (config.userStrategy == 'HL') {
		if (liquidity <= config.strategyHL.maxLiquidity &&
			liquidity >= config.strategyHL.minLiquidity &&
			buyTax <= config.strategyHL.maxBuyTax &&
			buyTax >= config.strategyHL.minBuyTax &&
			sellTax <= config.strategyHL.maxSellTax && msg.includes("BNB") && didNotBuy(address)) {
			return true;
		}

	} else if (config.userStrategy == 'Custom') {
		if (liquidity <= config.customStrategy.maxLiquidity &&
			liquidity >= config.customStrategy.minLiquidity &&
			buyTax <= config.customStrategy.maxBuyTax &&
			buyTax >= config.customStrategy.minBuyTax &&
			sellTax <= config.customStrategy.maxSellTax && msg.includes("BNB") && didNotBuy(address)) {
			return true;
		}

	}
	return false;
}


function onNewMessageCoinGeckoCoinMarketCap(message) {
	if (message.peerId.channelId == CoinMarketCapCoinGeckoChannel) {
		console.log('--- NEW TOKEN FOUND FROM COINGECKO & COINMARKETCAP CHANNEL ---');
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
		if (isStrategy(liquidity, slipBuy, slipSell, msg, address) && msg.includes(config.strategyLL.platform)) {
			token.push({
				tokenAddress: address,
				didBuy: false,
				hasSold: false,
				tokenSellTax: slipSell,
				buyPath: [addresses.WBNB, address],
				sellPath: [address, addresses.WBNB],
				contract: new ethers.Contract(address, tokenAbi, account),
				investmentAmount: config.strategyLL.investmentAmount,
				profitPercent: config.strategyLL.profitPercent,
				stopLossPercent: config.strategyLL.stopLossPercent,
				gasPrice: config.strategyLL.gasPrice,
				checkProfit: function () { checkForProfit(this); },
				percentOfTokensToSellProfit: config.strategyLL.percentOfTokensToSellProfit,
				percentOfTokensToSellLoss: config.strategyLL.percentOfTokensToSellLoss,
				trailingStopLossPercent: config.strategyLL.trailingStopLossPercent,
				stopLoss: 0,
				intitialValue: 0,
				newValue: 0,
				currentValue: 0,
				tslValue: 0
			});
			console.log('<<< Attention! Buying token now! >>> Contract:', address);
			buy();
		}
		// Buy medium-liquid tokens
		else if (isStrategy(liquidity, slipBuy, slipSell, msg, address) && msg.includes(config.strategyML.platform)) {
			token.push({
				tokenAddress: address,
				didBuy: false,
				hasSold: false,
				tokenSellTax: slipSell,
				buyPath: [addresses.WBNB, address],
				sellPath: [address, addresses.WBNB],
				contract: new ethers.Contract(address, tokenAbi, account),
				investmentAmount: config.strategyML.investmentAmount,
				profitPercent: config.strategyML.profitPercent,
				stopLossPercent: config.strategyML.stopLossPercent,
				gasPrice: config.strategyML.gasPrice,
				checkProfit: function () { checkForProfit(this); },
				percentOfTokensToSellProfit: config.strategyML.percentOfTokensToSellProfit,
				percentOfTokensToSellLoss: config.strategyML.percentOfTokensToSellLoss,
				trailingStopLossPercent: config.strategyML.trailingStopLossPercent,
				stopLoss: 0,
				intitialValue: 0,
				newValue: 0,
				currentValue: 0,
				tslValue: 0
			});
			console.log('<<< Attention! Buying token now! >>> Contract:', address);
			buy();
		}
		//Buy high-liquid tokens
		else if (isStrategy(liquidity, slipBuy, slipSell, msg, address) && msg.includes(config.strategyHL.platform)) {
			token.push({
				tokenAddress: address,
				didBuy: false,
				hasSold: false,
				tokenSellTax: slipSell,
				buyPath: [addresses.WBNB, address],
				sellPath: [address, addresses.WBNB],
				contract: new ethers.Contract(address, tokenAbi, account),
				investmentAmount: config.strategyHL.investmentAmount,
				profitPercent: config.strategyHL.profitPercent,
				stopLossPercent: config.strategyHL.stopLossPercent,
				gasPrice: config.strategyHL.gasPrice,
				checkProfit: function () { checkForProfit(this); },
				percentOfTokensToSellProfit: config.strategyHL.percentOfTokensToSellProfit,
				percentOfTokensToSellLoss: config.strategyHL.percentOfTokensToSellLoss,
				trailingStopLossPercent: config.strategyHL.trailingStopLossPercent,
				stopLoss: 0,
				intitialValue: 0,
				newValue: 0,
				currentValue: 0,
				tslValue: 0
			});
			console.log('<<< Attention! Buying token now! >>> Contract:', address);
			buy();

		}
		// Custom Strategy
		else if (isStrategy(liquidity, slipBuy, slipSell, msg, address) && msg.includes(config.customStrategy.platform)) {
			token.push({
				tokenAddress: address,
				didBuy: false,
				hasSold: false,
				tokenSellTax: slipSell,
				buyPath: [addresses.WBNB, address],
				sellPath: [address, addresses.WBNB],
				contract: new ethers.Contract(address, tokenAbi, account),
				investmentAmount: config.customStrategy.investmentAmount,
				profitPercent: config.customStrategy.profitPercent,
				stopLossPercent: config.customStrategy.stopLossPercent,
				gasPrice: config.customStrategy.gasPrice,
				checkProfit: function () { checkForProfit(this); },
				percentOfTokensToSellProfit: config.customStrategy.percentOfTokensToSellProfit,
				percentOfTokensToSellLoss: config.customStrategy.percentOfTokensToSellLoss,
				trailingStopLossPercent: config.customStrategy.trailingStopLossPercent,
				stopLoss: 0,
				intitialValue: 0,
				newValue: 0,
				currentValue: 0,
				tslValue: 0
			});
			console.log('<<< Attention! Buying token now! >>> Contract:', address);
			buy();
		}
		// Buy all tokens no strategy
		else if (isStrategy(liquidity, slipBuy, slipSell, msg, address) && config.userStrategy == 'BA') {
			token.push({
				tokenAddress: address,
				didBuy: false,
				hasSold: false,
				tokenSellTax: slipSell,
				buyPath: [addresses.WBNB, address],
				sellPath: [address, addresses.WBNB],
				contract: new ethers.Contract(address, tokenAbi, account),
				investmentAmount: config.buyAllTokensStrategy.investmentAmount,
				profitPercent: config.buyAllTokensStrategy.profitPercent,
				stopLossPercent: config.buyAllTokensStrategy.stopLossPercent,
				gasPrice: config.buyAllTokensStrategy.gasPrice,
				checkProfit: function () { checkForProfit(this); },
				percentOfTokensToSellProfit: config.buyAllTokensStrategy.percentOfTokensToSellProfit,
				percentOfTokensToSellLoss: config.buyAllTokensStrategy.percentOfTokensToSellLoss,
				trailingStopLossPercent: config.buyAllTokensStrategy.trailingStopLossPercent,
				stopLoss: 0,
				intitialValue: 0,
				newValue: 0,
				currentValue: 0,
				tslValue: 0
			});
			console.log('<<< Attention! Buying token now! >>> Contract:', address);
			buy();
		} else {
			console.log('Not buying this token does not match strategy or liquidity is not BNB. Waiting for telegram notification to buy...', '\n');
		}
	}
}

function onNewMessageCoinMarketCapFastestAlerts(message) {
	if (message.peerId.channelId == CoinmarketcapFastestAlertsChannel) {
		console.log('--- NEW TOKEN FOUND FROM COINMARKETCAP FASTEST ALERTS CHANNEL ---');
		let timeStamp = new Date().toLocaleString();
		console.log(timeStamp);
		const msg = message.message.replace(/\n/g, " ").split(" ");
		var address = '';

		for (var i = 0; i < msg.length; i++) {

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
				console.log('--- --------------- ---');
			}
			if (ethers.utils.isAddress(msg[i])) {
				address = msg[i];
				console.log('Contract:', address);

			}
		}
		// Buy low-liquid tokens
		if (isStrategy(liquidity, slipBuy, slipSell, msg, address) && msg.includes("Insider")) {
			token.push({
				tokenAddress: address,
				didBuy: false,
				hasSold: false,
				tokenSellTax: slipSell,
				buyPath: [addresses.WBNB, address],
				sellPath: [address, addresses.WBNB],
				contract: new ethers.Contract(address, tokenAbi, account),
				investmentAmount: config.strategyLL.investmentAmount,
				profitPercent: config.strategyLL.profitPercent,
				stopLossPercent: config.strategyLL.stopLossPercent,
				gasPrice: config.strategyLL.gasPrice,
				checkProfit: function () { checkForProfit(this); },
				percentOfTokensToSellProfit: config.strategyLL.percentOfTokensToSellProfit,
				percentOfTokensToSellLoss: config.strategyLL.percentOfTokensToSellLoss,
				trailingStopLossPercent: config.strategyLL.trailingStopLossPercent,
				stopLoss: 0,
				intitialValue: 0,
				newValue: 0,
				currentValue: 0,
				tslValue: 0
			});
			console.log('<<< Attention! Buying token now! >>> Contract:', address);
			buy();
		}
		// Buy medium-liquid tokens
		else if (isStrategy(liquidity, slipBuy, slipSell, msg, address) && msg.includes("Insider")) {
			token.push({
				tokenAddress: address,
				didBuy: false,
				hasSold: false,
				tokenSellTax: slipSell,
				buyPath: [addresses.WBNB, address],
				sellPath: [address, addresses.WBNB],
				contract: new ethers.Contract(address, tokenAbi, account),
				investmentAmount: config.strategyML.investmentAmount,
				profitPercent: config.strategyML.profitPercent,
				stopLossPercent: config.strategyML.stopLossPercent,
				gasPrice: config.strategyML.gasPrice,
				checkProfit: function () { checkForProfit(this); },
				percentOfTokensToSellProfit: config.strategyML.percentOfTokensToSellProfit,
				percentOfTokensToSellLoss: config.strategyML.percentOfTokensToSellLoss,
				trailingStopLossPercent: config.strategyML.trailingStopLossPercent,
				stopLoss: 0,
				intitialValue: 0,
				newValue: 0,
				currentValue: 0,
				tslValue: 0

			});
			console.log('<<< Attention! Buying token now! >>> Contract:', address);
			buy();
		}
		//Buy high-liquid tokens
		else if (isStrategy(liquidity, slipBuy, slipSell, msg, address) && msg.includes("Insider")) {
			token.push({
				tokenAddress: address,
				didBuy: false,
				hasSold: false,
				tokenSellTax: slipSell,
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
				trailingStopLossPercent: config.strategyHL.trailingStopLossPercent,
				stopLoss: 0,
				intitialValue: 0,
				newValue: 0,
				currentValue: 0,
				tslValue: 0
			});
			console.log('<<< Attention! Buying token now! >>> Contract:', address);
			buy();

		}
		// Custom Strategy
		else if (isStrategy(liquidity, slipBuy, slipSell, msg, address) && msg.includes("Insider")) {
			token.push({
				tokenAddress: address,
				didBuy: false,
				hasSold: false,
				tokenSellTax: slipSell,
				buyPath: [addresses.WBNB, address],
				sellPath: [address, addresses.WBNB],
				contract: new ethers.Contract(address, tokenAbi, account),
				investmentAmount: config.customStrategy.investmentAmount,
				profitPercent: config.customStrategy.profitPercent,
				stopLossPercent: config.customStrategy.stopLossPercent,
				gasPrice: config.customStrategy.gasPrice,
				checkProfit: function () { checkForProfit(this); },
				percentOfTokensToSellProfit: config.customStrategy.percentOfTokensToSellProfit,
				percentOfTokensToSellLoss: config.customStrategy.percentOfTokensToSellLoss,
				trailingStopLossPercent: config.customStrategy.trailingStopLossPercent,
				stopLoss: 0,
				intitialValue: 0,
				newValue: 0,
				currentValue: 0,
				tslValue: 0
			});
			console.log('<<< Attention! Buying token now! >>> Contract:', address);
			buy();
		}
		// Buy all tokens no strategy
		else if (isStrategy(liquidity, slipBuy, slipSell, msg, address) && msg.includes("Insider")) {
			token.push({
				tokenAddress: address,
				didBuy: false,
				hasSold: false,
				tokenSellTax: slipSell,
				buyPath: [addresses.WBNB, address],
				sellPath: [address, addresses.WBNB],
				contract: new ethers.Contract(address, tokenAbi, account),
				investmentAmount: config.buyAllTokensStrategy.investmentAmount,
				profitPercent: config.buyAllTokensStrategy.profitPercent,
				stopLossPercent: config.buyAllTokensStrategy.stopLossPercent,
				gasPrice: config.buyAllTokensStrategy.gasPrice,
				checkProfit: function () { checkForProfit(this); },
				percentOfTokensToSellProfit: config.buyAllTokensStrategy.percentOfTokensToSellProfit,
				percentOfTokensToSellLoss: config.buyAllTokensStrategy.percentOfTokensToSellLoss,
				trailingStopLossPercent: config.buyAllTokensStrategy.trailingStopLossPercent,
				stopLoss: 0,
				intitialValue: 0,
				newValue: 0,
				currentValue: 0,
				tslValue: 0

			});
			console.log('<<< Attention! Buying token now! >>> Contract:', address);
			buy();
		} else {
			console.log('Not buying this token does not match strategy or liquidity is not BNB. Waiting for telegram notification to buy...', '\n');
		}
	}

}
/**
 * 
 * Recieved new Telegram message
 * 
 * */
async function onNewMessage(event) {
	const message = event.message;
	if (config.channel == 'CGCMC') {
		onNewMessageCoinGeckoCoinMarketCap(message);
	} else if (config.channel == 'CFA') {
		onNewMessageCoinMarketCapFastestAlerts(message);
	} else {
		console.log("Invalid Channel");
	}
}
