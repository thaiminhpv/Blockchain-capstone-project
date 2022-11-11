const assert = (condition, message) => { if (!condition) throw Error('Assert failed: ' + (message || '')) };

const Utils = artifacts.require("Utils");

const Exchange = artifacts.require("Exchange");
const Reserve = artifacts.require("Reserve");
const Token = artifacts.require("Token");

const NATIVE_TOKEN = "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee";

module.exports = async function(deployer, network, accounts) {
    await deployer.deploy(Utils);
    await deployer.link(Utils, [Exchange, Reserve]);
    const tokenA = await Token.new("TokenA", "TKA", 18);
    const tokenB = await Token.new("TokenB", "TKB", 18);
    
    const reserveA = await Reserve.new(tokenA.address, 120, 100);
    const reserveB = await Reserve.new(tokenB.address, 350, 380);

    let initialEther = web3.utils.toWei("100", "ether");
    let initialTokenAmount = web3.utils.toWei("100000", "ether");
    // send @initialEther tokenA to reserveA and @initialEther tokenB to reserveB
    await tokenA.transfer(reserveA.address, initialTokenAmount, {from: accounts[0]});
    await tokenB.transfer(reserveB.address, initialTokenAmount, {from: accounts[0]});
    // send @initialEther ETH to reserveA and @initialEther ETH to reserveB from accounts[0]
    await web3.eth.sendTransaction({from: accounts[0], to: reserveA.address, value: initialEther});
    await web3.eth.sendTransaction({from: accounts[0], to: reserveB.address, value: initialEther});

    // test exchange rate
    assert((await reserveA.getExchangeRate(true, 1e6)) == 120);
    assert((await reserveA.getExchangeRate(false, 1e6)) == 100);
    assert((await reserveB.getExchangeRate(true, 1e6)) == 350);
    assert((await reserveB.getExchangeRate(false, 1e6)) == 380);
    console.log("=========== Exchange rate from Reserve test passed ===========");

    await deployer.deploy(Exchange);
    const exchange = await Exchange.deployed();

    console.log("Owner: ", await exchange.owner());
    console.log("Exchange Address: ", exchange.address);
    console.log("ReserveA Address: ", reserveA.address);
    console.log("ReserveB Address: ", reserveB.address);
    console.log("TokenA Address: ", tokenA.address);
    console.log("TokenB Address: ", tokenB.address);

    await exchange.addReserve(reserveA.address, tokenA.address, true);
    await exchange.addReserve(reserveB.address, tokenB.address, true);
    
    // test exchange rate
    assert((await exchange.getExchangeRate(tokenA.address, tokenB.address, 1e6)) == (350 * 1e18 / 100));
    assert((await exchange.getExchangeRate(tokenB.address, tokenA.address, 1e6)) == (120 * 1e18 / 380));
    console.log("=========== Exchange rate from Exchange test passed ==========");

    // The owner of the contract can adjust exchange rate as he want
    // await reserveA.setExchangeRates(100, 200);
}
