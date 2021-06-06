const { expectRevert, time } = require('@openzeppelin/test-helpers');
const { BigNumber } = require('ethers');

const OvenToken = artifacts.require('OvenToken');
const SugarBar = artifacts.require('SugarBar');
const MasterChef = artifacts.require('MasterChef');
const OvenVault = artifacts.require('OvenVault');
const MockERC20 = artifacts.require('libs/MockERC20');

contract('OvenVault', ([alice, bob, team, treasury, minter]) => {
    beforeEach(async () => {
        this.oven = await OvenToken.new({ from: minter });
        this.sugar = await SugarBar.new(this.oven.address, { from: minter });
        this.lp1 = await MockERC20.new('LPToken', 'LP1', '1000000', { from: minter });
        this.lp2 = await MockERC20.new('LPToken', 'LP2', '1000000', { from: minter });
        this.lp3 = await MockERC20.new('LPToken', 'LP3', '1000000', { from: minter });
        this.chef = await MasterChef.new(this.oven.address, this.sugar.address, team, treasury, await time.latest(), { from: minter });

        await this.oven.mint(alice, '2000', { from: minter });
        await this.oven.mint(bob, '2000', { from: minter });

        await this.oven.transferOwnership(this.chef.address, { from: minter });
        await this.sugar.transferOwnership(this.chef.address, { from: minter });
        
        this.vault = await OvenVault.new(this.oven.address, this.sugar.address, this.chef.address, team, treasury, { from: minter });
    });

    it('staking deposit & withdraw', async () => {
        await this.oven.approve(this.vault.address, '1000', { from: alice });
        expect((await this.vault.balanceOf()).toString()).to.equal('0');
        expect((await this.oven.balanceOf(alice)).toString()).to.equal('2000');
        await this.vault.deposit('1000', { from: alice });
        expect((await this.vault.balanceOf()).toString()).to.equal('1000');
        expect((await this.oven.balanceOf(alice)).toString()).to.equal('1000');

        expect((await this.chef.pendingOven(0, this.vault.address)).toString()).to.equal('0');

        console.log(BigNumber.from((await ethers.provider.getBlock(await ethers.provider.getBlockNumber())).timestamp).toNumber())
        await ethers.provider.send("evm_increaseTime", [60])  // fast forward 
        await ethers.provider.send("evm_mine", [])  // mine the block to set the block.timestamp
        console.log(BigNumber.from((await ethers.provider.getBlock(await ethers.provider.getBlockNumber())).timestamp).toNumber())

        expect((await this.chef.pendingOven(0, this.vault.address)).toString()).to.equal('173611111111111111080');
        console.log('OvenVault`s new OVEN balance: '+await this.chef.pendingOven(0, this.vault.address) / (10 ** 18))



    })
});
