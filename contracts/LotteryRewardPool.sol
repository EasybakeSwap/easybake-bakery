pragma solidity 0.6.12;

import '@pancakeswap/pancake-swap-lib/contracts/token/ERC20/IERC20.sol';
import '@pancakeswap/pancake-swap-lib/contracts/token/ERC20/SafeERC20.sol';
import '@pancakeswap/pancake-swap-lib/contracts/access/Ownable.sol';

import './MasterChef.sol';

contract LotteryRewardPool is Ownable {
    using SafeERC20 for IERC20;

    MasterChef public chef;
    address public adminAddress;
    address public receiver;
    IERC20 public lptoken;
    IERC20 public cake;

    constructor(
        MasterChef _chef,
        IERC20 _cake,
        address _admin,
        address _receiver
    ) public {
        chef = _chef;
        cake = _cake;
        adminAddress = _admin;
        receiver = _receiver;
    }

    event StartFarming(address indexed user, uint256 indexed pid);
    event Harvest(address indexed user, uint256 indexed pid);
    event EmergencyWithdraw(address indexed user, uint256 amount);

    modifier onlyAdmin() {
        require(msg.sender == adminAddress, "admin: wut?");
        _;
    }

    function startFarming(uint256 _pid, IERC20 _lptoken, uint256 _amount) external onlyAdmin {
        _lptoken.safeApprove(address(chef), _amount);
        chef.deposit(_pid, _amount);
        emit StartFarming(msg.sender, _pid);
    }

    function  harvest(uint256 _pid) external onlyAdmin {
        chef.deposit(_pid, 0);
        uint256 balance = cake.balanceOf(address(this));
        cake.safeTransfer(receiver, balance);
        emit Harvest(msg.sender, _pid);
    }

    function setReceiver(address _receiver) external onlyAdmin {
        receiver = _receiver;
    }

    function  pendingReward(uint256 _pid) external view returns (uint256) {
        return chef.pendingCake(_pid, address(this));
    }

    // EMERGENCY ONLY.
    function emergencyWithdraw(IERC20 _token, uint256 _amount) external onlyOwner {
        cake.safeTransfer(address(msg.sender), _amount);
        emit EmergencyWithdraw(msg.sender, _amount);
    }

    function setAdmin(address _admin) external onlyOwner {
        adminAddress = _admin;
    }

}
