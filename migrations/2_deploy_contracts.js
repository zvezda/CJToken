var CJToken = artifacts.require("./CJToken.sol");
var Crowdsale = artifacts.require("./Crowdsale.sol");

module.exports = function(deployer) {
    //owner of the crowdsale
	var owner = web3.eth.accounts[0];
	//wallet where ether is deposited
	var wallet = web3.eth.accounts[1];
	// Amount of token to transfer to crowdsale contract
	var tokenICOAmount = 1100000000000000000000000000;

	console.log("Owner address: " + owner);
	console.log("Wallet address: " + wallet);

    //deploy the CJToken using the owner account
  	return deployer.deploy(CJToken, { from: owner }).then(function() {
  		//log the address of the CJToken
  		console.log("CJToken address: " + CJToken.address);
  		//deploy the Crowdsale contract
  		return deployer.deploy(Crowdsale, CJToken.address, wallet, { from: owner }).then(function() {
  			console.log("Crowdsale address: " + Crowdsale.address);
  			return CJToken.deployed().then(function(token) {
				return Crowdsale.deployed().then(function(crowdsale) {
					// send token to crowdsale contract
					return token.transfer(Crowdsale.address, tokenICOAmount, {from: owner}).then(function (txn) {
						return token.balanceOf.call(Crowdsale.address);
					}).then(function (balance) {
				      console.log("Crowdsale CJT balance: " + web3.fromWei(balance, "ether"));
				    });
				});
  			});
  		});
  	});
};
