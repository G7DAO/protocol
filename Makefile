.PHONY: clean generate regenerate test docs redocs hardhat bindings test-graffiti test-web3 clean-web3 deepclean gitmodule

build: gitmodule hardhat bindings bin/game7 bin/graffiti bin/robognome

rebuild: clean generate build

bin/game7:
	mkdir -p bin
	go mod tidy
	go build -o bin/game7 ./cmd/game7

bin/robognome:
	mkdir -p bin
	go mod tidy
	go build -o bin/robognome ./cmd/robognome

bin/graffiti:
	mkdir -p bin
	go mod tidy
	go build -o bin/graffiti ./cmd/graffiti

bindings/IMulticall3/IMulticall3.go: abis/IMulticall3.json
	mkdir -p bindings/IMulticall3
	seer evm generate --package IMulticall3 --output bindings/IMulticall3/IMulticall3.go --abi abis/IMulticall3.json --struct IMulticall3

bindings/ERC20/ERC20.go: hardhat
	mkdir -p bindings/ERC20
	seer evm generate --package ERC20 --output bindings/ERC20/ERC20.go --hardhat web3/artifacts/contracts/token/ERC20.sol/ERC20.json --cli --struct ERC20

bindings/TokenFaucet/TokenFaucet.go: hardhat
	mkdir -p bindings/TokenFaucet
	seer evm generate --package TokenFaucet --output bindings/TokenFaucet/TokenFaucet.go --hardhat web3/artifacts/contracts/faucet/TokenFaucet.sol/TokenFaucet.json --cli --struct TokenFaucet

bindings/WrappedNativeToken/WrappedNativeToken.go: hardhat
	mkdir -p bindings/WrappedNativeToken
	seer evm generate --package WrappedNativeToken --output bindings/WrappedNativeToken/WrappedNativeToken.go --hardhat web3/artifacts/contracts/token/WrappedNativeToken.sol/WrappedNativeToken.json --cli --struct WrappedNativeToken

bindings/Staker/Staker.go: hardhat
	mkdir -p bindings/Staker
	seer evm generate --package Staker --output bindings/Staker/Staker.go --hardhat web3/artifacts/contracts/staking/Staker.sol/Staker.json --cli --struct Staker

bindings/PositionMetadata/PositionMetadata.go: hardhat
	mkdir -p bindings/PositionMetadata
	seer evm generate --package PositionMetadata --output bindings/PositionMetadata/PositionMetadata.go --hardhat web3/artifacts/contracts/staking/PositionMetadata.sol/PositionMetadata.json --cli --struct PositionMetadata

bindings/MockERC20/MockERC20.go: hardhat
	mkdir -p bindings/MockERC20
	seer evm generate --package MockERC20 --output bindings/MockERC20/MockERC20.go --hardhat web3/artifacts/contracts/mock/tokens.sol/MockERC20.json --cli --struct MockERC20

bindings/MockERC721/MockERC721.go: hardhat
	mkdir -p bindings/MockERC721
	seer evm generate --package MockERC721 --output bindings/MockERC721/MockERC721.go --hardhat web3/artifacts/contracts/mock/tokens.sol/MockERC721.json --cli --struct MockERC721

bindings/MockERC1155/MockERC1155.go: hardhat
	mkdir -p bindings/MockERC1155
	seer evm generate --package MockERC1155 --output bindings/MockERC1155/MockERC1155.go --hardhat web3/artifacts/contracts/mock/tokens.sol/MockERC1155.json --cli --struct MockERC1155

bindings/Metronome/Metronome.go: hardhat
	mkdir -p bindings/Metronome
	seer evm generate --package Metronome --output bindings/Metronome/Metronome.go --hardhat web3/artifacts/contracts/metronome/Metronome.sol/Metronome.json --cli --struct Metronome
	mkdir -p bindings/Metronome/MetronomeStrat1
	seer evm generate --package MetronomeStrat1 --output bindings/Metronome/MetronomeStrat1/MetronomeStrat1.go --hardhat web3/artifacts/contracts/metronome/MetronomeStrat1.sol/MetronomeStrat1.json --cli --struct MetronomeStrat1

bindings/utils/diamonds/Diamonds.go: hardhat
	mkdir -p bindings/utils/diamonds/Diamond
	seer evm generate --package Diamond --output bindings/utils/diamonds/Diamond/Diamond.go --hardhat web3/artifacts/contracts/utils/diamonds/contracts/Diamond.sol/Diamond.json --cli --struct Diamond
	mkdir -p bindings/utils/diamonds/DiamondCutFacet
	seer evm generate --package DiamondCutFacet --output bindings/utils/diamonds/DiamondCutFacet/DiamondCutFacet.go --hardhat web3/artifacts/contracts/utils/diamonds/contracts/facets/DiamondCutFacet.sol/DiamondCutFacet.json --cli --struct DiamondCutFacet
	mkdir -p bindings/utils/diamonds/DiamondLoupeFacet
	seer evm generate --package DiamondLoupeFacet --output bindings/utils/diamonds/DiamondLoupeFacet/DiamondLoupeFacet.go --hardhat web3/artifacts/contracts/utils/diamonds/contracts/facets/DiamondLoupeFacet.sol/DiamondLoupeFacet.json --cli --struct DiamondLoupeFacet
	mkdir -p bindings/utils/diamonds/OwnershipFacet
	seer evm generate --package OwnershipFacet --output bindings/utils/diamonds/OwnershipFacet/OwnershipFacet.go --hardhat web3/artifacts/contracts/utils/diamonds/contracts/facets/OwnershipFacet.sol/OwnershipFacet.json --cli --struct OwnershipFacet

