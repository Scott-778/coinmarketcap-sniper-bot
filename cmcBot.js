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
const mnemonic = ''; // Wallet seed phrase
const apiId = 111111; // Replace with your own api id 
const apiHash = '';
const stringSession = new StringSession(""); // fill this later with the value from long string on command prompt to avoid logging in again
const myGasLimit = 1000000;

const numberOfTokensToBuy = 3; 
const autoSell = true;
const myGasPriceForApproval = ethers.utils.parseUnits('6', 'gwei');
const myGasLimit = 1000000;

/* Strategy for buying low-liquid tokens */
const strategyLL = 
{
	investmentAmount: '0.1', 	// Investment amount per token
	maxTax: 20, 			// max Slippage %
	maxLiquidity: 80 ,	        // max Liquidity BNB
	minLiquidity: 10, 	  	// min Liquidity BNB
	profitMultiplier: 2.5,          // 2.5X
	stopLossMultiplier: 0.7,        // 30% loss
	platform: "COINMARKETCAP",      // Either COINMARKETCAP or COINGECKO
	gasPrice: ethers.utils.parseUnits('10', 'gwei') // Gas Price. Higher is better for low liquidity
}

/* Strategy for buying medium-liquid tokens */
const strategyML = 
{
	investmentAmount: '0.2', 	// Investment amount per token
	maxTax: 10, 			// max Slippage %
	maxLiquidity: 150 ,	        // max Liquidity BNB
	minLiquidity: 80, 	  	// min Liquidity BNB
	profitMultiplier: 1.8,          // 80% profit
	stopLossMultiplier: 0.8,        // 20% loss
	platform: "COINGECKO",          // Either COINMARKETCAP or COINGECKO
	gasPrice: ethers.utils.parseUnits('7', 'gwei')
}

/* Strategy for buying high-liquid tokens */
const strategyHL = 
{
	investmentAmount: '0.3', 	// Investment amount low liquidity tokens per token
	maxTax: 20, 			// max Slippage %
	maxLiquidity: 80 ,	   	// max Liquidity BNB
	minLiquidity: 10, 	  	// min Liquidity BNB
	profitMultiplier: 1.5,          // 50% profit
	stopLossMultiplier: 0.9,        // 10% loss
	platform: "COINMARKETCAP",      // Either COINMARKETCAP or COINGECKO
	gasPrice: ethers.utils.parseUnits('5', 'gwei')
}
/*-----------End Settings-----------*/

const node = 'https://bsc-dataseed.binance.org/';
const wallet = new ethers.Wallet.fromMnemonic(mnemonic);
const channelId = 1517585345;
let tokenIn = addresses.WBNB;
let token = [];
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
    if(buyCount < numberOfTokensToBuy) {
	const value = ethers.utils.parseUnits(token[buyCount].investmentAmount, 'ether').toString();
        const tx = await pancakeRouter.swapExactETHForTokens(
            amountOutMin,
            token[buyCount].buyPath,
            addresses.recipient,
            Math.floor(Date.now() / 1000) + 60 * 4, {
                value: value,
                gasPrice: token[buyCount].gasPrice,
                gasLimit: myGasLimit

            }
        );
        const receipt = await tx.wait();
        console.log(receipt);
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
    console.log(receipt);
    if(autoSell) {
        token[buyCount - 1].checkProfit();
    } else {
        if(buyCount == numberOfTokensToBuy){
            process.exit();
        }
    }

}

