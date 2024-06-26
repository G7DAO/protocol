.PHONY: clean generate regenerate test docs redocs hardhat bindings

build: hardhat bindings bin/game7

rebuild: clean generate build

bin/game7:
	mkdir -p bin
	go build -o bin/game7 ./cmd/game7

bindings/ERC20/ERC20.go: hardhat
	mkdir -p bindings/ERC20
	seer evm generate --package ERC20 --output bindings/ERC20/ERC20.go --hardhat web3/artifacts/contracts/token/ERC20.sol/ERC20.json --cli --struct ERC20

bindings: bindings/ERC20/ERC20.go

test:
	npx hardhat test

clean:
	rm -rf bindings/ERC20/* bin/*

hardhat:
	cd web3 && npm install && npx hardhat compile

docs:
	forge doc

redocs: clean docs
