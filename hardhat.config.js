/**
 * @type import('hardhat/config').HardhatUserConfig
 */
 require('hardhat/config')
 require('dotenv').config()
 require("@nomiclabs/hardhat-etherscan")
 require("@nomiclabs/hardhat-ethers")
 require("hardhat-deploy-ethers")
 require('@openzeppelin/hardhat-upgrades')
 
 
 
 task(
   "deploy",
   "Deploy your MasterChef contract",
   async (_, { ethers, upgrades }) => {
   
     const artifact = await ethers.getContractFactory("MasterChef");
     const contract = await upgrades.deployProxy(artifact,["YOU CONSTRUCTOR ARGUMENT HERE"]);
     
     console.log('YOUR PROXY ADDRESS :', contract.address)
     console.log('⚠️ Deployment of your main proxy successful. Please Copy the Proxy address to your hardhat-config.js file before continuing.')
     
     // after deployment you should pass the ownership to the Gnosis Vault
  
   }
 );
 
 task(
   "upgrade",
   "Upgrade your contract",
   async (_, { ethers, upgrades }) => {
     const artifact = await ethers.getContractFactory("MIDT");
     const contract = await upgrades.upgradeProxy('0xFBf6fF92a0f66a5DB93E03d8D2C1368d79907138', artifact,['MadeInDreams Token', 'MIDT', 2, process.env.MY_ADDRESS]);
     contract.setBalance()
     console.log('MIDT Updated to V2')
 
   }
 )
 
 
 /**
  * @type import('hardhat/config').HardhatUserConfig
  */
  module.exports = {
   defaultNetwork: "rinkeby",
   networks: {
     hardhat: {
       forking: {
         url: "https://eth-mainnet.alchemyapi.io/v2/" + process.env.ALCHEMY_KEY,
         blockNumber: 12376904
       }
       
     },
     binance: {
       url: "https://data-seed-prebsc-1-s1.binance.org:8545",
       chainId: 97,
       gasPrice: 20000000000,
       accounts: {mnemonic: process.env.MNEMONIC}
     },
     rinkeby: {
       url: "https://rinkeby.infura.io/v3/" + process.env.INFURA_ID,
       accounts: { mnemonic: process.env.MNEMONIC }
     },
     kovan: {
       url: "https://kovan.infura.io/v3/" + process.env.INFURA_ID,
       accounts: { mnemonic: process.env.MNEMONIC }
     },
     local: {
       url: "http://127.0.0.1:8545/",
       accounts: { mnemonic: process.env.MNEMONIC }
     }
   },
   etherscan: {
     // Your API key for Etherscan
     // Obtain one at https://etherscan.io/
     apiKey: process.env.BSCSCAN
   },
   solidity: {
     version: "0.8.0",
     settings: {
       optimizer: {
         enabled: true,
         runs: 200
       }
     }
   },
   paths: {
     sources: "./contracts",
     tests: "./test",
     cache: "./cache",
     artifacts: "./artifacts",
     // script: "./script"
   },
   mocha: {
     timeout: 20000
   }
 }
 //npx hardhat verify --network rinkeby 0xe4742f84ba02df98f100fc6175c24cef60a077fc