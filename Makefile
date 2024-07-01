.PHONY: clean generate regenerate test docs redocs hardhat bindings

build: hardhat bindings bin/game7

rebuild: clean generate build

bin/game7:
	mkdir -p bin
	go build -o bin/game7 ./cmd/game7

bindings/ERC20/ERC20.go: hardhat
	mkdir -p bindings/ERC20
	seer evm generate --package ERC20 --output bindings/ERC20/ERC20.go --hardhat web3/artifacts/contracts/Token/ERC20.sol/ERC20.json --cli --struct ERC20
	seer evm generate --package TokenFaucet --output bindings/TokenFaucet/TokenFaucet.go --hardhat web3/artifacts/contracts/faucet/TokenFaucet.sol/TokenFaucet.json --cli --struct TokenFaucet

bindings/StakingTokens/StakingTokens.go: hardhat
	mkdir -p bindings/StakingTokens
	seer evm generate --package StakingTokens --output bindings/StakingTokens/StakingTokens.go --hardhat web3/artifacts/contracts/staking/StakingTokens.sol/StakingTokens.json --cli --struct StakingTokens

bindings/NontransferableStakingTokens/NontransferableStakingTokens.go: hardhat
	mkdir -p bindings/NontransferableStakingTokens
	seer evm generate --package NontransferableStakingTokens --output bindings/NontransferableStakingTokens/NontransferableStakingTokens.go --hardhat web3/artifacts/contracts/staking/NontransferableStakingTokens.sol/NontransferableStakingTokens.json --cli --struct NontransferableStakingTokens

bindings: bindings/ERC20/ERC20.go bindings/StakingTokens/StakingTokens.go bindings/NontransferableStakingTokens/NontransferableStakingTokens.go

test:
	npx hardhat test

clean:
	rm -rf bindings/ERC20/* bin/* bindings/TokenFaucet/* bindings/StakingTokens/* bindings/NontransferableStakingTokens/*

hardhat:
	cd web3 && npm install && npx hardhat compile

docs:
	forge doc

redocs: clean docs
