// Source: https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/test/token/ERC20/ERC20.test.js
import { ethers } from 'hardhat';
import { expect } from 'chai';
import { shouldBehaveLikeERC20, shouldBehaveLikeERC20Transfer, shouldBehaveLikeERC20Approve } from './ERC20.behavior';
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { HardhatEthersSigner } from '../helpers/type';

const TOKENS = [{ Token: 'WrappedNativeToken' }];

const name = 'Wrapped Game7 Token';
const symbol = 'WG7T';
const decimals = 18;
const initialSupply = BigInt(100n);

describe('WrappedNativeToken', function () {
  for (const { Token } of TOKENS) {
    let holder: HardhatEthersSigner;
    let recipient: HardhatEthersSigner;

    describe(Token, function () {
      const fixture = async () => {
        // this.accounts is used by shouldBehaveLikeERC20
        [holder, recipient] = await ethers.getSigners();
        const accounts =  await ethers.getSigners()

        const token = await ethers.deployContract(Token, [name, symbol, decimals]);

        // bump the native token (eth) balance of the holder
        await holder.sendTransaction({ to: (await token.getAddress()), value: initialSupply });

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
          this.other = this.accounts[2];
        });

        shouldBehaveLikeERC20Approve(initialSupply);

        it('reverts when the spender has insufficient allowance', async function () {
          const value = 1n
          await expect(this.token.connect(this.other).transferFrom(this.holder.address, this.other.address, value)).to.be.revertedWith('ERC20: insufficient allowance');
        });
      });

      describe('deposit', function () {
        beforeEach(async function () {
          this.deposit = (from: HardhatEthersSigner, value: bigint) => this.token.connect(from).deposit({ value });
        });
  
        it('reverts when the value is zero', async function () {
          await expect(this.deposit(this.holder, 0n)).to.be.revertedWith('zero value');
        });
  
        it('should deposit', async function () {
          const previousBalance = await this.token.balanceOf(this.holder.address);
          const value = 1n;
          await expect(this.deposit(this.holder, value)).to.emit(this.token, 'Deposit').withArgs(this.holder.address, value);
          expect(await this.token.balanceOf(this.holder.address)).to.equal(previousBalance+value);
        });

        describe('withdraw', function () {
          beforeEach(function () {
            this.withdraw = (from: HardhatEthersSigner, value: bigint) => this.token.connect(from).withdraw(value);
          });
  
          it('reverts when the value is zero', async function () {
            await expect(this.withdraw(this.holder, 0n)).to.be.revertedWith('zero value');
          });
  
          it('reverts when the value is greater than the balance', async function () {
            const previousBalance = await this.token.balanceOf(this.holder.address);
            await expect(this.withdraw(this.holder, previousBalance+1n)).to.be.revertedWithoutReason();
          });
  
          it('should withdraw', async function () {
            const previousBalance = await this.token.balanceOf(this.holder.address);
            const value = 1n;
            await expect(this.deposit(this.holder, value)).to.emit(this.token, 'Deposit').withArgs(this.holder.address, value);
            await expect(this.withdraw(this.holder, value)).to.emit(this.token, 'Withdrawal').withArgs(this.holder.address, value);
            expect(await this.token.balanceOf(this.holder.address)).to.equal(previousBalance);
          });
        });
      });
    });
  }
});
