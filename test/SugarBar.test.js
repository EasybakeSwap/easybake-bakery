const { advanceBlockTo } = require('@openzeppelin/test-helpers/src/time');
const { assert } = require('chai');
const OvenToken = artifacts.require('OvenToken');
const SugarBar = artifacts.require('SugarBar');

contract('SugarBar', ([alice, bob, carol, dev, minter]) => {
  beforeEach(async () => {
    this.oven = await OvenToken.new({ from: minter });
    this.sugar = await SugarBar.new(this.oven.address, { from: minter });
  });

  it('mint', async () => {
    await this.sugar.mint(alice, 1000, { from: minter });
    assert.equal((await this.sugar.balanceOf(alice)).toString(), '1000');
  });

  it('burn', async () => {
    await advanceBlockTo('650');
    await this.sugar.mint(alice, 1000, { from: minter });
    await this.sugar.mint(bob, 1000, { from: minter });
    assert.equal((await this.sugar.totalSupply()).toString(), '2000');
    await this.sugar.burn(alice, 200, { from: minter });

    assert.equal((await this.sugar.balanceOf(alice)).toString(), '800');
    assert.equal((await this.sugar.totalSupply()).toString(), '1800');
  });

  it('safeOvenTransfer', async () => {
    assert.equal(
      (await this.oven.balanceOf(this.sugar.address)).toString(),
      '0'
    );
    await this.oven.mint(this.sugar.address, 1000, { from: minter });
    await this.sugar.safeOvenTransfer(bob, 200, { from: minter });
    assert.equal((await this.oven.balanceOf(bob)).toString(), '200');
    assert.equal(
      (await this.oven.balanceOf(this.sugar.address)).toString(),
      '800'
    );
    await this.sugar.safeOvenTransfer(bob, 2000, { from: minter });
    assert.equal((await this.oven.balanceOf(bob)).toString(), '1000');
  });
});
