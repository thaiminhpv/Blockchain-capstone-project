// SPDX-License-Identifier: MIT
pragma solidity ^0.4.17;

import "./Reserve.sol";
import "./ERC20.sol";
import "./Utils.sol";

/**
    * @title Exchange
    * @dev Exchange contract for bridging between Reserve contract and User's wallet
 */
contract Exchange {
    /// @dev native token address: can be ETH or TOMO
    address public constant NATIVE_TOKEN_ADDRESS = address(0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE);

    /// @dev Exchange owner: the address that can call addReserve and removeReserve
    address public owner;
    bool public trade;

    /// @dev Mapping from token to reserve
    mapping (address => Reserve) public reserves;

    /**
      * @dev Exchange constructor
     */
    constructor() {
        owner = msg.sender;
        trade = true;
    }

    /**
      * @dev Add or remove reserve for a token
      * only owner can call this function
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
      * @dev Get exchange rate * 1e18 between 2 tokens
      * @param srcToken source token address
      * @param destToken destination token address
      * @param srcAmount source amount
      * @return exchangeRate exchange rate * 10^18
     */
    function getExchangeRate(address srcToken, address destToken, uint256 srcAmount) public view returns (uint256) {
        Reserve srcReserve = reserves[srcToken];
        Reserve destReserve = reserves[destToken];
        uint256 srcRate;
        uint256 destRate;

        if (srcReserve != address(0) && destReserve != address(0)) {
            srcRate = srcReserve.getExchangeRate(false, srcAmount);
            destRate = destReserve.getExchangeRate(true, srcAmount);
            return destRate * 1e18 / srcRate;
        } else if (srcReserve != address(0) && destToken == NATIVE_TOKEN_ADDRESS) {
            // selling token for ETH
            srcRate = srcReserve.getExchangeRate(false, srcAmount);
            return 1e18 / srcRate;
        } else if (srcToken == NATIVE_TOKEN_ADDRESS && destReserve != address(0)) {
            // buying token with ETH
            destRate = destReserve.getExchangeRate(true, srcAmount);
            return destRate * 1e18;
        } else {
            revert("reserve not found");
        }
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
        ERC20 src;
        ERC20 dest;
        uint256 sendBackEtherAmount;
        uint256 outTokenAmount;

        require(srcToken != destToken, "srcToken and destToken must be different");
        if (srcToken == NATIVE_TOKEN_ADDRESS) {
            require(msg.value == srcAmount, "msg.value != srcAmount");
            require(destReserve != address(0), "dest reserve not found");
            dest = ERC20(destToken);

            // buy destToken from destReserve
            outTokenAmount = destReserve.exchange.value(msg.value)(true, msg.value);  // transfer ETH from Reserve to Exchange
            assert(dest.allowance(address(destReserve), address(this)) >= outTokenAmount);  // check allowance
            dest.transferFrom(address(destReserve), msg.sender, outTokenAmount);  // transfer destToken from Exchange to User
        } else if (destToken == NATIVE_TOKEN_ADDRESS) { 
            require(msg.value == 0, "msg.value != 0");
            require(srcReserve != address(0), "src reserve not found");
            src = ERC20(srcToken);

            // check allowance
            require(src.allowance(msg.sender, address(this)) >= srcAmount, "allowance not enough");
            src.transferFrom(msg.sender, address(this), srcAmount);  // receive srcToken from user
            require(src.balanceOf(address(this)) >= srcAmount, "balance not enough");
            src.approve(address(srcReserve), srcAmount);  // approve srcReserve to spend srcToken
            sendBackEtherAmount = srcReserve.exchange(false, srcAmount);  // transfer srcToken from Exchange to Reserve

            // forward ETH to User
            msg.sender.transfer(sendBackEtherAmount);
        } else {
            // srcToken and destToken are both not ETH
            require(msg.value == 0, "msg.value != 0");
            src = ERC20(srcToken);
            dest = ERC20(destToken);

            // sell srcToken to srcReserve
            src.transferFrom(msg.sender, address(this), srcAmount);  // receive srcToken from user 
            src.approve(address(srcReserve), srcAmount);  // approve srcReserve to spend srcToken
            sendBackEtherAmount = srcReserve.exchange(false, srcAmount);  // transfer srcToken from Exchange to Reserve
            
            // buy destToken from destReserve
            outTokenAmount = destReserve.exchange.value(sendBackEtherAmount)(true, sendBackEtherAmount);  // transfer ETH from Reserve to Exchange
            require(dest.allowance(address(destReserve), address(this)) >= outTokenAmount, "not enough allowance");  // check allowance
            dest.transferFrom(address(destReserve), msg.sender, outTokenAmount);  // transfer destToken from Exchange to User
        }
    }
    function() external payable {}
}
