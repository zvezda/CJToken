pragma solidity ^0.4.12;

import "./CJToken.sol";

contract Crowdsale is Ownable {
    using SafeMath for uint256;

    // address where funds are collected
    address public multisigVault;

    CJToken public coin;

    // start and end timestamps where investments are allowed (both inclusive)
    uint256 public startTime;
    uint256 public endTime;
    // amount of raised money in wei
    uint256 public weiRaised;
    // amount of tokens sold
    uint256 public tokensSold;
    // max amount of token for sale during ICO
    uint256 public maxCap = 1100000000 * 10**18;

    /**
    * event for token purchase logging
    * @param purchaser who paid for the tokens
    * @param beneficiary who got the tokens
    * @param value weis paid for purchase
    * @param amount of tokens purchased
    */
    event TokenPurchase(address indexed purchaser, address indexed beneficiary, uint256 value, uint256 amount);

    function Crowdsale(address _CJTokenAddress, address _to) {
        coin = CJToken(_CJTokenAddress);
        multisigVault = _to;

        // startTime = 1509840000; // new Date("Nov 05 2017 00:00:00 GMT").getTime() / 1000;
        startTime = now; // for testing we use now
        endTime = startTime + 39 days; // ICO duration = 39 days
    }

    modifier isStarted() {
      require(now > startTime && now < endTime);
      _;
    }

    // fallback function can be used to buy tokens
    function () isStarted payable {
        buyTokens(msg.sender);
    }

    // allow owner to modify address of wallet
    function setWallet(address _multisigVault) public onlyOwner {
        if (_multisigVault != address(0)) {
            multisigVault = _multisigVault;
        }
    }

    // compute amount of token based on 1 ETH = 2400 CJT
    function getTokenAmount(uint256 _weiAmount) internal returns(uint256) {
        uint256 tokens = _weiAmount.mul(2400);
        // cannot buy less than 1000 tokens
        if (tokens < 1000 * (10 ** 18)) {
            return 0;
        }

        // compute first days bonus
        if(now < startTime + 1*24*60* 1 minutes) {
            tokens += (tokens * 15) / 100;
        } else if(now < startTime + 2*24*60* 1 minutes) {
            tokens += (tokens * 12) / 100;
        } else if(now < startTime + 3*24*60* 1 minutes) {
            tokens += (tokens * 9) / 100;
        } else if(now < startTime + 4*24*60* 1 minutes) {
            tokens += (tokens * 6) / 100;
        } else if(now < startTime + 5*24*60* 1 minutes) {
            tokens += (tokens * 3) / 100;
        }

        return tokens;
    }

    // low level token purchase function
    function buyTokens(address beneficiary) payable {
        require(beneficiary != 0x0);
        require(validPurchase());

        uint256 weiAmount = msg.value;

        // calculate token amount to be sent
        uint256 tokens = getTokenAmount(weiAmount);
        require(tokens > 0);

        // update state
        weiRaised = weiRaised.add(weiAmount);

        tokensSold = tokensSold.add(tokens);
        require(tokensSold <= maxCap);

        coin.transfer(beneficiary, tokens);
        TokenPurchase(msg.sender, beneficiary, weiAmount, tokens);
        multisigVault.transfer(msg.value);
    }

    // @return true if the transaction can buy tokens
    function validPurchase() internal constant returns (bool) {
        bool withinPeriod = now >= startTime && now <= endTime;
        bool nonZeroPurchase = msg.value != 0;
        return withinPeriod && nonZeroPurchase;
    }

    // @return true if crowdsale event has ended
    function hasEnded() public constant returns (bool) {
        return now > endTime || tokensSold >= maxCap;
    }

    // send reserve tokens (35% of the sold amount) to the multisig wallet and burn the rest
    // can only be called when the ICO is over
    function sendReserveTokens() onlyOwner {
        require(now > endTime || tokensSold >= maxCap);
        uint256 _amount = tokensSold.mul(35).div(65);
        uint256 burnAmount = coin.balanceOf(this) - _amount;
        coin.transfer(multisigVault,_amount);
        coin.burn(burnAmount);
    }
}
