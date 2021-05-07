const OvenToken = artifacts.require('OvenToken.sol');
const MasterChef = artifacts.require('MasterChef.sol');
const SugarBar = artifacts.require('SugarBar.sol');

module.exports = async function(deployer, addresses) {

  // Deploy Oven Token Contract
  await deployer.deploy(OvenToken)
  const ovenToken = await OvenToken.deployed()

  // Deploy Sugar Token Contract
  await deployer.deploy(SugarBar, ovenToken.address)
  const sugarToken = await SugarBar.deployed()

// Deploy MasterChef Contract
  await deployer.deploy(
    MasterChef,
    ovenToken.address,
    sugarToken.address,
    addresses[0], //  process.env.ADMIN_ADDRESS, // Your address where you get OVEN tokens - should be a multisig
    addresses[0], //  process.env.TREASURY_ADDRESS, // Your address where you collect fees - should be a multisig
    web3.utils.toWei(process.env.TOKENS_PER_BLOCK), // Number of tokens rewarded per block, e.g., 100
    process.env.START_BLOCK // Block number when token mining starts
  )
 
// Make MasterChef contract token owner for ovenToken and sugarToken
  const masterChef = await MasterChef.deployed()
  await ovenToken.transferOwnership(masterChef.address)
  await sugarToken.transferOwnership(masterChef.address)

// // // ADD | Bakery Pools | RINKEBY
//   await masterChef.add(
//     10,
//     process.env.LP_TOKEN_ADDRESS, // DELETE WHEN MAINNET
//     false
//   )

}
