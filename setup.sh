#!/usr/bin/env bash

# Deploy Contracts
truffle migrate --reset --network rinkeby

# Verify Contracts on Etherscan
truffle run verify OvenToken --network rinkeby --license SPDX-License-Identifier
truffle run verify SugarBar --network rinkeby --license SPDX-License-Identifier
truffle run verify MasterChef --network rinkeby --license SPDX-License-Identifier

# Flatten Contracts
./node_modules/.bin/truffle-flattener contracts/OvenToken.sol > flats/OvenToken_flat.sol
./node_modules/.bin/truffle-flattener contracts/SugarBar.sol > flats/SugarBar_flat.sol
./node_modules/.bin/truffle-flattener contracts/MasterChef.sol > flats/MasterChef_flat.sol