/*
coinmarketcap-new-listings-sniper-bot
Coinmarketcap new listings sniper bot that uses 
telegram notifications from this telegram channel
https://t.me/joinchat/b17jE6EbQX5kNWY8 use this link and subscribe.
Turn on two step verification in telegram.
Go to my.telegram.org and create App to get api_id and api_hash.
If this helped you buy me a cup of coffee 0x17CCCc30297bCC1287943ea1bb549fF843878669
*/

const {TelegramClient } = require("telegram"); //npm install telegram
const { StringSession } = require("telegram/sessions");
const input = require("input"); // npm install input
const { NewMessage } = require('telegram/events');
const ethers = require('ethers'); // npm install ethers

/* ----------------------------------- */

const apiId = ; 
const apiHash = '';
const stringSession = new StringSession(""); // fill this later with the value from session.save()

const addresses = {
WBNB: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
BUSD: '0xe9e7cea3dedca5984780bafc599bd69add087d56',
pancakeRouter: '0x10ED43C718714eb63d5aA57B78B54704E256024E',
recipient: '' // Your wallet address
}
const mnemonic = ''; // Your wallet seed phrase
const myGasPrice = ethers.utils.parseUnits('5', 'gwei'); // Adjust your gas here, the higher the better
const myGasPriceForApproval = ethers.utils.parseUnits('5', 'gwei');
const myGasLimit = 1000000; // Gas limit 

const investmentAmount = '1.5'; // The amount you want to buy in BUSD
const maxTax = 10; // The maximum tax for token you want to buy 

const profitXAmount = 1.50; // take 50% profit with max tax accounted for.
const stopLossXAmount = 0.90; // 10% loss with max tax accounted for. 
const autoSell = true;  // false to turn off auto sell

/* ----------------------------------- */

