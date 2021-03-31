// SPDX-License-Identifier: MIT

pragma solidity >=0.5.16;

import 'easybake-swap-lib/contracts/math/SafeMath.sol';
import 'easybake-swap-lib/contracts/token/ERC20/IERC20.sol';
import 'easybake-swap-lib/contracts/token/ERC20/SafeERC20.sol';

// import "@nomiclabs/buidler/console.sol";

// EasyChef is the chef of new tokens. She can make yummy food and she is a fair lady as well as MasterChef.
contract EasyChef {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    // Info of each user.
    struct UserInfo {
        uint256 amount;   // How many SUGAR tokens the user has provided.
        uint256 rewardDebt;  // Reward debt. See explanation below.
        uint256 rewardPending;
        //
        // We do some fancy math here. Basically, any point in time, the amount of SUGAR
        // entitled to a user but is pending to be distributed is:
        //
        //   pending reward = (user.amount * pool.accRewardPerShare) - user.rewardDebt + user.rewardPending
        //
        // Whenever a user deposits or withdraws SUGAR tokens to a pool. Here's what happens:
        //   1. The pool's `accRewardPerShare` (and `lastRewardBlock`) gets updated.
        //   2. User receives the pending reward sent to his/her address.
        //   3. User's `amount` gets updated.
        //   3. User's `amount` gets updated.
        //   4. User's `rewardDebt` gets updated.
    }

    // Info of Pool
    struct PoolInfo {
        uint256 lastRewardBlock;  // Last block number that Rewards distribution occurs.
        uint256 accRewardPerShare; // Accumulated reward per share, times 1e12. See below.
    }

    // The SUGAR TOKEN!
    IERC20 public sugar;
    // rewards created per block.
    uint256 public rewardPerBlock;

    // Info.
    PoolInfo public poolInfo;
    // Info of each user that stakes Sugar tokens.
    mapping (address => UserInfo) public userInfo;

    // addresses list
    address[] public addressList;

    // The block number when mining starts.
    uint256 public startBlock;
    // The block number when mining ends.
    uint256 public bonusEndBlock;

    event Deposit(address indexed user, uint256 amount);
    event Withdraw(address indexed user, uint256 amount);
    event EmergencyWithdraw(address indexed user, uint256 amount);

    constructor(
        IERC20 _sugar,
        uint256 _rewardPerBlock,
        uint256 _startBlock,
        uint256 _endBlock
    ) public {
        sugar = _sugar;
        rewardPerBlock = _rewardPerBlock;
        startBlock = _startBlock;
        bonusEndBlock = _endBlock;

        // staking pool
        poolInfo = PoolInfo({
            lastRewardBlock: startBlock,
            accRewardPerShare: 0
        });
    }

    function addressLength() external view returns (uint256) {
        return addressList.length;
    }

    // Return reward multiplier over the given _from to _to block.
    function getMultiplier(uint256 _from, uint256 _to) internal view returns (uint256) {
        if (_to <= bonusEndBlock) {
            return _to.sub(_from);
        } else if (_from >= bonusEndBlock) {
            return 0;
        } else {
            return bonusEndBlock.sub(_from);
        }
    }

    // View function to see pending Tokens on frontend.
    function pendingReward(address _user) external view returns (uint256) {
        PoolInfo storage pool = poolInfo;
        UserInfo storage user = userInfo[_user];
        uint256 accRewardPerShare = pool.accRewardPerShare;
        uint256 stakedSupply = sugar.balanceOf(address(this));
        if (block.number > pool.lastRewardBlock && stakedSupply != 0) {
            uint256 multiplier = getMultiplier(pool.lastRewardBlock, block.number);
            uint256 tokenReward = multiplier.mul(rewardPerBlock);
            accRewardPerShare = accRewardPerShare.add(tokenReward.mul(1e12).div(stakedSupply));
        }
        return user.amount.mul(accRewardPerShare).div(1e12).sub(user.rewardDebt).add(user.rewardPending);
    }

    // Update reward variables of the given pool to be up-to-date.
    function updatePool() public {
        if (block.number <= poolInfo.lastRewardBlock) {
            return;
        }
        uint256 sugarSupply = sugar.balanceOf(address(this));
        if (sugarSupply == 0) {
            poolInfo.lastRewardBlock = block.number;
            return;
        }
        uint256 multiplier = getMultiplier(poolInfo.lastRewardBlock, block.number);
        uint256 tokenReward = multiplier.mul(rewardPerBlock);

        poolInfo.accRewardPerShare = poolInfo.accRewardPerShare.add(tokenReward.mul(1e12).div(sugarSupply));
        poolInfo.lastRewardBlock = block.number;
    }


    // Deposit Sugar tokens to EasyChef for Reward allocation.
    function deposit(uint256 _amount) public {
        require (_amount > 0, 'amount 0');
        UserInfo storage user = userInfo[msg.sender];
        updatePool();
        sugar.safeTransferFrom(address(msg.sender), address(this), _amount);
        // The deposit behavior before farming will result in duplicate addresses, and thus we will manually remove them when airdropping.
        if (user.amount == 0 && user.rewardPending == 0 && user.rewardDebt == 0) {
            addressList.push(address(msg.sender));
        }
        user.rewardPending = user.amount.mul(poolInfo.accRewardPerShare).div(1e12).sub(user.rewardDebt).add(user.rewardPending);
        user.amount = user.amount.add(_amount);
        user.rewardDebt = user.amount.mul(poolInfo.accRewardPerShare).div(1e12);

        emit Deposit(msg.sender, _amount);
    }

    // Withdraw Sugar tokens from EasyChef.
    function withdraw(uint256 _amount) public {
        require (_amount > 0, 'amount 0');
        UserInfo storage user = userInfo[msg.sender];
        require(user.amount >= _amount, "withdraw: not enough");

        updatePool();
        sugar.safeTransfer(address(msg.sender), _amount);

        user.rewardPending = user.amount.mul(poolInfo.accRewardPerShare).div(1e12).sub(user.rewardDebt).add(user.rewardPending);
        user.amount = user.amount.sub(_amount);
        user.rewardDebt = user.amount.mul(poolInfo.accRewardPerShare).div(1e12);

        emit Withdraw(msg.sender, _amount);
    }

    // Withdraw without caring about rewards. EMERGENCY ONLY.
    function emergencyWithdraw() public {
        UserInfo storage user = userInfo[msg.sender];
        sugar.safeTransfer(address(msg.sender), user.amount);
        emit EmergencyWithdraw(msg.sender, user.amount);
        user.amount = 0;
        user.rewardDebt = 0;
        user.rewardPending = 0;
    }

}
