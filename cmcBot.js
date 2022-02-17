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
const stringSession = new StringSession("");

/*-----------Settings-----------*/
const CoinMarketCapListingBotId = 1485440208;


var numberOfTokensToBuy = 3; // number of tokens you want to buy
const autoSell = true;  // If you want to auto sell or not 

const myGasPriceForApproval = ethers.utils.parseUnits('10', 'gwei');

const myGasLimit = 3000000;


const buyAllTokensStrategy = {

	investmentAmount: '0.1', // Amount to invest per token in BNB
	gasPrice: ethers.utils.parseUnits('10', 'gwei'),
	profitPercent: 100,      // 100% profit
	stopLossPercent: 10,  // 10% loss
	percentOfTokensToSellProfit: 100, // sell 75% when profit is reached
	percentOfTokensToSellLoss: 100, // sell 100% when stoploss is reached 
	trailingStopLossPercent: 15 // 15% trailing stoploss
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
var userStrategy;

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
		console.log(receipt);
		token[buyCount].didBuy = true;
		const poocoinURL = new URL(token[buyCount].tokenAddress, 'https://poocoin.app/tokens/');
		open(poocoinURL.href);
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
	console.log(receipt);
	if (autoSell) {
		token[buyCount - 1].checkProfit();
	} else {
		if (buyCount == numberOfTokensToBuy) {
			process.exit();
		}
	}

}

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
		console.log(receipt);
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
	console.log("You should now be connected to Telegram");
	console.log("String session:", client.session.save(), '\n');
	client.addEventHandler(onNewMessage, new NewMessage({}));
	console.log('\n',"Waiting for telegram notification to buy...");
})();

async function onNewMessage(event) {
	const message = event.message;
	if (message.peerId.channelId == CoinMarketCapListingBotId) {
		console.log('--- NEW TOKEN FOUND ---');
		let timeStamp = new Date().toLocaleString();
		console.log(timeStamp);
		const msg = message.message.replace(/\n/g, " ").split(" ");
		var address = '';
		for (var i = 0; i < msg.length; i++) {
			if (ethers.utils.isAddress(msg[i])) {
				address = msg[i];
			}
		}
		if (msg.includes('(BEP20)')) {
			token.push({
				tokenAddress: address,
				didBuy: false,
				hasSold: false,
				tokenSellTax: 0,
				tokenLiquidityType: 'BNB',
				tokenLiquidityAmount: 0,
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
				initialTrailingStopLossPercent: 0,
				trailingStopLossPercent: buyAllTokensStrategy.trailingStopLossPercent,
				stopLoss: 0,
				initialValue: 0
			});
			console.log('<<< Attention! Buying token now! >>> Contract:', address);
			buy();
		} else {
			console.log('--- Token is not Bep20 ---');
		}
	}
}
