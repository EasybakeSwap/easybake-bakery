const { expectRevert, time } = require('@openzeppelin/test-helpers');
const { assert } = require('chai');
const CakeToken = artifacts.require('CakeToken');
const EthStaking = artifacts.require('EthStaking');
const MockERC20 = artifacts.require('libs/MockERC20');
const WETH = artifacts.require('libs/WETH');

contract('EthStaking.......', async ([alice, bob, admin, dev, minter]) => {
  beforeEach(async () => {
    this.rewardToken = await CakeToken.new({ from: minter });
    this.lpToken = await MockERC20.new('LPToken', 'LP1', '1000000', {
      from: minter,
    });
    this.wETH = await WETH.new({ from: minter });
    this.ethChef = await EthStaking.new(
      this.wETH.address,
      this.rewardToken.address,
      1000,
      10,
      1010,
      admin,
      this.wETH.address,
      { from: minter }
    );
    await this.rewardToken.mint(this.ethChef.address, 100000, { from: minter });
  });

  it('deposit/withdraw', async () => {
    await time.advanceBlockTo('10');
    await this.ethChef.deposit({ from: alice, value: 100 });
    await this.ethChef.deposit({ from: bob, value: 200 });
    assert.equal(
      (await this.wETH.balanceOf(this.ethChef.address)).toString(),
      '300'
    );
    assert.equal((await this.ethChef.pendingReward(alice)).toString(), '1000');
    await this.ethChef.deposit({ from: alice, value: 300 });
    assert.equal((await this.ethChef.pendingReward(alice)).toString(), '0');
    assert.equal((await this.rewardToken.balanceOf(alice)).toString(), '1333');
    await this.ethChef.withdraw('100', { from: alice });
    assert.equal(
      (await this.wETH.balanceOf(this.ethChef.address)).toString(),
      '500'
    );
    await this.ethChef.emergencyRewardWithdraw(1000, { from: minter });
    assert.equal((await this.ethChef.pendingReward(bob)).toString(), '1399');
  });

  it('should block man who in blanklist', async () => {
    await this.ethChef.setBlackList(alice, { from: admin });
    await expectRevert(
      this.ethChef.deposit({ from: alice, value: 100 }),
      'in black list'
    );
    await this.ethChef.removeBlackList(alice, { from: admin });
    await this.ethChef.deposit({ from: alice, value: 100 });
    await this.ethChef.setAdmin(dev, { from: minter });
    await expectRevert(
      this.ethChef.setBlackList(alice, { from: admin }),
      'admin: wut?'
    );
  });

  it('emergencyWithdraw', async () => {
    await this.ethChef.deposit({ from: alice, value: 100 });
    await this.ethChef.deposit({ from: bob, value: 200 });
    assert.equal(
      (await this.wETH.balanceOf(this.ethChef.address)).toString(),
      '300'
    );
    await this.ethChef.emergencyWithdraw({ from: alice });
    assert.equal(
      (await this.wETH.balanceOf(this.ethChef.address)).toString(),
      '200'
    );
    assert.equal((await this.wETH.balanceOf(alice)).toString(), '100');
  });

  it('emergencyRewardWithdraw', async () => {
    await expectRevert(
      this.ethChef.emergencyRewardWithdraw(100, { from: alice }),
      'caller is not the owner'
    );
    await this.ethChef.emergencyRewardWithdraw(1000, { from: minter });
    assert.equal((await this.rewardToken.balanceOf(minter)).toString(), '1000');
  });

  it('setLimitAmount', async () => {
    // set limit to 1e-12 ETH
    await this.ethChef.setLimitAmount('1000000', { from: minter });
    await expectRevert(
      this.ethChef.deposit({ from: alice, value: 100000000 }),
      'exceed the to'
    );
  });
});
