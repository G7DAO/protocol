// Source: https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/test/token/ERC20/ERC20.test.js
import { expect } from 'chai';
import { HardhatEthersSigner } from '../helpers/type';

export function shouldBehaveLikeERC20(initialSupply: bigint) {

  beforeEach(async function () {
    [this.holder, this.recipient, this.other] = this.accounts;
  });

  it('total supply: returns the total token value', async function () {
    expect(await this.token.totalSupply()).to.equal(initialSupply);
  });

  describe('balanceOf', function () {
    it('returns zero when the requested account has no tokens', async function () {
      expect(await this.token.balanceOf(this.other)).to.equal(0n);
    });

    it('returns the total token value when the requested account has some tokens', async function () {
      expect(await this.token.balanceOf(this.holder)).to.equal(initialSupply);
    });
  });

  describe('transfer', function () {
    beforeEach(function () {
      this.transfer = (from: HardhatEthersSigner, to: string, value: bigint) => this.token.connect(from).transfer(to, value);
    });

    shouldBehaveLikeERC20Transfer(initialSupply);
  });

  describe('transfer from', function () {
    describe('when the token owner is not the zero address', function () {
      describe('when the recipient is not the zero address', function () {
        describe('when the spender has enough allowance', function () {
          beforeEach(async function () {
            await this.token.connect(this.holder).approve(this.recipient, initialSupply);
          });

          describe('when the token owner has enough balance', function () {
            const value = initialSupply;

            beforeEach(async function () {
              this.tx = await this.token.connect(this.recipient).transferFrom(this.holder, this.other, value);
            });

            it('transfers the requested value', async function () {
              await expect(this.tx).to.changeTokenBalances(this.token, [this.holder, this.other], [-value, value]);
            });

            it('decreases the spender allowance', async function () {
              expect(await this.token.allowance(this.holder, this.recipient)).to.equal(0n);
            });

            it('emits a transfer event', async function () {
              await expect(this.tx).to.emit(this.token, 'Transfer').withArgs(this.holder, this.other, value);
            });

              it('does not emit an approval event', async function () {
                await expect(this.tx).to.not.emit(this.token, 'Approval');
              });
          });

          it('reverts when the token owner does not have enough balance', async function () {
            const value = initialSupply;
            await this.token.connect(this.holder).transfer(this.other, 1n);
            await expect(this.token.connect(this.recipient).transferFrom(this.holder, this.other, value))
              .to.revertedWith('ERC20: transfer amount exceeds balance');
          });
        });

        describe('when the spender does not have enough allowance', function () {
          const allowance = initialSupply - 1n;

          beforeEach(async function () {
            await this.token.connect(this.holder).approve(this.recipient, allowance);
          });

          it('reverts when the token owner has enough balance', async function () {
            const value = initialSupply;
            await expect(this.token.connect(this.recipient).transferFrom(this.holder, this.other, value))
              .to.be.revertedWith('ERC20: insufficient allowance');
          });

          it('reverts when the token owner does not have enough balance', async function () {
            const value = allowance;
            await this.token.connect(this.holder).transfer(this.other, 2);
            await expect(this.token.connect(this.recipient).transferFrom(this.holder, this.other, value))
              .to.be.revertedWith('ERC20: transfer amount exceeds balance');
          });
        });
      });
    });
  });

  describe('approve', function () {
    beforeEach(function () {
      this.approve = (owner: HardhatEthersSigner, spender: HardhatEthersSigner, value: bigint) => this.token.connect(owner).approve(spender.address, value);
    });

    shouldBehaveLikeERC20Approve(initialSupply);
  });
}

export function shouldBehaveLikeERC20Transfer(balance: bigint) {
  describe('when the recipient is not the zero address', function () {
    it('reverts when the sender does not have enough balance', async function () {
      const value = balance + 1n;
      await expect(this.transfer(this.holder, this.recipient, value))
        .to.be.revertedWith('ERC20: transfer amount exceeds balance');
    });

    describe('when the sender transfers all balance', function () {
      const value = balance;

      beforeEach(async function () {
        this.tx = await this.transfer(this.holder, this.recipient, value);
      });

      it('transfers the requested value', async function () {
        await expect(this.tx).to.changeTokenBalances(this.token, [this.holder, this.recipient], [-value, value]);
      });

      it('emits a transfer event', async function () {
        await expect(this.tx).to.emit(this.token, 'Transfer').withArgs(this.holder, this.recipient, value);
      });
    });

    describe('when the sender transfers zero tokens', function () {
      const value = 0n;

      beforeEach(async function () {
        this.tx = await this.transfer(this.holder, this.recipient, value);
      });

      it('transfers the requested value', async function () {
        await expect(this.tx).to.changeTokenBalances(this.token, [this.holder, this.recipient], [0n, 0n]);
      });

      it('emits a transfer event', async function () {
        await expect(this.tx).to.emit(this.token, 'Transfer').withArgs(this.holder, this.recipient, value);
      });
    });
  });
}

export function shouldBehaveLikeERC20Approve(supply: bigint) {
  describe('when the spender is not the zero address', function () {
    describe('when the sender has enough balance', function () {
      const value = supply;

      it('emits an approval event', async function () {
        await expect(this.approve(this.holder, this.recipient, value))
          .to.emit(this.token, 'Approval')
          .withArgs(this.holder, this.recipient, value);
      });

      it('approves the requested value when there was no approved value before', async function () {
        await this.approve(this.holder, this.recipient, value);

        expect(await this.token.allowance(this.holder, this.recipient)).to.equal(value);
      });

      it('approves the requested value and replaces the previous one when the spender had an approved value', async function () {
        await this.approve(this.holder, this.recipient, 1n);
        await this.approve(this.holder, this.recipient, value);

        expect(await this.token.allowance(this.holder, this.recipient)).to.equal(value);
      });
    });

    describe('when the sender does not have enough balance', function () {
      const value = supply + 1n;

      it('emits an approval event', async function () {
        await expect(this.approve(this.holder, this.recipient, value))
          .to.emit(this.token, 'Approval')
          .withArgs(this.holder, this.recipient, value);
      });

      it('approves the requested value when there was no approved value before', async function () {
        await this.approve(this.holder, this.recipient, value);

        expect(await this.token.allowance(this.holder, this.recipient)).to.equal(value);
      });

      it('approves the requested value and replaces the previous one when the spender had an approved value', async function () {
        await this.approve(this.holder, this.recipient, 1n);
        await this.approve(this.holder, this.recipient, value);

        expect(await this.token.allowance(this.holder, this.recipient)).to.equal(value);
      });
    });
  });
}