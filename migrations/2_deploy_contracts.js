const Utils = artifacts.require("Utils");

const Exchange = artifacts.require("Exchange");
const Reserve = artifacts.require("Reserve");
const Token = artifacts.require("Token");

module.exports = async function(deployer, network, accounts) {
    await deployer.deploy(Utils);
    await deployer.link(Utils, [Exchange, Reserve]);
    await deployer.deploy(Token, "TokenA", "TKA", 18);
    const tokenA = await Token.deployed();
    // const tokenB = await Token.new("TokenB", "TKB", 18);
    
    await deployer.deploy(Reserve, tokenA.address);
    const reserveA = await Reserve.deployed();
    // const reserveB = await Reserve.new(tokenB.address);

    await deployer.deploy(Exchange);
    const exchange = await Exchange.deployed();

    console.log("Owner: ", await exchange.owner());
    console.log("Exchange Address: ", exchange.address);
    console.log("ReserveA Address: ", reserveA.address);
    // console.log("ReserveB Address: ", reserveB.address);
    console.log("TokenA Address: ", tokenA.address);
    // console.log("TokenB Address: ", tokenB.address);

    await exchange.addReserve(reserveA.address, tokenA.address, true);
    // await exchange.addReserve(reserveB.address, tokenB.address, true);

    // isBuy = true;
    // srcAmount = 3000;
    // buyRate = 100;

    // await reserveA.setExchangeRates(100, 200);
    // // assert.equal((await reserveA.buyRate()), 100);
    // // buy srcAmount tokenA with srcAmount ETH
    // await reserveA.exchange(isBuy, srcAmount, {from: accounts[1], value: srcAmount});
}
