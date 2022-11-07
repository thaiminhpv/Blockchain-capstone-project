const ReserveTest = artifacts.require("ReserveTest");

/*
 * uncomment accounts to access the test accounts made available by the
 * Ethereum client
 * See docs: https://www.trufflesuite.com/docs/truffle/testing/writing-tests-in-javascript
 */
contract("ReserveTest", function (/* accounts */) {
  it("should assert true", async function () {
    await ReserveTest.deployed();
    return assert.isTrue(true);
  });
});
