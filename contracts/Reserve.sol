/*
There are 2 main smart contracts: Reserve and Exchange.

Contract Reserve:
  Funds: Funds (token + ETH) are stored in Reserve.
  Owner: Reserve will have an owner that can withdraw funds (e.g withdrawFunds(token, amount, destAddress)) and set some basic data like buy/sell rates.
  Supported Token: Reserve should store its supported token to allow user exchanges between ETH and that token. Supported token should be initialised in Reserve’s constructor and can not be changed.
  Set Exchange Rates: We can fix the rates (simple version), however it will be better if rates can be adjustable. As the result, Reserve should have a function to adjust exchange rates, for example setExchangeRates(buyRate, sellRate): buyRate is how many tokens we can buy using 1 ETH, sellRate is how many ETH we will receive when selling 1 token. For example, if we can buy 180 tokens using 1 ETH, and sell 200 tokens to get 1 ETH, then buyRate: 180, sellRate: 1/200=0.005. However, it’s up to you to decide, you can also define buyRate is how many tokens you can buy using 1 ETH, and sellRate is how many tokens you need to sell to get 1 ETH. In the example above, buyRate: 180, sellRate: 200. Exchange rates can be the same or different for different traded amounts that user wants.
  Get Exchange Rates: Reserve also needs to provide a function to get buy/sell rate given traded amount, for example: getExchangeRate(isBuy, srcAmount). Please note that if reserve doesn’t have enough funds, the exchange rate should be 0.
  Exchange Tokens: Reserve must have a function to allow exchange ETH with its supported token and vice versa, for example: exchange(isBuy, srcAmount). In case buying, this function must allow receiving ETH from user, and send token back to user sender. In case selling, this function must allow receiving collect token from user sender, and send ETH back to user sender based on current exchange rate. When buying, ETH will be transferred in the function call, so Reserve must verify that correct amount of ETH has been transferred to Reserve, i.e verify msg.value == srcAmount. When selling, Reserve should collect srcAmount tokens from sender by using transferFrom function in the token’s contract. Note: to be able calling this transferFrom, Exchange’s contract must approve Reserve’s contract to take token from the Exchange’s contract. You can either call approve function when addReserve, or before calling Reserve.exchange (check out allowance, approve, transferFrom functions in token contract for more details). Please check that the reserve still has enough assets to do the exchange.

Contract Exchange:
  Interactions: User will interact with Exchange contract to exchange tokens. Exchange contract will interact with Reserves to get rates and exchange tokens.
  Add/Remove reserves: Exchange needs to have an owner that can add or remove Reserves, for example: addReserve(reserve, token, isAdd). As 1 token is only supported by 1 reserve, we can use mapping (token => reserve).
  Get Exchange Rates: Exchange needs to provide a function to get exchange rate between 2 tokens given tokens’ addresses and source amount, for example: getExchangeRate(srcToken, destToken, srcAmount).
  Exchange Tokens: Exchange must have a function to allow exchange between tokens where user can call to perform an exchange request. That function must have srcToken, destToken, srcAmount. For example: exchange(srcToken, destToken, srcAmount). We must check if exact srcAmount of srcToken is taken from the user's wallet, and exact amount of destToken that user’s received based on exchange rate at that time. Please note that this function must be able to receive ETH. In case srcToken == ETH, Exchange must verify that correct amount is sent when user calls the exchange function, i.e msg.value == srcAmount, otherwise, Exchange should use transferFrom function to collect srcAmount tokens from sender’s wallet. Note: to be able calling this transferFrom, user’s wallet must approve Exchange’s contract to take token from the user’s wallet (check out allowance, approve, transferFrom functions in token contract for more details). This is to make sure that collect srcAmount of srcToken has been transferred from sender’s wallet to Exchange’s contract. In side exchange function, it should call Reserve’s exchange function to swap tokens with Reserve, and then transfer back correct amount it has received from Reserve to sender.

An example of a correct flow (assuming user exchanges X tokenA to Y ETH):
  - X tokenA is transferred from user’s wallet to Exchange by calling exchange function in Exchange’s contract.
  - X tokenA is transferred from Exchange to Reserve by calling exchange function in Reserve’s contract.
  - Reserve transfers back Y ETH to Exchange (in exchange function of Reserve’s contract).
  - Exchange transfers Y ETH back to user’s wallet (in exchange function of Exchange’s contract).
*/