const channelId = 1517585345;
const node = 'https://bsc-dataseed.binance.org/';
const wallet = new ethers.Wallet.fromMnemonic(mnemonic);
const provider = new ethers.providers.JsonRpcProvider(node);
const account = wallet.connect(provider); 
let tokenIn, tokenOut;
tokenIn = addresses.WBNB;
const amountIn = ethers.utils.parseUnits(investmentAmount, 'ether');
let pancakeAbi = [{"inputs":[{"internalType":"address","name":"_factory","type":"address"},{"internalType":"address","name":"_WETH","type":"address"}],"stateMutability":"nonpayable","type":"constructor"},{"inputs":[],"name":"WETH","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"tokenA","type":"address"},{"internalType":"address","name":"tokenB","type":"address"},{"internalType":"uint256","name":"amountADesired","type":"uint256"},{"internalType":"uint256","name":"amountBDesired","type":"uint256"},{"internalType":"uint256","name":"amountAMin","type":"uint256"},{"internalType":"uint256","name":"amountBMin","type":"uint256"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"addLiquidity","outputs":[{"internalType":"uint256","name":"amountA","type":"uint256"},{"internalType":"uint256","name":"amountB","type":"uint256"},{"internalType":"uint256","name":"liquidity","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"token","type":"address"},{"internalType":"uint256","name":"amountTokenDesired","type":"uint256"},{"internalType":"uint256","name":"amountTokenMin","type":"uint256"},{"internalType":"uint256","name":"amountETHMin","type":"uint256"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"addLiquidityETH","outputs":[{"internalType":"uint256","name":"amountToken","type":"uint256"},{"internalType":"uint256","name":"amountETH","type":"uint256"},{"internalType":"uint256","name":"liquidity","type":"uint256"}],"stateMutability":"payable","type":"function"},{"inputs":[],"name":"factory","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountOut","type":"uint256"},{"internalType":"uint256","name":"reserveIn","type":"uint256"},{"internalType":"uint256","name":"reserveOut","type":"uint256"}],"name":"getAmountIn","outputs":[{"internalType":"uint256","name":"amountIn","type":"uint256"}],"stateMutability":"pure","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountIn","type":"uint256"},{"internalType":"uint256","name":"reserveIn","type":"uint256"},{"internalType":"uint256","name":"reserveOut","type":"uint256"}],"name":"getAmountOut","outputs":[{"internalType":"uint256","name":"amountOut","type":"uint256"}],"stateMutability":"pure","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountOut","type":"uint256"},{"internalType":"address[]","name":"path","type":"address[]"}],"name":"getAmountsIn","outputs":[{"internalType":"uint256[]","name":"amounts","type":"uint256[]"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountIn","type":"uint256"},{"internalType":"address[]","name":"path","type":"address[]"}],"name":"getAmountsOut","outputs":[{"internalType":"uint256[]","name":"amounts","type":"uint256[]"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountA","type":"uint256"},{"internalType":"uint256","name":"reserveA","type":"uint256"},{"internalType":"uint256","name":"reserveB","type":"uint256"}],"name":"quote","outputs":[{"internalType":"uint256","name":"amountB","type":"uint256"}],"stateMutability":"pure","type":"function"},{"inputs":[{"internalType":"address","name":"tokenA","type":"address"},{"internalType":"address","name":"tokenB","type":"address"},{"internalType":"uint256","name":"liquidity","type":"uint256"},{"internalType":"uint256","name":"amountAMin","type":"uint256"},{"internalType":"uint256","name":"amountBMin","type":"uint256"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"removeLiquidity","outputs":[{"internalType":"uint256","name":"amountA","type":"uint256"},{"internalType":"uint256","name":"amountB","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"token","type":"address"},{"internalType":"uint256","name":"liquidity","type":"uint256"},{"internalType":"uint256","name":"amountTokenMin","type":"uint256"},{"internalType":"uint256","name":"amountETHMin","type":"uint256"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"removeLiquidityETH","outputs":[{"internalType":"uint256","name":"amountToken","type":"uint256"},{"internalType":"uint256","name":"amountETH","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"token","type":"address"},{"internalType":"uint256","name":"liquidity","type":"uint256"},{"internalType":"uint256","name":"amountTokenMin","type":"uint256"},{"internalType":"uint256","name":"amountETHMin","type":"uint256"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"removeLiquidityETHSupportingFeeOnTransferTokens","outputs":[{"internalType":"uint256","name":"amountETH","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"token","type":"address"},{"internalType":"uint256","name":"liquidity","type":"uint256"},{"internalType":"uint256","name":"amountTokenMin","type":"uint256"},{"internalType":"uint256","name":"amountETHMin","type":"uint256"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"},{"internalType":"bool","name":"approveMax","type":"bool"},{"internalType":"uint8","name":"v","type":"uint8"},{"internalType":"bytes32","name":"r","type":"bytes32"},{"internalType":"bytes32","name":"s","type":"bytes32"}],"name":"removeLiquidityETHWithPermit","outputs":[{"internalType":"uint256","name":"amountToken","type":"uint256"},{"internalType":"uint256","name":"amountETH","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"token","type":"address"},{"internalType":"uint256","name":"liquidity","type":"uint256"},{"internalType":"uint256","name":"amountTokenMin","type":"uint256"},{"internalType":"uint256","name":"amountETHMin","type":"uint256"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"},{"internalType":"bool","name":"approveMax","type":"bool"},{"internalType":"uint8","name":"v","type":"uint8"},{"internalType":"bytes32","name":"r","type":"bytes32"},{"internalType":"bytes32","name":"s","type":"bytes32"}],"name":"removeLiquidityETHWithPermitSupportingFeeOnTransferTokens","outputs":[{"internalType":"uint256","name":"amountETH","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"tokenA","type":"address"},{"internalType":"address","name":"tokenB","type":"address"},{"internalType":"uint256","name":"liquidity","type":"uint256"},{"internalType":"uint256","name":"amountAMin","type":"uint256"},{"internalType":"uint256","name":"amountBMin","type":"uint256"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"},{"internalType":"bool","name":"approveMax","type":"bool"},{"internalType":"uint8","name":"v","type":"uint8"},{"internalType":"bytes32","name":"r","type":"bytes32"},{"internalType":"bytes32","name":"s","type":"bytes32"}],"name":"removeLiquidityWithPermit","outputs":[{"internalType":"uint256","name":"amountA","type":"uint256"},{"internalType":"uint256","name":"amountB","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountOut","type":"uint256"},{"internalType":"address[]","name":"path","type":"address[]"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"swapETHForExactTokens","outputs":[{"internalType":"uint256[]","name":"amounts","type":"uint256[]"}],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountOutMin","type":"uint256"},{"internalType":"address[]","name":"path","type":"address[]"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"swapExactETHForTokens","outputs":[{"internalType":"uint256[]","name":"amounts","type":"uint256[]"}],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountOutMin","type":"uint256"},{"internalType":"address[]","name":"path","type":"address[]"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"swapExactETHForTokensSupportingFeeOnTransferTokens","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountIn","type":"uint256"},{"internalType":"uint256","name":"amountOutMin","type":"uint256"},{"internalType":"address[]","name":"path","type":"address[]"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"swapExactTokensForETH","outputs":[{"internalType":"uint256[]","name":"amounts","type":"uint256[]"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountIn","type":"uint256"},{"internalType":"uint256","name":"amountOutMin","type":"uint256"},{"internalType":"address[]","name":"path","type":"address[]"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"swapExactTokensForETHSupportingFeeOnTransferTokens","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountIn","type":"uint256"},{"internalType":"uint256","name":"amountOutMin","type":"uint256"},{"internalType":"address[]","name":"path","type":"address[]"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"swapExactTokensForTokens","outputs":[{"internalType":"uint256[]","name":"amounts","type":"uint256[]"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountIn","type":"uint256"},{"internalType":"uint256","name":"amountOutMin","type":"uint256"},{"internalType":"address[]","name":"path","type":"address[]"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"swapExactTokensForTokensSupportingFeeOnTransferTokens","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountOut","type":"uint256"},{"internalType":"uint256","name":"amountInMax","type":"uint256"},{"internalType":"address[]","name":"path","type":"address[]"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"swapTokensForExactETH","outputs":[{"internalType":"uint256[]","name":"amounts","type":"uint256[]"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountOut","type":"uint256"},{"internalType":"uint256","name":"amountInMax","type":"uint256"},{"internalType":"address[]","name":"path","type":"address[]"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"swapTokensForExactTokens","outputs":[{"internalType":"uint256[]","name":"amounts","type":"uint256[]"}],"stateMutability":"nonpayable","type":"function"},{"stateMutability":"payable","type":"receive"}];
const pancakeRouter = new ethers.Contract(
addresses.pancakeRouter,
pancakeAbi,
account
);

let tokenAbi = [
'function approve(address spender, uint amount) public returns(bool)',
'function balanceOf(address account) external view returns (uint256)',
'event Transfer(address indexed from, address indexed to, uint amount)'
];
var sellCount = 0;
var buyCount = 0;

const buy = async (path) =>{
	if(buyCount == 0){
		buyCount++;
		console.log('Buying Token Now');
		const amounts = await pancakeRouter.getAmountsOut(amountIn, path);
		const amountOutMin = amounts[1].sub(amounts[1].div(2)); // 50% Slippage should be high enough so the transaction will not fail. 
		//To change slippage tolerance change the last number on the line above. For example, 5 would be 20% slippage, 10 would be 10%, 2 would be 50%.  
		
		const tx = await pancakeRouter.swapExactTokensForTokens(
			amountIn,
			amountOutMin,
			path,
			addresses.recipient,
			Math.floor(Date.now() / 1000) + 60 * 4, 
			{
			gasPrice: myGasPrice,
			gasLimit: myGasLimit
			}
		);
		const receipt = await tx.wait();
		console.log('Transaction receipt');
		console.log(receipt);
		approve(path); 
	}
} 

const approve = async (path) =>{
	let contract = new ethers.Contract(tokenOut, tokenAbi, account);
	const valueToApprove = ethers.constants.MaxUint256;
	const tx = await contract.approve(
		pancakeRouter.address, 
		valueToApprove,
		{
         	 gasPrice: myGasPriceForApproval,
         	 gasLimit: 210000,
		}
   	 );
	const receipt = await tx.wait(); 
	console.log(receipt);
	if (autoSell){
		checkForProfit(path);
	}else{
		process.exit();
	}	
}

const checkForProfit = async(path) =>{
	let tokenContract = new ethers.Contract(tokenOut, tokenAbi, account);
	const takeProfit = (profitXAmount + maxTax / 100) * 100;
	const takeLoss = (stopLossXAmount - maxTax / 100) * 100;
	tokenContract.on("Transfer", async(from, to, value, event) => {
		let bal = await tokenContract.balanceOf(addresses.recipient);
		const amount = await pancakeRouter.getAmountsOut(bal,path.reverse());
		const profitDesired = amountIn.mul(takeProfit).div(100);
		const stopLoss = amountIn.mul(takeLoss).div(100);
		let currentValue;
		if(path.length == 3){
			currentValue = amount[2];
		}else{
			currentValue = amount[1];
		}
		console.log('--- Current Value in BUSD:', ethers.utils.formatUnits(currentValue),'--- Profit At:', ethers.utils.formatUnits(profitDesired), '--- Stop Loss At:', ethers.utils.formatUnits(stopLoss), '\n');
		if (currentValue.gte(profitDesired)){
			if(sellCount == 0){
				sellCount++;
				console.log("Selling token profit target reached");
				sell(path);
			}
		}
		if (currentValue.lte(stopLoss)){
			if(sellCount == 0){
				sellCount++;
				console.log("Selling token now stop loss reached");
				sell(path);
			}
		}
	}); 
}



const sell = async (path) =>{
	const pathReversed = path.reverse();
	try{
		console.log('selling tokens');
		let contract = new ethers.Contract(tokenOut, tokenAbi, account);
		let bal = await contract.balanceOf(addresses.recipient);
		const sellAmount = await pancakeRouter.getAmountsOut(bal, pathReversed);
		const sellAmountsOutMin = sellAmount[1].sub(sellAmount[1].div(2));
		const tx = await pancakeRouter.swapExactTokensForTokensSupportingFeeOnTransferTokens(
			sellAmount[0].toString(),
			sellAmountsOutMin,
			pathReversed,
			addresses.recipient,
			Math.floor(Date.now() / 1000) + 60 * 3, 
			{
			gasPrice: myGasPriceForApproval,
			gasLimit: myGasLimit,
			}
		);
		const receipt = await tx.wait(); 
		console.log(receipt);
		process.exit();
	}catch(e){
		
	}		
}

(async () => {
	const client = new TelegramClient(stringSession, apiId, apiHash, {
        connectionRetries: 5,
  });
  await client.start({
    phoneNumber: async () => await input.text("number?"),
    password: async () => await input.text("2F password?"),
    phoneCode: async () => await input.text("Code?"),
    onError: (err) => console.log(err),
  });
	console.log("You should now be connected.");
        console.log(client.session.save()); // Save this string to avoid logging in again
	console.log("Waiting for telegram notification to buy tokens...");
        client.addEventHandler(onNewMessage, new NewMessage({}));
})();

async function onNewMessage(event) {
   	const message = event.message;
	if(message.peerId.channelId == channelId){
		const msg = message.message.replace(/\n/g, " ").split(" ");
		var address = '';
		var shouldBuy = true;
		for (var i = 0; i < msg.length; i++){	
			if (msg[i].length == 42 && msg[i].startsWith("0x")){
				address = msg[i];
			}
			if (msg[i] == "(buy)"){
				const slipBuy = parseInt(msg[i - 1]);
				if (slipBuy > maxTax){
					shouldBuy = false;
				}
			}
			if (msg[i] == "(sell)"){
				const slipSell = parseInt(msg[i - 1]);
				if (slipSell > maxTax){
					shouldBuy = false;
				}
			}
		}
		if(shouldBuy && msg.includes('BNB')){  
			console.log(address);
			tokenOut = address;
			buy([addresses.BUSD,tokenIn,tokenOut]);
		}
		
		else if(shouldBuy && msg.includes('BUSD')){
			console.log(address);
			tokenOut = address;
			buy([addresses.BUSD,tokenOut]);
		}
	}
}

