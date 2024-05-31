import { ethers } from 'hardhat';
import { expect } from 'chai';
import { shouldBehaveLikeERC20, shouldBehaveLikeERC20Transfer, shouldBehaveLikeERC20Approve } from './ERC20.behavior';
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { HardhatEthersSigner } from '../helpers/type';

const TOKENS = [{ Token: 'Game7Token' }];

const name = 'Game7 Token';
const symbol = 'G7T';
const initialSupply = BigInt(100n);

describe('ERC20', function () {
  for (const { Token } of TOKENS) {
    let holder: HardhatEthersSigner;
    let recipient: HardhatEthersSigner;

    describe(Token, function () {
      const fixture = async () => {
        // this.accounts is used by shouldBehaveLikeERC20
        [holder, recipient] = await ethers.getSigners();
        const accounts =  await ethers.getSigners()

        const token = await ethers.deployContract(Token, [initialSupply]);

        return { accounts, holder, recipient, token };
      };

      beforeEach(async function () {
        Object.assign(this, await loadFixture(fixture));
      });

      shouldBehaveLikeERC20(initialSupply);

      it('has a name', async function () {
        expect(await this.token.name()).to.equal(name);
      });

      it('has a symbol', async function () {
        expect(await this.token.symbol()).to.equal(symbol);
      });

      it('has 18 decimals', async function () {
        expect(await this.token.decimals()).to.equal(18n);
      });

      describe('transfer', function () {
        beforeEach(function () {
          this.transfer = (from: HardhatEthersSigner, to: string, value: bigint) => this.token.connect(from).transfer(to, value);
        });

        shouldBehaveLikeERC20Transfer(initialSupply);

      });

      describe('approve', function () {
        beforeEach(function () {
          this.approve = (owner: HardhatEthersSigner, spender: HardhatEthersSigner, value: bigint) => this.token.connect(owner).approve(spender.address, value);
        });

        shouldBehaveLikeERC20Approve(initialSupply);
      });
    });
  }
});
