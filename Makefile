.PHONY: clean generate regenerate test docs redocs hardhat bindings

build: hardhat bindings bin/game7

rebuild: clean generate build

bin/game7:
	mkdir -p bin
	go build -o bin/game7 ./cmd/game7

bindings/Game7Token/Game7Token.go: hardhat
	mkdir -p bindings/Game7Token
	~/seer/seer evm generate --package Game7Token --output bindings/Game7Token/Game7Token.go --hardhat web3/artifacts/contracts/Token/Game7Token.sol/Game7Token.json --cli --struct Game7Token

bindings/Staking/Staking.go: hardhat
	mkdir -p bindings/Staking
	~/seer/seer evm generate --package Staking --output bindings/Staking/Staking.go --hardhat web3/artifacts/contracts/staking/Staking.sol/Staking.json --cli --struct Staking

bindings: bindings/Game7Token/Game7Token.go bindings/Staking/Staking.go

test:
	npx hardhat test

clean:
	rm -rf bindings/Game7Token/* bindings/Staking/* bin/*

hardhat:
	cd web3 && npm install && npx hardhat compile

docs:
	forge doc

redocs: clean docs
