const factory = require('EasyBakeFactory.sol');
const router = artifacts.require('EasyBakeRouter.sol');
const WETH = artifacts.require('WETH.sol');
const MockERC20 = artifacts.require('MockERC20.sol');
const OvenToken = artifacts.require('OvenToken.sol') 
const MasterChef = artifacts.require('MasterChef.sol'); 

module.exports = async function(deployer, _network, addresses) {
    const [admin, _] = addresses;
  
    await deployer.deploy(WETH);
    const weth = await WETH.deployed();
    const tokenA = await MockERC20.new('Token A', 'TKA', web3.utils.toWei('1000'));
    const tokenB = await MockERC20.new('Token B', 'TKB', web3.utils.toWei('1000'));
  
    await deployer.deploy(Factory, admin);
    const factory = await Factory.deployed();
    await factory.createPair(weth.address, tokenA.address);
    await factory.createPair(weth.address, tokenB.address);
    await deployer.deploy(Router, factory.address, weth.address);
    const router = await Router.deployed();
  
    await deployer.deploy(OvenToken);
    const ovenToken = await OvenToken.deployed();

// Deploy MasterChef Contract
  await deployer.deploy(
    MasterChef,
    ovenToken.address,
    admin, // Your address where you get OVEN tokens - should be a multisig
    process.env.TREASURY_ADDRESS, // Your address where you collect fees - should be a multisig
    web3.utils.toWei(process.env.TOKENS_PER_BLOCK), // Number of tokens rewarded per block, e.g., 100
    process.env.START_BLOCK, // Block number when token mining starts
    process.env.BONUS_END_BLOCK // Block when bonus ends
  )
 
// Make MasterChef contract token owner
  const masterChef = await MasterChef.deployed()
  await ovenToken.transferOwnership(masterChef.address)

// ADD | Bakery Pools | RINKEBY
  await masterChef.add(
    process.env.ALLOCATION_POINT_OVEN,
    process.env.LP_TOKEN_ADDRESS, // DELETE WHEN MAINNET
    process.env.TAX_RATE,
    false
  )

}