// SPDX-License-Identifier: MIT
pragma solidity ^0.4.17;

import "./ERC20.sol";
import "./utils.sol";

/**
  * @title Reserve
  * @dev Reserve contract for exchanging ETH with supported token
 */
contract Reserve {

    /// @dev Reserve owner: the address that can call withdrawFunds and setExchangeRates
    address public owner;

    ERC20 public supportedToken;
    uint256 public buyRate;
    uint256 public sellRate;

    /**
      * @dev Reserve constructor
      * @param _supportedToken address of supported token
     */
    constructor(address _supportedToken) {
        owner = msg.sender;
        supportedToken = ERC20(_supportedToken);
    }

    modifier onlyOwner(string memory _message) {
        require(msg.sender == owner, StringUtil.concat("Only owner can ", _message));
        _;
    }

    /**
      * @dev Withdraw funds from Reserve
      * @param _token address of token to withdraw
      * @param _amount amount of token to withdraw
      * @param _destAddress address to send withdrawn funds to
     */
    function withdrawFunds(address _token, uint256 _amount, address _destAddress) public onlyOwner("withdraw funds") {
        // transfer all token and ETH to destAddress
        if (_token == address(0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee)) {
          // ETH
          _destAddress.transfer(_amount);
        } else if (_token == address(supportedToken)) {
          // supported token
          supportedToken.transfer(_destAddress, _amount);
        } else {
          // other tokens
          ERC20(_token).transfer(_destAddress, _amount);
        }
    }

    /**
      * @dev Set exchange rates
      * @param _buyRate buyRate is how many tokens we can buy using 1 ETH, 
      * @param _sellRate sellRate is how many ETH we will receive when selling 1 token
     */
    function setExchangeRates(uint256 _buyRate, uint256 _sellRate) public onlyOwner("set exchange rates") {
        buyRate = _buyRate;
        sellRate = _sellRate;
    }

    /**
      * @dev Get exchange rate
      * @param isBuy buy or sell
      * @param srcAmount source amount
      * @return exchangeRate exchange rate
     */
    function getExchangeRate(bool isBuy, uint256 srcAmount) public view returns (uint256) {
        if (!hasEnoughFund(isBuy, srcAmount)) return 0;
        return isBuy ? buyRate : sellRate;
    }

    /**
      * @dev Exchange ETH with supported token
      * @param isBuy buy or sell
      * @param srcAmount source amount
     */
    function exchange(bool isBuy, uint256 srcAmount) public payable returns (uint256 sendBackAmount) {
        // msg.sender is Exchange contract
        uint256 rate = getExchangeRate(isBuy, srcAmount);
        require(rate > 0, "no exchange rate");
        if (isBuy) {
            // receive ETH from user, and send token back to user
            require(hasEnoughFund(isBuy, srcAmount), "not enough fund");
            require(msg.value == srcAmount, "wrong amount of ETH");

            // this Contract receive ETH from user
            // can this be omitted! https://ethereum.stackexchange.com/questions/30868/where-does-the-rest-of-msg-value-go
            address(this).transfer(msg.value);  // store msg.value ETH to address(this)
            
            // send token from this Smart Contract fund to user
            supportedToken.approve(msg.sender, srcAmount * rate);
        } else {
            // selling
            // receive `srcAmount` token from user, and send ETH back to user
            require(hasEnoughFund(isBuy, srcAmount), "not enough fund");
            
            // Exchange contract should call approve function to allow Reserve to take token from Exchange contract
            // this Contract receive token from user
            supportedToken.transferFrom(msg.sender, address(this), srcAmount);

            // send ETH from this Smart Contract fund to user
            // msg.sender.transfer(srcAmount * rate); // transer srcAmount * rate ETH to msg.sender
            msg.sender.transfer(srcAmount * rate);  // approve Exchange contract to take ETH from this Smart Contract, then transfer to User's wallet
        }
        return srcAmount * rate;
    }

    /**
      * @dev Check if reserve has enough funds to do exchange
      * @param isBuy buy or sell
      * @param srcAmount source amount
      * @return hasEnoughFund true if reserve has enough funds
     */
    function hasEnoughFund(bool isBuy, uint256 srcAmount) internal view returns (bool) {
        if (isBuy) {
          supportedToken.balanceOf(address(this)) >= srcAmount * buyRate;
        } else {
            return address(this).balance >= srcAmount * sellRate;
        }
    }
}