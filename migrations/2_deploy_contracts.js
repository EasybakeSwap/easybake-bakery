const OvenToken = artifacts.require('OvenToken.sol');
const MasterChef = artifacts.require('MasterChef.sol');
const SugarBar = artifacts.require('SugarBar.sol');
const OvenVault = artifacts.require('OvenVault.sol');

module.exports = async function(deployer) {

  // Deploy Oven Token Contract
  await deployer.deploy(OvenToken)
  const ovenToken = await OvenToken.deployed()
  await ovenToken.mint(process.env.ADMIN_ADDRESS, web3.utils.toWei('50000000000000000', 'gwei'))

  // Deploy Sugar Token Contract
  await deployer.deploy(SugarBar, ovenToken.address)
  const sugarToken = await SugarBar.deployed()

// Deploy MasterChef Contract
  await deployer.deploy(
    MasterChef,
    ovenToken.address,
    sugarToken.address,
    process.env.ADMIN_ADDRESS, // Your address where you get OVEN tokens - should be a multisig
    process.env.TREASURY_ADDRESS, // Your address where you collect fees - should be a multisig
    '1620819000', // process.env.START_TIME, // Block timestamp when token baking begins
  )
  const masterChef = await MasterChef.deployed()

// Deploy OvenVault Contract
await deployer.deploy(
  OvenVault,
  ovenToken.address, // TOKEN
  sugarToken.address, // RECEIPT TOKEN
  masterChef.address, // MASTERCHEF
  process.env.ADMIN_ADDRESS, // Your address where you get OVEN tokens - should be a multisig
  process.env.TREASURY_ADDRESS, // Your address where you collect fees - should be a multisig
)

  // Make MasterChef contract token owner for ovenToken and sugarToken
  await ovenToken.transferOwnership(masterChef.address)
  await sugarToken.transferOwnership(masterChef.address)


// // // ADD | Bakery Pools | RINKEBY
//   await masterChef.add(
//     10,
//     process.env.LP_TOKEN_ADDRESS, // DELETE WHEN MAINNET
//     false
//   )

}
