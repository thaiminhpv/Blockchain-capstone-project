const Reserve = artifacts.require("./Reserve.sol");
const Token = artifacts.require("./Token.sol");

contract("Reserve contract", (accounts) => {
    const NATIVE_TOKEN = "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee";
    let tokenA, tokenB, reserveA, reserveB, exchange;
    // beforeAll
    before(async () => {
        // console.log("=========== Begin test ===========");
        tokenA = await Token.new("TokenA", "TKA", 18);
        tokenB = await Token.new("TokenB", "TKB", 18);
        
        reserveA = await Reserve.new(tokenA.address, 120, 100);
        reserveB = await Reserve.new(tokenB.address, 350, 380);
        
        let amount = web3.utils.toWei("100", "ether");
        let tokenAmount = web3.utils.toWei("10000", "ether");
        // let amount = 1000
        // send @amount tokenA to reserveA and @amount tokenB to reserveB
        await tokenA.transfer(reserveA.address, tokenAmount, {from: accounts[0]});
        await tokenB.transfer(reserveB.address, tokenAmount, {from: accounts[0]});
        assert.equal((await tokenA.balanceOf(reserveA.address)).toString(), tokenAmount);
        assert.equal((await tokenB.balanceOf(reserveB.address)).toString(), tokenAmount);
        // send @amount ETH to reserveA and @amount ETH to reserveB from accounts[0]
        await web3.eth.sendTransaction({from: accounts[0], to: reserveA.address, value: amount});
        await web3.eth.sendTransaction({from: accounts[0], to: reserveB.address, value: amount});
        assert.equal((await web3.eth.getBalance(reserveA.address)).toString(), amount);
        assert.equal((await web3.eth.getBalance(reserveB.address)).toString(), amount);
    });
    
    // beforeEach
    beforeEach(async () => {
    });
    
    describe("Exchange (calling from Exchange contract)", () => {
        it("Buy tokenA with ETH", async () => {
            isBuy = true;
            srcAmount = web3.utils.toWei("0.3", "ether");  // using 3 ETH to buy tokenA
            buyRate = 100;
            sellRate = 200;
            
            await reserveA.setExchangeRates(buyRate, sellRate);
            let rate = await reserveA.getExchangeRate(isBuy, srcAmount);
            assert(rate != 0, "Run out of tokenA");
            assert.equal(rate, buyRate, "Exchange rate should be set correctly");
            
            // buy tokenA with srcAmount Ether
            let receiveAmount = await reserveA.exchange(isBuy, srcAmount, {from: accounts[1], value: srcAmount});
            let allowance = await tokenA.allowance(reserveA.address, accounts[1]);
            assert(allowance.toString(), srcAmount * buyRate);
            assert(receiveAmount.toString(), srcAmount * buyRate);
        });
        it("Sell tokenA for ETH", async () => {
            isBuy = false;
            srcAmount = web3.utils.toWei("0.3", "ether");  // using 3 tokenA to sell for Ether
            buyRate = 100;
            sellRate = 200;
            
            // give accounts[1] 5 tokenA
            await tokenA.transfer(accounts[1], web3.utils.toWei("0.5", "ether"));
            
            await reserveA.setExchangeRates(buyRate, sellRate);
            let rate = await reserveA.getExchangeRate(isBuy, srcAmount);
            assert(rate != 0, "Run out of ETH");
            assert.equal(rate, sellRate, "Exchange rate should be set correctly");
            
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
        let amount = web3.utils.toWei("0.3", "ether");
        it("Get BUY exchange rate correctly", async () => {
            await reserveA.setExchangeRates(100, 200);
            assert.equal((await reserveA.getExchangeRate(true, amount)), 100);
        });
        it("Get SELL exchange rate correctly", async () => {
            await reserveA.setExchangeRates(100, 200);
            assert.equal((await reserveA.getExchangeRate(false, amount)), 200);
        });
        it("Get BUY exchange rate correctly via builtin public getter", async () => {
            await reserveA.setExchangeRates(100, 200);
            assert.equal((await reserveA.getExchangeRate(true, amount)), (await reserveA.buyRate()).toNumber());
        });
        it("Get SELL exchange rate correctly via builtin public getter", async () => {
            await reserveA.setExchangeRates(100, 200);
            assert.equal((await reserveA.getExchangeRate(false, amount)), (await reserveA.sellRate()).toNumber());
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

    describe("Withdraw Funds", () => {
        it("Only owner can withdraw funds", async () => {
            try {
                let reserveBalanceBefore = await tokenA.balanceOf(reserveA.address);
                await reserveA.withdrawFunds(tokenA.address, BigInt(reserveBalanceBefore), accounts[1], {from: accounts[1]});
                assert.fail("Only owner can withdraw funds");
            } catch (error) {
                assert.ok(/revert/i.test(error.message));
            }
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
});
