const Utils = artifacts.require("Utils");

const Exchange = artifacts.require("Exchange");
const Reserve = artifacts.require("Reserve");
const Token = artifacts.require("Token");

module.exports = async function(deployer, network, accounts) {
    await deployer.deploy(Utils);
    await deployer.link(Utils, [Exchange, Reserve]);
    const tokenA = await Token.new(Token, "TokenA", "TKA", 18);
    const tokenB = await Token.new("TokenB", "TKB", 18);
    
    const reserveA = await Reserve.new(tokenA.address);
    const reserveB = await Reserve.new(tokenB.address);

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
}
