// SPDX-License-Identifier: MIT
pragma solidity ^0.4.17;

import "./Reserve.sol";
import "./ERC20.sol";

contract Exchange {

    /// @dev Exchange owner: the address that can call addReserve and removeReserve
    address public owner;

    /// @dev Mapping from token to reserve
    mapping (address => Reserve) public reserves;

    /**
      * @dev Exchange constructor
     */
    constructor() {
        owner = msg.sender;
    }

    /**
      * @dev Add or remove reserve
      * @param reserve reserve address
      * @param token supported token address
      * @param isAdd true if add, false if remove
     */
    function addReserve(address reserve, address token, bool isAdd) public {
        require(msg.sender == owner, "only owner can add/remove reserve");
        if (isAdd) {
            reserves[token] = Reserve(reserve);  // look up the reserve contract object from its address
        } else {
            delete reserves[token];
        }
    }

    /**
      * @dev Get exchange rate between 2 tokens
      * @param srcToken source token address
      * @param destToken destination token address
      * @param srcAmount source amount
      * @return exchangeRate exchange rate
     */
    function getExchangeRate(address srcToken, address destToken, uint256 srcAmount) public view returns (uint256) {
        Reserve srcReserve = reserves[srcToken];
        Reserve destReserve = reserves[destToken];
        if (srcReserve == address(0) || destReserve == address(0)) return 0;
        uint256 srcRate = srcReserve.getExchangeRate(false, srcAmount);
        uint256 destRate = destReserve.getExchangeRate(true, srcAmount);
        return srcRate * destRate;
    }

    /**
      * @dev Exchange tokens
      * @param srcToken source token address
      * @param destToken destination token address
      * @param srcAmount source amount
     */
    function exchange(address srcToken, address destToken, uint256 srcAmount) public payable {
        Reserve srcReserve = reserves[srcToken];
        Reserve destReserve = reserves[destToken];
        require(srcReserve != address(0) && destReserve != address(0), "reserve not found");
        require(srcReserve.supportedToken() == srcToken && destReserve.supportedToken() == destToken, "invalid reserve");
        // if srcToken is ETH
        if (srcToken == address(0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee)) {
            require(msg.value == srcAmount, "msg.value != srcAmount");
        } else if (destToken == address(0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee)) { 
            /*
            ○ X tokenA is transferred from user’s wallet to Exchange by calling exchange function in Exchange’s contract.
            ○ X tokenA is transferred from Exchange to Reserve by calling exchange function in Reserve’s contract.
            ○ Reserve transfers back Y ETH to Exchange (in exchange function of Reserve’s contract).
            ○ Exchange transfers Y ETH back to user’s wallet (in exchange function of Exchange’s contract).
            */
            require(msg.value == 0, "msg.value != 0");
            ERC20 _token = ERC20(srcToken);
            _token.transferFrom(msg.sender, this, srcAmount);
            _token.approve(srcReserve.address, srcAmount);
            srcReserve.exchange(srcToken, destToken, srcAmount);
            // receivedAmount = 

        } else {
            // srcToken and destToken are both not ETH
            require(msg.value == 0, "msg.value != 0");

        }
    }
}
