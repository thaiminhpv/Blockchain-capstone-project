// SPDX-License-Identifier: MIT
pragma solidity ^0.4.17;

import "./ERC20.sol";
import "./Utils.sol";

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
    bool public trade;

    event ExchangeRatesSet(uint256 buyRate, uint256 sellRate);
    event Log(string message, uint256 value);

    /// @dev native token address: can be ETH or TOMO
    address public constant NATIVE_TOKEN_ADDRESS = address(0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE);

    /**
      * @dev Reserve constructor
      * @param _supportedToken address of supported token
     */
    constructor(address _supportedToken, uint256 _buyRate, uint256 _sellRate) public {
        owner = msg.sender;
        supportedToken = ERC20(_supportedToken);
        trade = true;
        setExchangeRates(_buyRate, _sellRate);
    }

    modifier onlyOwner(string memory _message) {
        require(msg.sender == owner, Utils.concat("Only owner can ", _message));
        _;
    }

    /**
      * @dev Withdraw funds from Reserve
      * only owner can call this function
      * @param _token address of token to withdraw
      * @param _amount amount of token to withdraw
      * @param _destAddress address to send withdrawn funds to
     */
    function withdrawFunds(address _token, uint256 _amount, address _destAddress) public onlyOwner("withdraw funds") {
        // transfer all token and ETH to destAddress
        if (_token == NATIVE_TOKEN_ADDRESS) {
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
      * only owner can call this function
      * @param _buyRate buyRate is how many tokens we can buy using 1 ETH, 
      * @param _sellRate sellRate is how many tokens you need to sell to get 1 ETH
     */
    function setExchangeRates(uint256 _buyRate, uint256 _sellRate) public onlyOwner("set exchange rates") {
        buyRate = _buyRate;
        sellRate = _sellRate;
        emit ExchangeRatesSet(_buyRate, _sellRate);
    }

    /**
      * @dev Get exchange rate
      * @param isBuy buy or sell
      * @param srcAmount source amount
      * @return exchangeRate exchange rate, 0 if reserve doesn't have enough funds
     */
    function getExchangeRate(bool isBuy, uint256 srcAmount) public view returns (uint256) {
        if (!hasEnoughFund(isBuy, srcAmount)) return 0;
        return isBuy ? buyRate : sellRate;
    }

    /**
      * @dev Exchange ETH with supported token
      * @param isBuy buy or sell
      * @param srcAmount the amount of ETH or supported token that user gives
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
            return srcAmount * rate;
        } else {
            // selling
            // receive `srcAmount` token from user, and send ETH back to user
            require(hasEnoughFund(isBuy, srcAmount), "not enough fund");
            uint256 allowance = supportedToken.allowance(msg.sender, address(this));
            require(allowance >= srcAmount, Utils.concats("Not enough allowance, got ", Utils.uint2str(allowance), ", expected ", Utils.uint2str(srcAmount), " instead"));
            uint256 remainingTokenSeller = supportedToken.balanceOf(msg.sender);
            require(remainingTokenSeller >= allowance, Utils.concats("Allowance > user's remain token! User have only ", Utils.uint2str(remainingTokenSeller), " remain tokens, expected >= ", Utils.uint2str(allowance), " "));
            
            // Exchange contract should call approve function to allow Reserve to take token from Exchange contract
            // this Contract receive token from user
            supportedToken.transferFrom(msg.sender, address(this), srcAmount);

            // send ETH from this Smart Contract fund to user
            // transer srcAmount * rate ETH to msg.sender (Exchange contract), then Exchange contract will transfer to User's wallet
            msg.sender.transfer(srcAmount / rate);
            return srcAmount / rate;
        }
    }

    /**
      * @dev Check if reserve has enough funds to do exchange
      * @param isBuy buy or sell
      * @param srcAmount source amount
      * @return hasEnoughFund true if reserve has enough funds
     */
    function hasEnoughFund(bool isBuy, uint256 srcAmount) internal view returns (bool) {
        if (isBuy) {
            uint256 actualRemainAmount = supportedToken.balanceOf(address(this));
            actualRemainAmount += supportedToken.allowance(msg.sender, address(this));
            emit Log(Utils.concats("Not enough token to buy, got ", Utils.uint2str(actualRemainAmount), ", expected ", Utils.uint2str(srcAmount * buyRate), " instead"), 0);
            return actualRemainAmount >= (srcAmount * buyRate);
        } else {
            emit Log(Utils.concats("Not enough ETH to sell, got ", Utils.uint2str(address(this).balance), ", expected ", Utils.uint2str(srcAmount / sellRate), " instead"), 0);
            return address(this).balance >= (srcAmount / sellRate);
        }
    }

    function balanceETH() public view returns (uint256) {
        return address(this).balance;
    }

    function balanceToken() public view returns (uint256) {
        return supportedToken.balanceOf(address(this));
    }

    function() external payable {}
}