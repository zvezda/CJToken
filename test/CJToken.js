var CJToken = artifacts.require("./CJToken.sol");
var Crowdsale = artifacts.require("./Crowdsale.sol");

var eth = web3.eth;
var owner = eth.accounts[0];
var wallet = eth.accounts[1];
var buyer = eth.accounts[2];
var thief = eth.accounts[3];

const timeTravel = function (time) {
    return new Promise((resolve, reject) => {
        web3.currentProvider.sendAsync({
            jsonrpc: "2.0",
            method: "evm_increaseTime",
            params: [time], // 86400 is num seconds in day
            id: new Date().getTime()
        }, (err, result) => {
            if(err){ return reject(err) }
                return resolve(result)
            });
    })
}

const mineBlock = function () {
    return new Promise((resolve, reject) => {
        web3.currentProvider.sendAsync({
            jsonrpc: "2.0",
            method: "evm_mine"
        }, (err, result) => {
            if(err){ return reject(err) }
            return resolve(result)
        });
    })
}

var printBalance = async function() {
    const ownerBalance = web3.eth.getBalance(owner);
    const walletBalance = web3.eth.getBalance(wallet);
    const buyerBalance = web3.eth.getBalance(buyer);
    const crowdsaleBalance = web3.eth.getBalance(Crowdsale.address);

    let token = await CJToken.deployed();
    let balance = await token.balanceOf.call(owner);
    console.log("Owner balance: ", web3.fromWei(ownerBalance, "ether").toString(), " ETHER / ", balance.valueOf(), " CJT");
    balance = await token.balanceOf.call(buyer);
    console.log("Buyer balance: ", web3.fromWei(buyerBalance, "ether").toString(), " ETHER / ", balance.valueOf(), " CJT");
    balance = await token.balanceOf.call(Crowdsale.address);
    console.log("Crowdsale balance: ", web3.fromWei(crowdsaleBalance, "ether").toString(), " ETHER / ", balance.valueOf(), " CJT");
    balance = await token.balanceOf.call(wallet);
    console.log("wallet balance: ", web3.fromWei(walletBalance, "ether").toString(), " ETHER / ", balance.valueOf(), " CJT");
}

contract('ICO', function(accounts) {
    var investEther = async function(sum) {
        var investSum = web3.toWei(sum, "ether");

        let ico = await Crowdsale.deployed();
        let txn = await ico.sendTransaction({from: buyer, to: ico.address, value: investSum});
        let token = await CJToken.deployed();
        let balance = await token.balanceOf.call(buyer);
        return balance;
    }

    it("should remain 0 CJToken in the first account", async function() {
        await printBalance();
        let token = await CJToken.deployed();
        let balance = await token.balanceOf.call(owner);
        assert.equal(balance.valueOf(), 0, "0 wasn't in the first account");
    });

    it("should have 1,692,000,000 CJToken in Crowdsale contract", async function() {
        let token = await CJToken.deployed();
        let balance = await token.balanceOf.call(Crowdsale.address);
        assert.equal(balance.valueOf(), 1692000000000000000000000000, "1,692,000,000.000000 wasn't in the Crowdsale account")
  });

  it("Should not Buy less than 1000 tokens", async function() {
      try {
          let balance = await investEther(0.1);
      } catch (e) {
          return true;
      }

      throw new Error("I should never see this!")
  });

  it("Should Buy 2400 tokens + 5% on day 1 -> 2520 tokens", async function() {
      let balance = await investEther(1);
      assert.equal(balance.valueOf(), 2520000000000000000000, "2520 wasn't in the buyer account.");
  });

  it("Should Buy 2400 tokens + 4% on day 2 -> 2496 tokens", async function() {
      await timeTravel(86400 * 1); // 1 day later
      await mineBlock(); // workaround for https://github.com/ethereumjs/testrpc/issues/336
      let balance = await investEther(1);
      assert.equal(balance.valueOf(), 5016000000000000000000, "5016 wasn't in the buyer account.");
  });

  it("Should Buy 2400 tokens + 3% on day 3 -> 2472 tokens", async function() {
      await timeTravel(86400 * 1); // 1 day later
      await mineBlock(); // workaround for https://github.com/ethereumjs/testrpc/issues/336
      let balance = await investEther(1);
      assert.equal(balance.valueOf(), 7488000000000000000000, "7488 wasn't in the buyer account.");
  });

  it("Should Buy 2400 tokens + 2% on day 4 -> 2448 tokens", async function() {
      await timeTravel(86400 * 1); // 1 day later
      await mineBlock(); // workaround for https://github.com/ethereumjs/testrpc/issues/336
      let balance = await investEther(1);
      assert.equal(balance.valueOf(), 9936000000000000000000, "9936 wasn't in the buyer account.");
  });

  it("Should Buy 2400 tokens + 1% on day 5 -> 2424 tokens", async function() {
      await timeTravel(86400 * 1); // 1 day later
      await mineBlock(); // workaround for https://github.com/ethereumjs/testrpc/issues/336
      let balance = await investEther(1);
      assert.equal(balance.valueOf(), 12360000000000000000000, "12360 wasn't in the buyer account.");
  });

  it("Should Buy 2400 tokens without any bonus after day 5", async function() {
      await timeTravel(86400 * 1); // 1 day later
      await mineBlock(); // workaround for https://github.com/ethereumjs/testrpc/issues/336
      let balance = await investEther(1);
      assert.equal(balance.valueOf(), 14760000000000000000000, "14760 wasn't in the buyer account.");
  });


});
