const Reserve = artifacts.require("./Reserve.sol");
const Token = artifacts.require("./Token.sol");

contract("Reserve contract", (accounts) => {
  const NATIVE_TOKEN = "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee";
  let tokenA, tokenB, reserveA, reserveB, exchange;
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
    it("Owner can withdraw ETH", async () => {
      let balanceBefore = await web3.eth.getBalance(accounts[1]);
      let reserveBalanceBefore = await web3.eth.getBalance(reserveA.address);
      await reserveA.withdrawFunds(NATIVE_TOKEN, BigInt(reserveBalanceBefore), accounts[1], {from: accounts[0]});
      let balanceAfter = await web3.eth.getBalance(accounts[1]);
      let reserveBalanceAfter = await web3.eth.getBalance(reserveA.address);
      assert.equal(BigInt(balanceAfter) - BigInt(balanceBefore), reserveBalanceBefore);
      assert.equal(reserveBalanceAfter, 0);
    });
    it("Owner can withdraw token", async () => {
      let balanceBefore = await tokenA.balanceOf(accounts[1]);
      let reserveBalanceBefore = await tokenA.balanceOf(reserveA.address);
      await reserveA.withdrawFunds(tokenA.address, BigInt(reserveBalanceBefore), accounts[1], {from: accounts[0]});
      let balanceAfter = await tokenA.balanceOf(accounts[1]);
      let reserveBalanceAfter = await tokenA.balanceOf(reserveA.address);
      assert.equal(BigInt(balanceAfter) - BigInt(balanceBefore), reserveBalanceBefore);
      assert.equal(reserveBalanceAfter, 0);
    });
  });

  describe("SetExchangeRates", () => {
    it("Only owner can set exchange rate", async () => {
      try {
        await reserveA.setExchangeRates(100, 200, { from: accounts[1] });
        assert.fail("Only owner can set exchange rate");
      } catch (error) {
        assert.ok(/revert/i.test(error.message));
      }
    });
    it("Exchange rate should be set correctly", async () => {
      await reserveA.setExchangeRates(100, 200);
      assert.equal((await reserveA.buyRate()), 100);
      assert.equal((await reserveA.sellRate()), 200);
    });
    it("Event should be emitted", async () => {
      const result = await reserveA.setExchangeRates(100, 200);
      const log = result.logs[0];
      assert.equal(log.event, "ExchangeRatesSet");
      assert.equal(log.args.buyRate, 100);
      assert.equal(log.args.sellRate, 200);
    });
  });

  describe("GetExchangeRate", () => {
    it("Get BUY exchange rate correctly", async () => {
      await reserveA.setExchangeRates(100, 200);
      assert.equal((await reserveA.getExchangeRate(true, 1)), 100);
      assert.equal((await reserveA.getExchangeRate(true, 2)), 100);
      assert.equal((await reserveA.getExchangeRate(true, 1)), (await reserveA.buyRate()).toNumber());
    });
    it("Get SELL exchange rate correctly", async () => {
      await reserveA.setExchangeRates(100, 200);
      assert.equal((await reserveA.getExchangeRate(false, 1)), 200);
      assert.equal((await reserveA.getExchangeRate(false, 2)), 200);
      assert.equal((await reserveA.getExchangeRate(false, 1)), (await reserveA.sellRate()).toNumber());
    });
  });

  describe("Exchange (calling from Exchange contract)", () => {
    it("Buy tokenA with ETH", async () => {
      isBuy = true;
      srcAmount = 3000;
      buyRate = 100;
      sellRate = 200;

      await reserveA.setExchangeRates(buyRate, sellRate);
      // buy srcAmount tokenA with srcAmount ETH
      let receiveAmount = await reserveA.exchange(isBuy, srcAmount, {from: accounts[1], value: srcAmount});
      let allowance = await tokenA.allowance(reserveA.address, accounts[1]);
      assert(allowance.toString(), srcAmount * buyRate);
      assert(receiveAmount.toString(), srcAmount * buyRate);
    });
    it("Sell tokenA for ETH", async () => {
      isBuy = false;
      srcAmount = 3000;
      buyRate = 100;
      sellRate = 200;

      // give accounts[1] 10000 tokenA
      await tokenA.transfer(accounts[1], 10000);

      await reserveA.setExchangeRates(buyRate, sellRate);
      // sell srcAmount tokenA for srcAmount ETH
      await tokenA.approve(reserveA.address, srcAmount, {from: accounts[1]});
      assert.equal((await tokenA.allowance(accounts[1], reserveA.address)).toString(), srcAmount);

      let beforeBalance = await web3.eth.getBalance(accounts[1]);
      let receiveAmount = await reserveA.exchange(isBuy, srcAmount, {from: accounts[1]});
      let afterBalance = await web3.eth.getBalance(accounts[1]);
      assert(afterBalance.toString(), beforeBalance.toString() + srcAmount * buyRate);
      assert(receiveAmount.toString(), srcAmount * buyRate);
    });
  });

});
