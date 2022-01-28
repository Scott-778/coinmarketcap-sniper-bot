/*
coinmarketcap-new-listings-sniper-bot
Coinmarketcap new listings sniper bot that uses 
telegram notifications from this telegram channel
https://t.me/joinchat/b17jE6EbQX5kNWY8 use this link and subscribe.
Turn on two step verification in telegram.
Go to my.telegram.org and create App to get api_id and api_hash.

If this helped you buy me a cup of coffee 0x17CCCc30297bCC1287943ea1bb549fF843878669
*/
const { TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");
const input = require("input");
const { NewMessage } = require('telegram/events');
const ethers = require('ethers');

const addresses = {
    WBNB: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
    pancakeRouter: '0x10ED43C718714eb63d5aA57B78B54704E256024E',
    BUSD: '0xe9e7cea3dedca5984780bafc599bd69add087d56',

    recipient: '' // Your wallet address here
}

/*-----------Settings-----------*/

const investmentAmount = '0.1'; // investment amount per token
const mnemonic = ''; // Wallet seed phrase

const myGasLimit = 1000000;
const myGasPrice = ethers.utils.parseUnits('6', 'gwei');
const myGasPriceForApproval = ethers.utils.parseUnits('6', 'gwei');

const maxTax = 10; // 10%
const maxLiquidity = 500;
const minLiquidity = 30;

const profitXAmount = 1.9; // take 90% profit with max tax accounted for.
const stopLossXAmount = 0.90; // 10% loss with max tax accounted for. 
const autoSell = true; // false to turn off auto sell

const numberOfTokensToBuy = 2;
const strategy = 'COINMARKETCAP'; // Only buys coinmarketcap coins. if stratgey = 'COINGECKO' it will only buy coingecko coins 

const apiId = 111111; // Replace with your own api id 
const apiHash = '';
const stringSession = new StringSession(""); // fill this later with the value from long string on command prompt to avoid logging in again

/*-----------End Settings-----------*/

const node = 'https://bsc-dataseed.binance.org/';
const wallet = new ethers.Wallet.fromMnemonic(mnemonic);
const channelId = 1517585345;
let tokenIn = addresses.WBNB;
let token = [];
const amountIn = ethers.utils.parseUnits(investmentAmount, 'ether');
const value = amountIn.toString();
const amountOutMin = ethers.utils.parseUnits('0', '0');
let pancakeAbi = [{"inputs":[{"internalType":"address","name":"_factory","type":"address"},{"internalType":"address","name":"_WETH","type":"address"}],"stateMutability":"nonpayable","type":"constructor"},{"inputs":[],"name":"WETH","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"tokenA","type":"address"},{"internalType":"address","name":"tokenB","type":"address"},{"internalType":"uint256","name":"amountADesired","type":"uint256"},{"internalType":"uint256","name":"amountBDesired","type":"uint256"},{"internalType":"uint256","name":"amountAMin","type":"uint256"},{"internalType":"uint256","name":"amountBMin","type":"uint256"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"addLiquidity","outputs":[{"internalType":"uint256","name":"amountA","type":"uint256"},{"internalType":"uint256","name":"amountB","type":"uint256"},{"internalType":"uint256","name":"liquidity","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"token","type":"address"},{"internalType":"uint256","name":"amountTokenDesired","type":"uint256"},{"internalType":"uint256","name":"amountTokenMin","type":"uint256"},{"internalType":"uint256","name":"amountETHMin","type":"uint256"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"addLiquidityETH","outputs":[{"internalType":"uint256","name":"amountToken","type":"uint256"},{"internalType":"uint256","name":"amountETH","type":"uint256"},{"internalType":"uint256","name":"liquidity","type":"uint256"}],"stateMutability":"payable","type":"function"},{"inputs":[],"name":"factory","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountOut","type":"uint256"},{"internalType":"uint256","name":"reserveIn","type":"uint256"},{"internalType":"uint256","name":"reserveOut","type":"uint256"}],"name":"getAmountIn","outputs":[{"internalType":"uint256","name":"amountIn","type":"uint256"}],"stateMutability":"pure","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountIn","type":"uint256"},{"internalType":"uint256","name":"reserveIn","type":"uint256"},{"internalType":"uint256","name":"reserveOut","type":"uint256"}],"name":"getAmountOut","outputs":[{"internalType":"uint256","name":"amountOut","type":"uint256"}],"stateMutability":"pure","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountOut","type":"uint256"},{"internalType":"address[]","name":"path","type":"address[]"}],"name":"getAmountsIn","outputs":[{"internalType":"uint256[]","name":"amounts","type":"uint256[]"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountIn","type":"uint256"},{"internalType":"address[]","name":"path","type":"address[]"}],"name":"getAmountsOut","outputs":[{"internalType":"uint256[]","name":"amounts","type":"uint256[]"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountA","type":"uint256"},{"internalType":"uint256","name":"reserveA","type":"uint256"},{"internalType":"uint256","name":"reserveB","type":"uint256"}],"name":"quote","outputs":[{"internalType":"uint256","name":"amountB","type":"uint256"}],"stateMutability":"pure","type":"function"},{"inputs":[{"internalType":"address","name":"tokenA","type":"address"},{"internalType":"address","name":"tokenB","type":"address"},{"internalType":"uint256","name":"liquidity","type":"uint256"},{"internalType":"uint256","name":"amountAMin","type":"uint256"},{"internalType":"uint256","name":"amountBMin","type":"uint256"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"removeLiquidity","outputs":[{"internalType":"uint256","name":"amountA","type":"uint256"},{"internalType":"uint256","name":"amountB","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"token","type":"address"},{"internalType":"uint256","name":"liquidity","type":"uint256"},{"internalType":"uint256","name":"amountTokenMin","type":"uint256"},{"internalType":"uint256","name":"amountETHMin","type":"uint256"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"removeLiquidityETH","outputs":[{"internalType":"uint256","name":"amountToken","type":"uint256"},{"internalType":"uint256","name":"amountETH","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"token","type":"address"},{"internalType":"uint256","name":"liquidity","type":"uint256"},{"internalType":"uint256","name":"amountTokenMin","type":"uint256"},{"internalType":"uint256","name":"amountETHMin","type":"uint256"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"removeLiquidityETHSupportingFeeOnTransferTokens","outputs":[{"internalType":"uint256","name":"amountETH","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"token","type":"address"},{"internalType":"uint256","name":"liquidity","type":"uint256"},{"internalType":"uint256","name":"amountTokenMin","type":"uint256"},{"internalType":"uint256","name":"amountETHMin","type":"uint256"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"},{"internalType":"bool","name":"approveMax","type":"bool"},{"internalType":"uint8","name":"v","type":"uint8"},{"internalType":"bytes32","name":"r","type":"bytes32"},{"internalType":"bytes32","name":"s","type":"bytes32"}],"name":"removeLiquidityETHWithPermit","outputs":[{"internalType":"uint256","name":"amountToken","type":"uint256"},{"internalType":"uint256","name":"amountETH","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"token","type":"address"},{"internalType":"uint256","name":"liquidity","type":"uint256"},{"internalType":"uint256","name":"amountTokenMin","type":"uint256"},{"internalType":"uint256","name":"amountETHMin","type":"uint256"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"},{"internalType":"bool","name":"approveMax","type":"bool"},{"internalType":"uint8","name":"v","type":"uint8"},{"internalType":"bytes32","name":"r","type":"bytes32"},{"internalType":"bytes32","name":"s","type":"bytes32"}],"name":"removeLiquidityETHWithPermitSupportingFeeOnTransferTokens","outputs":[{"internalType":"uint256","name":"amountETH","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"tokenA","type":"address"},{"internalType":"address","name":"tokenB","type":"address"},{"internalType":"uint256","name":"liquidity","type":"uint256"},{"internalType":"uint256","name":"amountAMin","type":"uint256"},{"internalType":"uint256","name":"amountBMin","type":"uint256"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"},{"internalType":"bool","name":"approveMax","type":"bool"},{"internalType":"uint8","name":"v","type":"uint8"},{"internalType":"bytes32","name":"r","type":"bytes32"},{"internalType":"bytes32","name":"s","type":"bytes32"}],"name":"removeLiquidityWithPermit","outputs":[{"internalType":"uint256","name":"amountA","type":"uint256"},{"internalType":"uint256","name":"amountB","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountOut","type":"uint256"},{"internalType":"address[]","name":"path","type":"address[]"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"swapETHForExactTokens","outputs":[{"internalType":"uint256[]","name":"amounts","type":"uint256[]"}],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountOutMin","type":"uint256"},{"internalType":"address[]","name":"path","type":"address[]"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"swapExactETHForTokens","outputs":[{"internalType":"uint256[]","name":"amounts","type":"uint256[]"}],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountOutMin","type":"uint256"},{"internalType":"address[]","name":"path","type":"address[]"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"swapExactETHForTokensSupportingFeeOnTransferTokens","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountIn","type":"uint256"},{"internalType":"uint256","name":"amountOutMin","type":"uint256"},{"internalType":"address[]","name":"path","type":"address[]"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"swapExactTokensForETH","outputs":[{"internalType":"uint256[]","name":"amounts","type":"uint256[]"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountIn","type":"uint256"},{"internalType":"uint256","name":"amountOutMin","type":"uint256"},{"internalType":"address[]","name":"path","type":"address[]"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"swapExactTokensForETHSupportingFeeOnTransferTokens","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountIn","type":"uint256"},{"internalType":"uint256","name":"amountOutMin","type":"uint256"},{"internalType":"address[]","name":"path","type":"address[]"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"swapExactTokensForTokens","outputs":[{"internalType":"uint256[]","name":"amounts","type":"uint256[]"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountIn","type":"uint256"},{"internalType":"uint256","name":"amountOutMin","type":"uint256"},{"internalType":"address[]","name":"path","type":"address[]"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"swapExactTokensForTokensSupportingFeeOnTransferTokens","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountOut","type":"uint256"},{"internalType":"uint256","name":"amountInMax","type":"uint256"},{"internalType":"address[]","name":"path","type":"address[]"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"swapTokensForExactETH","outputs":[{"internalType":"uint256[]","name":"amounts","type":"uint256[]"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountOut","type":"uint256"},{"internalType":"uint256","name":"amountInMax","type":"uint256"},{"internalType":"address[]","name":"path","type":"address[]"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"swapTokensForExactTokens","outputs":[{"internalType":"uint256[]","name":"amounts","type":"uint256[]"}],"stateMutability":"nonpayable","type":"function"},{"stateMutability":"payable","type":"receive"}];
const provider = new ethers.providers.JsonRpcProvider(node);
const account = wallet.connect(provider);
const pancakeRouter = new ethers.Contract(addresses.pancakeRouter, pancakeAbi, account);
let tokenAbi = [
    'function approve(address spender, uint amount) public returns(bool)',
    'function balanceOf(address account) external view returns (uint256)',
    'event Transfer(address indexed from, address indexed to, uint amount)',
    'function name() view returns (string)'
];

var sellCount = 0;
var buyCount = 0;

async function buy() {
    if (buyCount < numberOfTokensToBuy) {
        const tx = await pancakeRouter.swapExactETHForTokens(
            amountOutMin,
            token[buyCount].buyPath,
            addresses.recipient,
            Math.floor(Date.now() / 1000) + 60 * 4, {
                value: value,
                gasPrice: myGasPrice,
                gasLimit: myGasLimit

            }
        );
        const receipt = await tx.wait();
        console.log(receipt);
        token[buyCount].didBuy = true;
        buyCount++;
        approve();
        console.log(token);
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
        checkForProfit();
    } else {
        if(buyCount == numberOfTokensToBuy){
            process.exit();
        }
    }

}

async function checkForProfit() {
    const tokenContract = token[buyCount - 1].contract;
    const tokenObj = token[buyCount - 1];
    const tokenIndex = token[buyCount - 1].index;
    const takeLoss = (parseFloat(investmentAmount) * (stopLossXAmount - token[buyCount - 1].tokenSellTax / 100)).toFixed(18).toString();
    const takeProfit = (parseFloat(investmentAmount) * (profitXAmount + token[buyCount - 1].tokenSellTax / 100)).toFixed(18).toString();
    const tokenName = await tokenContract.name();
    var sellAttempts = 0;

    tokenContract.on("Transfer", async (from, to, value, event) => {
        let bal = await tokenContract.balanceOf(addresses.recipient);
        const amount = await pancakeRouter.getAmountsOut(bal, token[buyCount - 1].sellPath);
        const profitDesired = ethers.utils.parseUnits(takeProfit);
        const stopLoss = ethers.utils.parseUnits(takeLoss);
        let currentValue;
			if(tokenObj.sellPath.length == 3){
				currentValue = amount[2];
			}else{
				currentValue = amount[1];
			}
        console.log('--- ', tokenName, '--- Current Value in BNB:', ethers.utils.formatUnits(currentValue), '--- Profit At:', ethers.utils.formatUnits(profitDesired), '--- Stop Loss At:', ethers.utils.formatUnits(stopLoss), '\n');

        if (currentValue.gte(profitDesired)) {
            if (buyCount <= numberOfTokensToBuy && !token[tokenIndex].didSell && token[tokenIndex].didBuy && sellAttempts == 0) {
                sellAttempts++;
                console.log("Selling", tokenName, "now profit target reached", "\n");
                sell(tokenObj);
                tokenContract.removeAllListeners();
            }
        }

        if (currentValue.lte(stopLoss)) {
            if (buyCount <= numberOfTokensToBuy && !token[tokenIndex].didSell && token[tokenIndex].didBuy && sellAttempts == 0) {
                sellAttempts++;
                console.log("Selling", tokenName, "now stop loss reached", "\n");
                sell(tokenObj);
                tokenContract.removeAllListeners();

            }
        }
    });

}

async function sell(tokenObj) {
    try {
        let bal = await tokenObj.contract.balanceOf(addresses.recipient);
        const sellAmount = await pancakeRouter.getAmountsOut(bal, tokenObj.sellPath);
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
        token[buyCount].didSell = true;

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
        var shouldBuy = true;
        for (var i = 0; i < msg.length; i++) {
            if (msg[i].length == 42 && msg[i].startsWith("0x")) {
                address = msg[i];
            }
            if (msg[i] == "BNB") {
                var liquidity = parseFloat(msg[i - 1]);
                console.log('--- NEW TOKEN FOUND ---');
                console.log('Liquidity:', liquidity, 'BNB');
                if (liquidity > maxLiquidity) {
                    shouldBuy = false;
                }
                if (liquidity < minLiquidity) {
                    shouldBuy = false;
                }
            }
            if (msg[i] == "(buy)") {
                var slipBuy = parseInt(msg[i - 1]);
		console.log('Buy tax:', slipBuy, '%');
                if (slipBuy > maxTax) {
                    shouldBuy = false;
                }
            }
            if (msg[i] == "(sell)") {
                var slipSell = parseInt(msg[i - 1]);
		console.log('Sell tax:', slipSell, '%');
                if (slipSell > maxTax) {
                    shouldBuy = false;
                }
            }
        }

        if (shouldBuy && msg.includes("BNB") && msg.includes(strategy)) {
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
                index: buyCount
            });
            buy();
        } else if (shouldBuy && msg.includes("BUSD") && msg.includes(strategy)) {
            token.push({
                tokenAddress: address,
                didBuy: false,
                hasSold: false,
                tokenSellTax: slipSell,
                tokenLiquidityType: 'BUSD',
                tokenLiquidityAmount: 0,
                buyPath: [addresses.WBNB, addresses.BUSD, address],
                sellPath: [address, addresses.BUSD, addresses.WBNB],
                contract: new ethers.Contract(address, tokenAbi, account),
                index: buyCount
            });
            buy();
        }
    }
}
