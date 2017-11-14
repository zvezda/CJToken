var CJToken = artifacts.require("./CJToken.sol");
var Crowdsale = artifacts.require("./Crowdsale.sol");

module.exports = function(deployer) {
    //owner of the crowdsale
	var owner = web3.eth.accounts[0];
	//wallet where ether is deposited
	var multiSigWallet = web3.eth.accounts[1];
	// reserve wallet where 35% of tokens are deposited
	var reserveWallet = "0x2Df02bb8cB3709851d72FEbE917b09DB35800D62";

	// Amount of token to transfer to crowdsale contract
	var totalSupply       = 1692000000,
		  totalTokenForSale = 1100000000,
			// preICO tokens will be kept in owner wallet until distributed
			preIcoTokensSold  = 11500000, // need to be set when presale is over
			maxCap            = totalTokenForSale - preIcoTokensSold,
			reserveAmount     = totalSupply - totalTokenForSale;

	console.log("Owner address: " + owner);
	console.log("multiSigWallet address: " + multiSigWallet);

    //deploy the CJToken using the owner account
  	return deployer.deploy(CJToken, { from: owner }).then(function() {
  		//log the address of the CJToken
  		console.log("CJToken address: " + CJToken.address);
  		//deploy the Crowdsale contract
  		return deployer.deploy(Crowdsale, CJToken.address, multiSigWallet, web3.toWei(maxCap), { from: owner }).then(function() {
  			console.log("Crowdsale address: " + Crowdsale.address);
  			return CJToken.deployed().then(function(token) {
					return Crowdsale.deployed().then(function(crowdsale) {

						// send token to crowdsale contract
						return token.transfer(Crowdsale.address, web3.toWei(maxCap), {from: owner}).then(function () {
							return token.balanceOf.call(Crowdsale.address).then(function (Cbalance) {

								// send reserve tokens
								return token.transfer(reserveWallet, web3.toWei(reserveAmount), {from: owner}).then(function () {
									return token.balanceOf.call(reserveWallet).then(function (Rbalance) {
										console.log("Crowdsale CJT balance: " + web3.fromWei(Cbalance, "ether"));
										console.log("Reserve CJT balance: " + web3.fromWei(Rbalance, "ether"));
									});
								});
							});
						});
  				});
  			});
  		});
		});

};