async function checkForProfit(token) {
	var sellAttempts = 0;
	token.contract.on("Transfer", async(from, to, value, event) => {
		const takeLoss = (parseFloat(token.investmentAmount) * (token.stopLossMultiplier - token.tokenSellTax / 100 )).toFixed(18).toString();
        	const takeProfit = (parseFloat(token.investmentAmount) * (token.profitMultiplier + token.tokenSellTax / 100 )).toFixed(18).toString();
		const tokenName = await token.contract.name();
		let bal = await token.contract.balanceOf(addresses.recipient);
		const amount = await pancakeRouter.getAmountsOut(bal,token.sellPath);
		const profitDesired = ethers.utils.parseUnits(takeProfit);
		const stopLoss = ethers.utils.parseUnits(takeLoss);
		let currentValue;
		if(token.sellPath.length == 3){
			currentValue = amount[2];
		}else{
			currentValue = amount[1];
		}
		console.log('--- ', tokenName ,'--- Current Value in BNB:', ethers.utils.formatUnits(currentValue),'--- Profit At:', ethers.utils.formatUnits(profitDesired), '--- Stop Loss At:', ethers.utils.formatUnits(stopLoss), '\n');

		if(currentValue.gte(profitDesired)){
			if(buyCount <= numberOfTokensToBuy && !token.didSell && token.didBuy && sellAttempts == 0){
				sellAttempts++;
				console.log("Selling", tokenName , "now profit target reached", "\n");
				sell(token);
				token.contract.removeAllListeners();
			} 
		}

		if(currentValue.lte(stopLoss)){

			if(buyCount <= numberOfTokensToBuy && !token.didSell && token.didBuy && sellAttempts == 0){
				sellAttempts++;
				console.log("Selling", tokenName , "now stoploss reached", "\n");
				sell(token);
				token.contract.removeAllListeners();
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
        token[tokenObj.index].didSell = true;

        if(sellCount == numberOfTokensToBuy) {
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
    if(message.peerId.channelId == channelId) {
        const msg = message.message.replace(/\n/g, " ").split(" ");
        var address = '';
	var investment = '';
	    
        for (var i = 0; i < msg.length; i++) {
            if(ethers.utils.isAddress(msg[i])) {
                address = msg[i];
            }
            if(msg[i] == "BNB") {
                var liquidity = parseFloat(msg[i - 1]);
                console.log('--- NEW TOKEN FOUND ---');
                console.log('Liquidity:', liquidity, 'BNB');
            }
            if(msg[i] == "(buy)") {
                var slipBuy = parseInt(msg[i - 1]);
		console.log('Buy tax:', slipBuy, '%');  
            }
            if(msg[i] == "(sell)") {
                var slipSell = parseInt(msg[i - 1]);
		console.log('Sell tax:', slipSell, '%');
            }
        }
	    
	 // Buy low-liquid tokens
	if(liquidity < strategyLL.maxLiquidity &&
		liquidity > strategyLL.minLiquidity &&
		slipBuy < strategyLL.maxTax &&
		slipSell < strategyLL.maxTax && msg.includes("BNB") && msg.includes(strategyLL.platform)){
					
		token.push({
			tokenAddress: address,
			didBuy: false,
			hasSold: false,
			tokenSellTax: slipSell, 
			tokenLiquidityType: 'BNB',
			tokenLiquidityAmount: liquidity,
			buyPath: [addresses.WBNB, address],
			sellPath:[address, addresses.WBNB],
			contract: new ethers.Contract(address, tokenAbi, account),
			index: buyCount,
			investmentAmount: strategyLL.investmentAmount,
			profitMultiplier: strategyLL.profitMultiplier,
			stopLossMultiplier: strategyLL.stopLossMultiplier,
			gasPrice: strategyLL.gasPrice,
			checkProfit: function () { checkForProfit(this);}
		});
		buy();
			
	}
	// Buy medium-liquid tokens
	else if(liquidity < strategyML.maxLiquidity &&
		liquidity > strategyML.minLiquidity &&
		slipBuy < strategyML.maxTax &&
		slipSell < strategyML.maxTax && msg.includes("BNB") && msg.includes(strategyML.platform)){
					
		token.push({
			tokenAddress: address,
			didBuy: false,
			hasSold: false,
			tokenSellTax: slipSell, 
			tokenLiquidityType: 'BNB',
			tokenLiquidityAmount: liquidity,
			buyPath: [addresses.WBNB, address],
			sellPath:[address, addresses.WBNB],
			contract: new ethers.Contract(address, tokenAbi, account),
			index: buyCount,
			investmentAmount: strategyML.investmentAmount, 
			profitMultiplier: strategyML.profitMultiplier,
			stopLossMultiplier: strategyML.stopLossMultiplier,
			gasPrice: strategyML.gasPrice,
			checkProfit: function () { checkForProfit(this);}
		});
		buy();
			
	}
	//Buy high-liquid tokens
	else if(liquidity < strategyHL.maxLiquidity &&
		liquidity > strategyHL.minLiquidity &&
		slipBuy < strategyHL.maxTax &&
		slipSell < strategyHL.maxTax && msg.includes("BNB") && msg.includes(strategyHL.platform)){
					
		token.push({
			tokenAddress: address,
			didBuy: false,
			hasSold: false,
			tokenSellTax: slipSell, 
			tokenLiquidityType: 'BNB',
			tokenLiquidityAmount: liquidity,
			buyPath: [addresses.WBNB, address],
			sellPath:[address, addresses.WBNB],
			contract: new ethers.Contract(address, tokenAbi, account),
			index: buyCount,
			investmentAmount: strategyHL.investmentAmount,
			profitMultiplier: strategyHL.profitMultiplier,
			stopLossMultiplier: strategyHL.stopLossMultiplier,
			gasPrice: strategyHL.gasPrice,					
			checkProfit: function () { checkForProfit(this);}
		});
		buy();		
	}   
    }
}
