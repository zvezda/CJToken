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
    uint256 public maxCap;

    /**
    * event for token purchase logging
    * @param purchaser who paid for the tokens
    * @param beneficiary who got the tokens
    * @param value weis paid for purchase
    * @param amount of tokens purchased
    */
    event TokenPurchase(address indexed purchaser, address indexed beneficiary, uint256 value, uint256 amount);

    function Crowdsale(address _CJTokenAddress, address _to, uint256 _maxCap) {
        coin = CJToken(_CJTokenAddress);
        multisigVault = _to;
        maxCap = _maxCap;

        // startTime = 1511740800; // new Date("Nov 27 2017 00:00:00 GMT").getTime() / 1000;
        startTime = now; // for testing we use now
        endTime = startTime + 41 days; // ICO end on Jan 07 2018 00:00:00 GMT
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
    function setMultiSigVault(address _multisigVault) public onlyOwner {
        require(_multisigVault != address(0));
        multisigVault = _multisigVault;
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

    // Finalize crowdsale buy burning the remaining tokens
    // can only be called when the ICO is over
    function finalizeCrowdsale() {
        require(now > endTime || tokensSold >= maxCap);
        coin.burn(coin.balanceOf(this));
    }
}
