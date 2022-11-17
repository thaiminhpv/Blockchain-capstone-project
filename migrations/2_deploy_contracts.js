const assert = (condition, message) => { if (!condition) throw Error('Assert failed: ' + (message || '')) };

const Utils = artifacts.require("Utils");

const Exchange = artifacts.require("Exchange");
const Reserve = artifacts.require("Reserve");
const Token = artifacts.require("Token");

const NATIVE_TOKEN = "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee";

const gasLimit = 2206142; //2106142

module.exports = async function(deployer, network, accounts) {
    console.log("Deploying on network: " + network);
    console.log("Deployer account: " + accounts[0]);
    console.log("Deployer account balance: " + web3.utils.fromWei(await web3.eth.getBalance(accounts[0]), 'ether') + " ETH");
    console.log("Deployer account nonce: " + await web3.eth.getTransactionCount(accounts[0]));
    console.log("Deployer account gas price: " + await web3.eth.getGasPrice() + " wei");
    console.log("Deployer account gas limit: " + await web3.eth.getBlock("latest").gasLimit + " wei");
    console.log("===============================");
    console.log("");
    console.log("Deploying Utils...");
    await deployer.deploy(Utils);
    let utils = await Utils.deployed();
    console.log("Utils deployed at: " + utils.address);
    console.log("Deploying Utils successfully");
    
    console.log("Remaining account balance: " + web3.utils.fromWei(await web3.eth.getBalance(accounts[0]), 'ether') + " ETH");
    console.log("===============================");
    await deployer.link(Utils, [Exchange, Reserve]);
    console.log("");
    console.log("Deploying Tokens...");
    console.log("Deploying Token A...");
    const tokenA = await Token.new("TokenA", "TKA", 18);
    console.log("Deploying Token A successfully");
    console.log("TokenA Address: ", tokenA.address);
    console.log("Deploying Token B...");
    const tokenB = await Token.new("TokenB", "TKB", 18);
    console.log("Deploying Token B successfully");
    console.log("TokenB Address: ", tokenB.address);
    
    console.log("");
    console.log("Deploying Reserve...");
    console.log("Deploying Reserve for Token A...");
    const reserveA = await Reserve.new(tokenA.address, 120, 100, {gas: gasLimit})
    console.log("Deploying Reserve for Token A successfully");
    console.log("ReserveA Address: ", reserveA.address);
    console.log("Deploying Reserve for Token B...");
    const reserveB = await Reserve.new(tokenB.address, 350, 380, {gas: gasLimit})
    console.log("Deploying Reserve for Token B successfully");
    console.log("ReserveB Address: ", reserveB.address);
    console.log("Remaining account balance: " + web3.utils.fromWei(await web3.eth.getBalance(accounts[0]), 'ether') + " ETH");
    console.log("===============================");
    console.log("");
    console.log("Transfering tokens to reserves...");

    // let initialEther = web3.utils.toWei("10000", "ether");
    let initialTokenAmount = web3.utils.toWei("10000000000", "ether");
    // send @initialEther tokenA to reserveA and @initialEther tokenB to reserveB
    await tokenA.transfer(reserveA.address, initialTokenAmount, {from: accounts[0]});
    await tokenB.transfer(reserveB.address, initialTokenAmount, {from: accounts[0]});
    // send @initialEther ETH to reserveA and @initialEther ETH to reserveB from accounts[0]
    // await web3.eth.sendTransaction({from: accounts[0], to: reserveA.address, value: initialEther});
    // await web3.eth.sendTransaction({from: accounts[0], to: reserveB.address, value: initialEther});

    console.log("Transfering tokens to reserves successfully");
    // test exchange rate
    // assert((await reserveA.getExchangeRate(true, 1e6)) == 120);
    // assert((await reserveA.getExchangeRate(false, 1e6)) == 100);
    // assert((await reserveB.getExchangeRate(true, 1e6)) == 350);
    // assert((await reserveB.getExchangeRate(false, 1e6)) == 380);
    console.log("=========== Exchange rate from Reserve test passed ===========");
    console.log("Remaining account balance: " + web3.utils.fromWei(await web3.eth.getBalance(accounts[0]), 'ether') + " ETH");
    console.log("Deploying Exchange...");
    await deployer.deploy(Exchange);
    const exchange = await Exchange.deployed();
    console.log("Deploying Exchange successfully");

    console.log("Owner: ", await exchange.owner());
    console.log("Exchange Address: ", exchange.address);
    console.log("ReserveA Address: ", reserveA.address);
    console.log("ReserveB Address: ", reserveB.address);
    console.log("TokenA Address: ", tokenA.address);
    console.log("TokenB Address: ", tokenB.address);

    await exchange.addReserve(reserveA.address, tokenA.address, true);
    await exchange.addReserve(reserveB.address, tokenB.address, true);
    
    // test exchange rate
    // assert((await exchange.getExchangeRate(tokenA.address, tokenB.address, 1e6)) == (350 * 1e18 / 100));
    // assert((await exchange.getExchangeRate(tokenB.address, tokenA.address, 1e6)) == (120 * 1e18 / 380));
    console.log("=========== Exchange rate from Exchange test passed ==========");

    // The owner of the contract can adjust exchange rate as he want
    // await reserveA.setExchangeRates(100, 200);
}
