pragma solidity ^0.4.17;

import "./ERC20.sol";

contract TokenA is StandardToken {

    string public name = "TokenA";
    string public symbol = "TKA";
    uint public decimals = 18;
    uint public INITIAL_SUPPLY = 10**(50+18);

    function TokenA(string _name, string _symbol, uint _decimals) public {
        totalSupply = INITIAL_SUPPLY;
        balances[msg.sender] = INITIAL_SUPPLY;
        name = _name;
        symbol = _symbol;
        decimals = _decimals;
    }

}