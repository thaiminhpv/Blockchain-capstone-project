const Reserve = artifacts.require("./Reserve.sol");
const Token = artifacts.require("./Token.sol");

let tokenA, tokenB, reserveA, reserveB, exchange;
contract("Reserve contract", (accounts) => {
  // beforeAll
  before(async () => {
    console.log("=========== Begin test ===========");
    tokenA = await Token.new("TokenA", "TKA", 18);
    tokenB = await Token.new("TokenB", "TKB", 18);

    reserveA = await Reserve.new(tokenA.address);
    reserveB = await Reserve.new(tokenB.address);

    // send 1e6 tokenA to reserveA and 1e6 tokenB to reserveB
    await tokenA.transfer(reserveA.address, 1e6, {from: accounts[0]});
    await tokenB.transfer(reserveB.address, 1e6, {from: accounts[0]});
    assert.equal((await tokenA.balanceOf(reserveA.address)).toString(), 1e6);
    assert.equal((await tokenB.balanceOf(reserveB.address)).toString(), 1e6);
    // send 1e6 ETH to reserveA and 1e6 ETH to reserveB from accounts[0]
    await web3.eth.sendTransaction({from: accounts[0], to: reserveA.address, value: 1e6});
    await web3.eth.sendTransaction({from: accounts[0], to: reserveB.address, value: 1e6});
    assert.equal((await web3.eth.getBalance(reserveA.address)).toString(), 1e6);
    assert.equal((await web3.eth.getBalance(reserveB.address)).toString(), 1e6);

    // console.log("Owner: ", accounts[0]);
    // console.log("ReserveA owner Address: ", await reserveA.owner());
    // console.log("ReserveB owner Address: ", await reserveB.owner());
    // console.log("TokenA Address: ", tokenA.address);
    // console.log("TokenB Address: ", tokenB.address);
    // console.log("TokenA owner Address: ", await tokenA.owner());
    // console.log("TokenB owner Address: ", await tokenB.owner());

    // // get balanceOf owner
    // const balanceOfOwnerA = await tokenA.balanceOf(accounts[0]);
    // const balanceOfOwnerB = await tokenB.balanceOf(accounts[0]);
    // console.log("balanceOfOwnerA: ", balanceOfOwnerA.toString());
    // console.log("balanceOfOwnerB: ", balanceOfOwnerB.toString());

    // await deployer.deploy(Exchange);
    // const exchange = await Exchange.deployed();

    // await exchange.addReserve(reserveA.address, tokenA.address, true);
    // await exchange.addReserve(reserveB.address, tokenB.address, true);
  });

  // beforeEach
  beforeEach(async () => {
  });

  describe("Contract deployment", () => {
    it("Token contract deployment", async () => {
      // null
      assert.notEqual(tokenA.address, 0x0);
      assert.notEqual(tokenA.address, "");
      assert.notEqual(tokenA.address, null);
      assert.notEqual(tokenA.address, undefined);

      assert.notEqual(tokenB.address, 0x0);
      assert.notEqual(tokenB.address, "");
      assert.notEqual(tokenB.address, null);
      assert.notEqual(tokenB.address, undefined);

      // attributes
      assert.equal(await tokenA.name(), "TokenA");
      assert.equal(await tokenA.symbol(), "TKA");
      assert.equal(await tokenA.decimals(), 18);

      assert.equal(await tokenB.name(), "TokenB");
      assert.equal(await tokenB.symbol(), "TKB");
      assert.equal(await tokenB.decimals(), 18);
    });
    it("Reserve contract deployment", async () => {
      assert.notEqual(reserveA.address, 0x0);
      assert.notEqual(reserveA.address, "");
      assert.notEqual(reserveA.address, null);
      assert.notEqual(reserveA.address, undefined);

      assert.notEqual(reserveB.address, 0x0);
      assert.notEqual(reserveB.address, "");
      assert.notEqual(reserveB.address, null);
      assert.notEqual(reserveB.address, undefined);
    });
  });

  describe("Reserve contract constructor", () => {
    it("Owner should be set correctly", async () => {
      assert.equal(await reserveA.owner(), accounts[0]);
      assert.equal(await reserveB.owner(), accounts[0]);
    });
    it("SupportedToken address should be set correctly", async () => {
      assert.equal((await reserveA.supportedToken()), tokenA.address);
      assert.equal((await reserveB.supportedToken()), tokenB.address);
    });
  });

  describe("SetExchangeRates", () => {
    it("Only owner can set exchange rate", async () => {
      try {
        await reserveA.setExchangeRates(100, 200, { from: accounts[1] });
        assert.fail("Only owner can set exchange rate");
      } catch (error) {
        assert.ok(/revert/.test(error.message));
      }
    });
    it("Exchange rate should be set correctly", async () => {
      await reserveA.setExchangeRates(100, 200);
      assert.equal((await reserveA.buyRate()), 100);
      assert.equal((await reserveA.sellRate()), 200);
    });
  });

  describe("GetExchangeRates", () => {
    it("Get exchange rate correctly", async () => {
      await reserveA.setExchangeRates(100, 200);
      assert.equal((await reserveA.getExchangeRates(true, 1)), 100);
      assert.equal((await reserveA.getExchangeRates(false, 1)), 200);

  describe("Buy", () => {
    it.only("Buy tokenA with ETH", async () => {
      isBuy = true;
      srcAmount = 3000;
      buyRate = 100;

      await reserveA.setExchangeRates(100, 200);
      assert.equal((await reserveA.buyRate()), 100);
      // buy srcAmount tokenA with srcAmount ETH
      await reserveA.exchange(isBuy, srcAmount, {from: accounts[1], value: srcAmount});
      // check allowance
      console.log("Allowance: ", (await tokenA.allowance(reserveA.address, accounts[1])).toString());
      assert((await tokenA.allowance(reserveA.address, accounts[1])).toString(), srcAmount * buyRate);
    });
  });

});
