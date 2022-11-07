const Exchange = artifacts.require("Exchange");
const Reserve = artifacts.require("Reserve");
const Token = artifacts.require("Token");
const TokenA = artifacts.require("TokenA");
const TokenB = artifacts.require("TokenB");

module.exports = async function(deployer) {
    // await deployer.deploy(TokenA, "TokenA", "TKA", 18);
    // const tokenA = await TokenA.deployed();
    
    const tokenA = await Token.new("TokenA", "TKA", 18);
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