bindings/utils/security/Terminus.go: hardhat
	mkdir -p bindings/security/terminus/TerminusFacet
	seer evm generate --package TerminusFacet --output bindings/security/terminus/TerminusFacet/TerminusFacet.go --hardhat web3/artifacts/contracts/security/terminus/TerminusFacet.sol/TerminusFacet.json --cli --struct TerminusFacet
	mkdir -p bindings/security/terminus/TerminusInitializer
	seer evm generate --package TerminusInitializer --output bindings/security/terminus/TerminusInitializer/TerminusInitializer.go --hardhat web3/artifacts/contracts/security/terminus/TerminusInitializer.sol/TerminusInitializer.json --cli --struct TerminusInitializer

bindings/ETHOrbitBridger/ETHOrbitBridger.go: hardhat
	mkdir -p bindings/ETHOrbitBridger
	seer evm generate --package ETHOrbitBridger --output bindings/ETHOrbitBridger/ETHOrbitBridger.go --hardhat web3/artifacts/contracts/bridge/ETHOrbitBridger.sol/ETHOrbitBridger.json --cli --struct ETHOrbitBridger

bindings/USDCOrbitBridger/USDCOrbitBridger.go: hardhat
	mkdir -p bindings/USDCOrbitBridger
	seer evm generate --package USDCOrbitBridger --output bindings/USDCOrbitBridger/USDCOrbitBridger.go --hardhat web3/artifacts/contracts/bridge/USDCOrbitBridger.sol/USDCOrbitBridger.json --cli --struct USDCOrbitBridger

bindings/TokenSender/TokenSender.go: hardhat
	mkdir -p bindings/TokenSender
	seer evm generate --package TokenSender --output bindings/TokenSender/TokenSender.go --hardhat web3/artifacts/contracts/faucet/TokenSender.sol/TokenSender.json --cli --struct TokenSender

bindings/ERC20OrbitBridger/ERC20OrbitBridger.go: hardhat
	mkdir -p bindings/ERC20OrbitBridger
	seer evm generate --package ERC20OrbitBridger --output bindings/ERC20OrbitBridger/ERC20OrbitBridger.go --hardhat web3/artifacts/contracts/bridge/ERC20OrbitBridger.sol/ERC20OrbitBridger.json --cli --struct ERC20OrbitBridger

bindings/utils/NativeBalances.go: hardhat
	mkdir -p bindings/utils/NativeBalances
	seer evm generate --package NativeBalances --output bindings/utils/NativeBalances/NativeBalances.go --hardhat web3/artifacts/contracts/utils/NativeBalances.sol/NativeBalances.json --cli --struct NativeBalances

bindings: bindings/ERC20/ERC20.go bindings/TokenFaucet/TokenFaucet.go bindings/WrappedNativeToken/WrappedNativeToken.go bindings/Staker/Staker.go bindings/MockERC20/MockERC20.go bindings/MockERC721/MockERC721.go bindings/MockERC1155/MockERC1155.go bindings/PositionMetadata/PositionMetadata.go bindings/Metronome/Metronome.go bindings/TokenSender/TokenSender.go bindings/utils/diamonds/Diamonds.go bindings/utils/security/Terminus.go bindings/ETHOrbitBridger/ETHOrbitBridger.go bindings/USDCOrbitBridger/USDCOrbitBridger.go bindings/ERC20OrbitBridger/ERC20OrbitBridger.go bindings/utils/NativeBalances.go

test-web3:
	cd web3 && npx hardhat test

test-graffiti:
	go test ./cmd/graffiti -v

test: test-web3 test-graffiti

clean:
	rm -rf bindings/ERC20/* bin/* bindings/TokenFaucet/* bindings/WrappedNativeToken/* bindings/Staker/* bindings/MockERC20/* bindings/MockERC721/* bindings/MockERC1155/* bindings/PositionMetadata/* bindings/TokenSender/* bindings/utils/* bindings/security/* bindings/ETHOrbitBridger/*

clean-web3:
	rm -rf web3/node_modules web3/artifacts

deepclean: clean clean-web3

hardhat:
	cd web3 && npm install && npx hardhat compile

gitmodule:
	git submodule update --init --recursive
