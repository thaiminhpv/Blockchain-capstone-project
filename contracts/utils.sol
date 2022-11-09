pragma solidity ^0.4.17;

library StringUtil {
    function concat(string a, string b) internal pure returns (string) {
        return string(abi.encodePacked(a, b));
    }
}
