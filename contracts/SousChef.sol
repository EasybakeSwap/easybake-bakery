/// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/access/Ownable.sol';
import '@openzeppelin/contracts/utils/Address.sol';

// import "@nomiclabs/buidler/console.sol";


// SousChef is the chef of new tokens. She can bake yummy food and she is a fair lady as well as MasterChef.
contract SousChef is Ownable {

    // Info of each user.
    struct UserInfo {
        uint256 amount;   // How many SUGAR tokens the user has provided.
        uint256 rewardDebt;  // Reward debt. See explanation below.
        uint256 rewardPending;
        //
        // We do some fancy math here. Basically, any point in time, the amount of SUGARs
        // entitled to a user but is pending to be distributed is:
        //
        //   pending reward = (user.amount * pool.accRewardPerShare) - user.rewardDebt + user.rewardPending
        //
        // Whenever a user deposits or withdraws SUGAR tokens to a pool. Here's what happens:
        //   1. The pool's `accRewardPerShare` (and `lastRewardTime`) gets updated.
        //   2. User receives the pending reward sent to their address.
        //   3. User's `amount` gets updated.
        //   4. User's `rewardDebt` gets updated.
    }

    // Info of Pool
    struct PoolInfo {
        uint256 lastRewardTime;  // Final timestamp (second) that Rewards distribution occurs.
        uint256 accRewardPerShare; // Accumulated reward per share, times 1e12. See below.
    }

    // The SUGAR TOKEN!
    IERC20 public sugar;

    // chains containing souschef
    uint32 public chains = 1;

    // rewards [[ / day ]].
    uint256 public dailyReward = 250000; 

    // rewards [[ / second ]].
    uint256 public rewardPerSecond = dailyReward / 86400;

    // [[ pool ]] info.
    PoolInfo public poolInfo;
    // Info of each user that stakes Sugar tokens.
    mapping (address => UserInfo) public userInfo;

    // addresses list
    address[] public addressList;

    // The timestamp (unix second) when mining starts.
    uint256 public startTime;
    // The timestamp when mining ends.
    uint256 public bonusEndTime;

    event Deposit(address indexed user, uint256 amount);
    event Withdraw(address indexed user, uint256 amount);
    event EmergencyWithdraw(address indexed user, uint256 amount);

    constructor(
        IERC20 _sugar,
        uint256 _startTime,
        uint256 _endTime
    ) {
        sugar = _sugar;
        startTime = _startTime;
        bonusEndTime = _endTime;

        // staking pool
        poolInfo = PoolInfo({
            lastRewardTime: startTime,
            accRewardPerShare: 0
        });
    }

    function addressLength() external view returns (uint256) {
        return addressList.length;
    }

    // Return reward multiplier over the given _from to _to timestamp.
    function getMultiplier(uint256 _from, uint256 _to) internal view returns (uint256) {
        if (_to <= bonusEndTime) {
            return _to - _from;
        } else if (_from >= bonusEndTime) {
            return 0;
        } else {
            return bonusEndTime - _from;
        }
    }

    function updateRewards() internal {
        dailyReward = dailyReward / chains;
        rewardPerSecond = dailyReward / 86400;
    }

    function updateChains(uint32 _chains) public onlyOwner {
        chains = _chains;
        updateRewards();
    }

    // View function to see pending Tokens on frontend.
    function pendingReward(address _user) external view returns (uint256) {
        PoolInfo storage pool = poolInfo;
        UserInfo storage user = userInfo[_user];
        uint256 accRewardPerShare = pool.accRewardPerShare;
        uint256 stakedSupply = sugar.balanceOf(address(this));
        if (block.timestamp > pool.lastRewardTime && stakedSupply != 0) {
            uint256 multiplier = getMultiplier(pool.lastRewardTime, block.timestamp);
            uint256 tokenReward = multiplier * (rewardPerSecond / chains); // div(chains)
            accRewardPerShare = accRewardPerShare + (tokenReward * 1e12 / stakedSupply);
        }
        return (user.amount * accRewardPerShare / 1e12) - (user.rewardDebt) + (user.rewardPending);
    }

    // Update reward variables of the given pool to be up-to-date.
    function updatePool() public {
        if (block.timestamp <= poolInfo.lastRewardTime) {
            return;
        }
        uint256 sugarSupply = sugar.balanceOf(address(this));
        if (sugarSupply == 0) {
            poolInfo.lastRewardTime = block.timestamp;
            return;
        }
        uint256 multiplier = getMultiplier(poolInfo.lastRewardTime, block.timestamp);
        uint256 tokenReward = multiplier * rewardPerSecond / chains; // div(chains)

        poolInfo.accRewardPerShare = poolInfo.accRewardPerShare + (tokenReward * 1e12 / sugarSupply);
        poolInfo.lastRewardTime = block.timestamp;
    }


    // Deposit Sugar tokens to SousChef for Reward allocation.
    function deposit(uint256 _amount) public {
        require (_amount > 0, 'amount 0');
        UserInfo storage user = userInfo[msg.sender];
        updatePool();
        sugar.transferFrom(address(msg.sender), address(this), _amount);
        // The deposit behavior before farming will result in duplicate addresses, and thus we will manually remove them when airdropping.
        if (user.amount == 0 && user.rewardPending == 0 && user.rewardDebt == 0) {
            addressList.push(address(msg.sender));
        }
        user.rewardPending = (user.amount * poolInfo.accRewardPerShare / 1e12) - (user.rewardDebt + user.rewardPending);
        user.amount = user.amount + _amount;
        user.rewardDebt = user.amount * poolInfo.accRewardPerShare / 1e12;

        emit Deposit(msg.sender, _amount);
    }

    // Withdraw Sugar tokens from SousChef.
    function withdraw(uint256 _amount) public {
        require (_amount > 0, 'amount 0');
        UserInfo storage user = userInfo[msg.sender];
        require(user.amount >= _amount, "withdraw: overdraft amount, please select less.");

        updatePool();
        sugar.transfer(address(msg.sender), _amount);

        user.rewardPending = user.amount * poolInfo.accRewardPerShare / 1e12 - (user.rewardDebt + user.rewardPending);
        user.amount = user.amount - _amount;
        user.rewardDebt = user.amount * poolInfo.accRewardPerShare / 1e12;

        emit Withdraw(msg.sender, _amount);
    }

}