const { expectRevert, time } = require('@openzeppelin/test-helpers');
const OvenToken = artifacts.require('OvenToken');
const SugarBar = artifacts.require('SugarBar');
const MasterChef = artifacts.require('MasterChef');
const MockERC20 = artifacts.require('libs/MockERC20');

contract('MasterChef', ([alice, bob, carol, admin, treasury, minter]) => {
    beforeEach(async () => {
        this.oven = await OvenToken.new({ from: minter });
        this.sugar = await SugarBar.new(this.oven.address, { from: minter });
        this.lp1 = await MockERC20.new('LPToken', 'LP1', '1000000', { from: minter });
        this.lp2 = await MockERC20.new('LPToken', 'LP2', '1000000', { from: minter });
        this.lp3 = await MockERC20.new('LPToken', 'LP3', '1000000', { from: minter });
        this.chef = await MasterChef.new(this.oven.address, this.sugar.address, admin, treasury, '1000', '100', { from: minter });
        await this.oven.transferOwnership(this.chef.address, { from: minter });
        await this.sugar.transferOwnership(this.chef.address, { from: minter });

        await this.lp1.transfer(bob, '2000', { from: minter });
        await this.lp2.transfer(bob, '2000', { from: minter });
        await this.lp3.transfer(bob, '2000', { from: minter });

        await this.lp1.transfer(alice, '2000', { from: minter });
        await this.lp2.transfer(alice, '2000', { from: minter });
        await this.lp3.transfer(alice, '2000', { from: minter });
    });
    it('real case', async () => {
      this.lp4 = await MockERC20.new('LPToken', 'LP1', '1000000', { from: minter });
      this.lp5 = await MockERC20.new('LPToken', 'LP2', '1000000', { from: minter });
      this.lp6 = await MockERC20.new('LPToken', 'LP3', '1000000', { from: minter });
      this.lp7 = await MockERC20.new('LPToken', 'LP1', '1000000', { from: minter });
      this.lp8 = await MockERC20.new('LPToken', 'LP2', '1000000', { from: minter });
      this.lp9 = await MockERC20.new('LPToken', 'LP3', '1000000', { from: minter });
      await this.chef.add('2000', this.lp1.address, '0', true, { from: minter });
      await this.chef.add('1000', this.lp2.address, '0', true, { from: minter });
      await this.chef.add('500', this.lp3.address, '0', true, { from: minter });
      await this.chef.add('500', this.lp3.address, '0', true, { from: minter });
      await this.chef.add('500', this.lp3.address, '0', true, { from: minter });
      await this.chef.add('500', this.lp3.address, '0', true, { from: minter });
      await this.chef.add('500', this.lp3.address, '0', true, { from: minter });
      await this.chef.add('100', this.lp3.address, '0', true, { from: minter });
      await this.chef.add('100', this.lp3.address, '0', true, { from: minter });
      assert.equal((await this.chef.poolLength()).toString(), "10");

      await time.advanceBlockTo('170');
      await this.lp1.approve(this.chef.address, '1000', { from: alice });
      assert.equal((await this.oven.balanceOf(alice)).toString(), '0');
      await this.chef.deposit(1, '20', { from: alice });
      await this.chef.withdraw(1, '20', { from: alice });
      assert.equal((await this.oven.balanceOf(alice)).toString(), '263');

      await this.oven.approve(this.chef.address, '1000', { from: alice });
      await this.chef.enterStaking('20', { from: alice });
      await this.chef.enterStaking('0', { from: alice });
      await this.chef.enterStaking('0', { from: alice });
      await this.chef.enterStaking('0', { from: alice });
      assert.equal((await this.oven.balanceOf(alice)).toString(), '993');
      // assert.equal((await this.chef.getPoolPoint(0, { from: minter })).toString(), '1900');
    })


    it('deposit/withdraw', async () => {
      await this.chef.add('1000', this.lp1.address, true, { from: minter });
      await this.chef.add('1000', this.lp2.address, true, { from: minter });
      await this.chef.add('1000', this.lp3.address, true, { from: minter });

      await this.lp1.approve(this.chef.address, '100', { from: alice });
      await this.chef.deposit(1, '20', { from: alice });
      await this.chef.deposit(1, '0', { from: alice });
      await this.chef.deposit(1, '40', { from: alice });
      await this.chef.deposit(1, '0', { from: alice });
      assert.equal((await this.lp1.balanceOf(alice)).toString(), '1940');
      await this.chef.withdraw(1, '10', { from: alice });
      assert.equal((await this.lp1.balanceOf(alice)).toString(), '1950');
      assert.equal((await this.oven.balanceOf(alice)).toString(), '999');
      assert.equal((await this.oven.balanceOf(admin)).toString(), '100');
      assert.equal((await this.oven.balanceOf(treasury)).toString(), '0');

      await this.lp1.approve(this.chef.address, '100', { from: bob });
      assert.equal((await this.lp1.balanceOf(bob)).toString(), '2000');
      await this.chef.deposit(1, '50', { from: bob });
      assert.equal((await this.lp1.balanceOf(bob)).toString(), '1950');
      await this.chef.deposit(1, '0', { from: bob });
      assert.equal((await this.oven.balanceOf(bob)).toString(), '125');
      await this.chef.emergencyWithdraw(1, { from: bob });
      assert.equal((await this.lp1.balanceOf(bob)).toString(), '2000');
    })

    it('staking/unstaking', async () => {
      await this.chef.add('1000', this.lp1.address, true, { from: minter });
      await this.chef.add('1000', this.lp2.address, true, { from: minter });
      await this.chef.add('1000', this.lp3.address, true, { from: minter });

      await this.lp1.approve(this.chef.address, '10', { from: alice });
      await this.chef.deposit(1, '2', { from: alice }); //0
      await this.chef.withdraw(1, '2', { from: alice }); //1

      await this.oven.approve(this.chef.address, '250', { from: alice });
      await this.chef.enterStaking('240', { from: alice }); //3
      assert.equal((await this.sugar.balanceOf(alice)).toString(), '240');
      assert.equal((await this.oven.balanceOf(alice)).toString(), '10');
      await this.chef.enterStaking('10', { from: alice }); //4
      assert.equal((await this.sugar.balanceOf(alice)).toString(), '250');
      assert.equal((await this.oven.balanceOf(alice)).toString(), '249');
      await this.chef.leaveStaking(250);
      assert.equal((await this.sugar.balanceOf(alice)).toString(), '0');
      assert.equal((await this.oven.balanceOf(alice)).toString(), '749');

    });


    it('update multiplier', async () => {
      await this.chef.add('1000', this.lp1.address, true, { from: minter });
      await this.chef.add('1000', this.lp2.address, true, { from: minter });
      await this.chef.add('1000', this.lp3.address, true, { from: minter });

      await this.lp1.approve(this.chef.address, '100', { from: alice });
      await this.lp1.approve(this.chef.address, '100', { from: bob });
      await this.chef.deposit(1, '100', { from: alice });
      await this.chef.deposit(1, '100', { from: bob });
      await this.chef.deposit(1, '0', { from: alice });
      await this.chef.deposit(1, '0', { from: bob });

      await this.oven.approve(this.chef.address, '100', { from: alice });
      await this.oven.approve(this.chef.address, '100', { from: bob });
      await this.chef.enterStaking('50', { from: alice });
      await this.chef.enterStaking('100', { from: bob });

      await this.chef.updateMultiplier('0', { from: minter });

      await this.chef.enterStaking('0', { from: alice });
      await this.chef.enterStaking('0', { from: bob });
      await this.chef.deposit(1, '0', { from: alice });
      await this.chef.deposit(1, '0', { from: bob });

      assert.equal((await this.oven.balanceOf(alice)).toString(), '700');
      assert.equal((await this.oven.balanceOf(bob)).toString(), '150');

      await time.advanceBlockTo('265');

      await this.chef.enterStaking('0', { from: alice });
      await this.chef.enterStaking('0', { from: bob });
      await this.chef.deposit(1, '0', { from: alice });
      await this.chef.deposit(1, '0', { from: bob });

      assert.equal((await this.oven.balanceOf(alice)).toString(), '700');
      assert.equal((await this.oven.balanceOf(bob)).toString(), '150');

      await this.chef.leaveStaking('50', { from: alice });
      await this.chef.leaveStaking('100', { from: bob });
      await this.chef.withdraw(1, '100', { from: alice });
      await this.chef.withdraw(1, '100', { from: bob });

    });

  //   it('should allow admin and only admin to update admin', async () => {
  //       assert.equal((await this.chef.admin()).valueOf(), admin);
  //       await expectRevert(this.chef.admin(bob, { from: bob }), 'admin: le who are you?');
  //       await this.chef.admin(bob, { from: admin });
  //       assert.equal((await this.chef.admin()).valueOf(), bob);
  //       await this.chef.admin(alice, { from: bob });
  //       assert.equal((await this.chef.admin()).valueOf(), alice);
  //   })

  //   it('should allow treasury and only treasury to update treasury', async () => {
  //     assert.equal((await this.chef.treasury()).valueOf(), treasury);
  //     await expectRevert(this.chef.admin(bob, { from: bob }), 'treasury: invalid permissions');
  //     await this.chef.admin(bob, { from: admin });
  //     assert.equal((await this.chef.treasury()).valueOf(), bob);
  //     await this.chef.admin(alice, { from: bob });
  //     assert.equal((await this.chef.treasury()).valueOf(), alice);
  // })
});
