pragma solidity ^0.4.17;

import "./ERC20.sol";

contract Token is StandardToken {

    string public name;
    string public symbol;
    uint public decimals = 18;
    uint public INITIAL_SUPPLY = 10**(50+18);

    function Token(string _name, string _symbol, uint _decimals) public {
        totalSupply = INITIAL_SUPPLY;
        balances[msg.sender] = INITIAL_SUPPLY;
        name = _name;
        symbol = _symbol;
        decimals = _decimals;
    }

}