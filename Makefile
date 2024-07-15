.PHONY: clean generate regenerate test docs redocs hardhat bindings

build: hardhat bindings bin/game7

rebuild: clean generate build

bin/game7:
	mkdir -p bin
	go build -o bin/game7 ./cmd/game7

bindings/ERC20/ERC20.go: hardhat
	mkdir -p bindings/ERC20
	seer evm generate --package ERC20 --output bindings/ERC20/ERC20.go --hardhat web3/artifacts/contracts/token/ERC20.sol/ERC20.json --cli --struct ERC20

bindings/TokenFaucet/TokenFaucet.go: hardhat
	mkdir -p bindings/TokenFaucet
	seer evm generate --package TokenFaucet --output bindings/TokenFaucet/TokenFaucet.go --hardhat web3/artifacts/contracts/faucet/TokenFaucet.sol/TokenFaucet.json --cli --struct TokenFaucet

bindings/Uniswap.go: hardhat
	mkdir -p bindings/UniswapV2Pair
	seer evm generate --package UniswapV2Pair --output bindings/UniswapV2Pair/UniswapV2Pair.go --hardhat web3/artifacts/contracts/uniswapv2/v2-core/contracts/UniswapV2Pair.sol/UniswapV2Pair.json --cli --struct UniswapV2Pair
	
bindings/UniswapV2Factory.go: hardhat
	mkdir -p bindings/UniswapV2Factory
	seer evm generate --package UniswapV2Factory --output bindings/UniswapV2Factory/UniswapV2Factory.go --hardhat web3/artifacts/contracts/uniswapv2/v2-core/contracts/UniswapV2Factory.sol/UniswapV2Factory.json --cli --struct UniswapV2Factory

bindings/UniswapV2Router02.go: hardhat
	mkdir -p bindings/UniswapV2Router02
	seer evm generate --package UniswapV2Router02 --output bindings/UniswapV2Router02/UniswapV2Router02.go --hardhat web3/artifacts/contracts/uniswapv2/v2-periphery/contracts/UniswapV2Router02.sol/UniswapV2Router02.json --cli --struct UniswapV2Router02

bindings/WrappedNativeToken/WrappedNativeToken.go: hardhat
	mkdir -p bindings/WrappedNativeToken
	seer evm generate --package WrappedNativeToken --output bindings/WrappedNativeToken/WrappedNativeToken.go --hardhat web3/artifacts/contracts/token/WrappedNativeToken.sol/WrappedNativeToken.json --cli --struct WrappedNativeToken

bindings:  bindings/ERC20/ERC20.go bindings/Uniswap.go bindings/UniswapV2Factory.go bindings/TokenFaucet/TokenFaucet.go bindings/UniswapV2Router02.go bindings/WrappedNativeToken/WrappedNativeToken.go

test:
	npx hardhat test

clean:
	rm -rf bindings/ERC20/* bin/* bindings/TokenFaucet/* bindings/UniswapV2Factory/* bindings/UniswapV2Pair/*  bindings/WrappedNativeToken/*

hardhat:
	cd web3 && npm install && npx hardhat compile

docs:
	forge doc

redocs: clean docs
