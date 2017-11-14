//ERC20 Token
pragma solidity 0.4.15;

import './BurnableToken.sol';
import './Ownable.sol';

contract CJToken is BurnableToken, Ownable {

    string public constant name = "ConnectJob";
    string public constant symbol = "CJT";
    uint public constant decimals = 18;
    uint256 public constant initialSupply = 1692000000 * (10 ** uint256(decimals));

    // Constructor
    function CJToken() {
        totalSupply = initialSupply;
        balances[msg.sender] = initialSupply; // Send all tokens to owner
    }
}
