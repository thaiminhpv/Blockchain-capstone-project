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
        it("Remove reserve", async () => {
            await exchange.addReserve(reserveA.address, tokenA.address, false);
            await exchange.addReserve(reserveB.address, tokenB.address, false);

            assert.equal((await exchange.reserves(tokenA.address)).toString(), "0x0000000000000000000000000000000000000000");
            assert.equal((await exchange.reserves(tokenB.address)).toString(), "0x0000000000000000000000000000000000000000");
        });
        it("Add reserve", async () => {
            await exchange.addReserve(reserveA.address, tokenA.address, true);
            await exchange.addReserve(reserveB.address, tokenB.address, true);

            assert.equal((await exchange.reserves(tokenA.address)).toString(), reserveA.address);
            assert.equal((await exchange.reserves(tokenB.address)).toString(), reserveB.address);
        });
    });

    describe("Exchange rates between 2 tokens", () => {
        it("Get exchange rate", async () => {
            let srcAmount = 1_000_000;
            // sell 1_000_000 tokenA for 2_500_000 tokenB
            // first, sell 1_000_000 tokenA for 1_000_000 / 200 = 5_000 Ether
            // then, sell 5_000 Ether for 5_000 * 500 = 2_500_000 tokenB
            // rate = 500 / 200 = 2.5

            await reserveA.setExchangeRates(100, 200);
            await reserveB.setExchangeRates(500, 700);

            assert.equal(await reserveA.getExchangeRate(true, srcAmount), 100);
            assert.equal(await reserveB.getExchangeRate(false, srcAmount), 700);

            const rateAB = await exchange.getExchangeRate(tokenA.address, tokenB.address, srcAmount);
            const rateBA = await exchange.getExchangeRate(tokenB.address, tokenA.address, srcAmount);
            assert.equal(rateAB, 500 * 1e18 / 200);
            assert.equal(rateBA, 100 * 1e18 / 700);
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
