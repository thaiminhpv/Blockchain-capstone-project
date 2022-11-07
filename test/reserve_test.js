const Reserve = artifacts.require("./Reserve.sol");

/*
 * Ethereum client
 * See docs: https://www.trufflesuite.com/docs/truffle/testing/writing-tests-in-javascript
 */
let reserve;
contract("Reserve contract", (accounts) => {
  describe("Contract deployment", () => {
    it("Contract deployment", async function () {
      // reserve = await Reserve.deployed();
      // assert(reserve !== undefined, "Contract deployment failed");
    });
  });
});
