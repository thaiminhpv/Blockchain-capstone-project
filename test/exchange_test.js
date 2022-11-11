const Exchange = artifacts.require("./Exchange.sol");
const Reserve = artifacts.require("./Reserve.sol");
const Token = artifacts.require("./Token.sol");

contract("Exchange contract", function (accounts) {
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

        exchange = await Exchange.deployed();

        await exchange.addReserve(reserveA.address, tokenA.address, true);
        await exchange.addReserve(reserveB.address, tokenB.address, true);
    });

    // beforeEach
    beforeEach(async () => {});

    describe("Contract deployment", () => {
        it("Exchange contract deployment", async () => {
            assert.notEqual(exchange.address, 0x0);
            assert.notEqual(exchange.address, "");
            assert.notEqual(exchange.address, null);
            assert.notEqual(exchange.address, undefined);
        });
    });

    describe("Reserve management", () => {
        it("Only owner can add/remove reserve", async () => {
            try {
                await exchange.addReserve(reserveA.address, tokenA.address, true, {from: accounts[1]}); // should fail
                assert.fail("Only owner can add reserve");
            } catch (error) {
                assert.ok(/revert/i.test(error.message));
            }
            try {
                await exchange.addReserve(reserveA.address, tokenA.address, true, {from: accounts[1]}); // should fail
                assert.fail("Only owner can remove reserve");
            } catch (error) {
                assert.ok(/revert/i.test(error.message));
            }

        });
        it("Add reserve", async () => {
            await exchange.addReserve(reserveA.address, tokenA.address, true);
            await exchange.addReserve(reserveB.address, tokenB.address, true);

            assert.equal((await exchange.reserves(tokenA.address)).toString(), reserveA.address);
            assert.equal((await exchange.reserves(tokenB.address)).toString(), reserveB.address);
        });
        it("Remove reserve", async () => {
            await exchange.addReserve(reserveA.address, tokenA.address, false);
            await exchange.addReserve(reserveB.address, tokenB.address, false);

            assert.equal((await exchange.reserves(tokenA.address)).toString(), "0x0000000000000000000000000000000000000000");
            assert.equal((await exchange.reserves(tokenB.address)).toString(), "0x0000000000000000000000000000000000000000");
        });
    });

    describe("Exchange rates between 2 tokens", () => {
        it("Get exchange rate", async () => {
            let srcAmount = 1000;
            await reserveA.setExchangeRates(100, 200);
            await reserveB.setExchangeRates(500, 700);
            const rateAB = await exchange.getExchangeRate(tokenA.address, tokenB.address, srcAmount);
            const rateBA = await exchange.getExchangeRate(tokenB.address, tokenA.address, srcAmount);
            assert.equal(rateAB.toString(), 200 * 500); // sell 1000 tokenA for 200 ETH, then use 200 ETH to buy 200 * 500 = 100000 tokenB
            assert.equal(rateBA.toString(), 100 * 700); // sell 1000 tokenB for 700 ETH, then use 700 ETH to buy 100 * 700 = 70000 tokenA
        });
    });

    describe("Exchange token with end User", () => {
        it("User use ETH to buy TokenA", async () => {
            let srcAmount = 1000;
            await reserveA.setExchangeRates(100, 200);
            const rate = (await reserveA.buyRate()).toNumber();

            const userBalanceBefore = await web3.eth.getBalance(accounts[1]);
            const userTokenABalanceBefore = (await tokenA.balanceOf(accounts[1])).toNumber();

            await exchange.exchange(NATIVE_TOKEN, tokenA.address, srcAmount, {from: accounts[1], value: srcAmount});

            const userBalanceAfter = await web3.eth.getBalance(accounts[1]);
            const userTokenABalanceAfter = await tokenA.balanceOf(accounts[1]);

            assert(userBalanceAfter.toString() < (userBalanceBefore - srcAmount));
            // console.log("Gas used: ", (userBalanceBefore - srcAmount) - userBalanceAfter);
            assert.equal(userTokenABalanceAfter.toString(), userTokenABalanceBefore + srcAmount * rate);
        });
        
        it("User use TokenA to buy ETH", async () => {
            let srcAmount = 1000;

            // give user 10000 tokenA
            await tokenA.transfer(accounts[1], 10000);

            await reserveA.setExchangeRates(100, 200);
            const rate = (await reserveA.sellRate()).toNumber();

            const userBalanceBefore = await web3.eth.getBalance(accounts[1]);
            const userTokenABalanceBefore = (await tokenA.balanceOf(accounts[1])).toNumber();

            console.log("userBalanceBefore: ", userBalanceBefore);
            console.log("userTokenABalanceBefore: ", userTokenABalanceBefore);
            await tokenA.approve(exchange.address, srcAmount, {from: accounts[1]});
            assert((await tokenA.allowance(accounts[1], exchange.address)).toNumber() >= srcAmount);
            // await tokenA.transfer(exchange.address, srcAmount, {from: accounts[1]});
            await exchange.exchange(tokenA.address, NATIVE_TOKEN, srcAmount, {from: accounts[1]});

            const userBalanceAfter = await web3.eth.getBalance(accounts[1]);
            const userTokenABalanceAfter = (await tokenA.balanceOf(accounts[1])).toNumber();

            console.log("userBalanceAfter: ", userBalanceAfter.toString());
            console.log("userTokenABalanceAfter: ", userTokenABalanceAfter.toString());

            console.log("userTokenABalanceAfter - userTokenABalanceBefore= ", userTokenABalanceAfter, " - ", userTokenABalanceBefore, " = ", userTokenABalanceAfter - userTokenABalanceBefore);
            assert.equal(userTokenABalanceAfter, userTokenABalanceBefore - srcAmount);
        });
    });
});
