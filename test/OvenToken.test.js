const { assert } = require("chai");

const OvenToken = artifacts.require('OvenToken');

contract('OvenToken', ([alice, bob, carol, dev, minter]) => {
    beforeEach(async () => {
        this.oven = await OvenToken.new({ from: minter });
    });


    it('mint', async () => {
        await this.oven.mint(alice, 1000, { from: minter });
        assert.equal((await this.oven.balanceOf(alice)).toString(), '1000');
    })
});
