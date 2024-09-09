.PHONY: clean generate regenerate test docs redocs hardhat bindings test-graffiti test-web3 clean-web3 deepclean

build: hardhat bindings bin/game7 bin/graffiti

rebuild: clean generate build

bin/game7:
	mkdir -p bin
	go build -o bin/game7 ./cmd/game7

bin/graffiti:
	mkdir -p bin
	go build -o bin/graffiti ./cmd/graffiti

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

bindings/Terminus.go: hardhat
	mkdir -p bindings/Security/Terminus/ERC1155WithTerminusStorage
	seer evm generate --package ERC1155WithTerminusStorage --output bindings/Security/Terminus/ERC1155WithTerminusStorage/ERC1155WithTerminusStorage.go --hardhat web3/artifacts/contracts/security/terminus/ERC1155WithTerminusStorage.sol/ERC1155WithTerminusStorage.json --cli --struct ERC1155WithTerminusStorage
	mkdir -p bindings/Security/Terminus/TerminusFacet
	seer evm generate --package TerminusFacet --output bindings/Security/Terminus/TerminusFacet/TerminusFacet.go --hardhat web3/artifacts/contracts/security/terminus/TerminusFacet.sol/TerminusFacet.json --cli --struct TerminusFacet
	mkdir -p bindings/Security/Terminus/TerminusInitializer
	seer evm generate --package TerminusInitializer --output bindings/Security/Terminus/TerminusInitializer/TerminusInitializer.go --hardhat web3/artifacts/contracts/security/terminus/TerminusInitializer.sol/TerminusInitializer.json --cli --struct TerminusInitializer
	mkdir -p bindings/Security/Terminus/diamond/DiamondTerminus
	seer evm generate --package DiamondTerminus --output bindings/Security/Terminus/diamond/DiamondTerminus/DiamondTerminus.go --hardhat web3/artifacts/contracts/security/terminus/diamond/DiamondTerminus.sol/DiamondTerminus.json --cli --struct DiamondTermiuns
	mkdir -p bindings/Security/Terminus/diamond/facets/TerminusDiamondCutFacet
	seer evm generate --package TerminusDiamondCutFacet --output bindings/Security/Terminus/diamond/facets/TerminusDiamondCutFacet/TerminusDiamondCutFacet.go --hardhat web3/artifacts/contracts/security/terminus/diamond/facets/TerminusDiamondCutFacet.sol/TerminusDiamondCutFacet.json --cli --struct TerminusDiamondCutFacet
	mkdir -p bindings/Security/Terminus/diamond/facets/TerminusDiamondLoupeFacet
	seer evm generate --package TerminusDiamondLoupeFacet --output bindings/Security/terminus/diamond/facets/TerminusDiamondLoupeFacet/TerminusDiamondLoupeFacet.go --hardhat web3/artifacts/contracts/security/terminus/diamond/facets/TerminusDiamondLoupeFacet.sol/TerminusDiamondLoupeFacet.json --cli --struct TerminusDiamondLoupeFacet
	mkdir -p bindings/Security/Terminus/diamond/facets/TerminusOwnershipFacet
	seer evm generate --package TerminusOwnershipFacet --output bindings/Security/Terminus/diamond/facets/TerminusOwnershipFacet/TerminusOwnershipFacet.go --hardhat web3/artifacts/contracts/security/terminus/diamond/facets/TerminusOwnershipFacet.sol/TerminusOwnershipFacet.json --cli --struct TerminusOwnershipFacet

bindings/Dropper/DropperV2.go: hardhat
	mkdir -p bindings/Dropper/DropperV2
	seer evm generate --package DropperFacet --output bindings/Dropper/DropperV2/DropperFacet.go --hardhat web3/artifacts/contracts/drops/dropperv2/DropperFacet.sol/DropperFacet.json --cli --struct DropperFacet
	mkdir -p bindings/Dropper/DropperV2/Diamond/DiamondDropperV2
	seer evm generate --package DiamondDropperV2 --output bindings/Dropper/DropperV2/Diamond/DiamondDropperV2/DiamondDropperV2.go --hardhat web3/artifacts/contracts/drops/dropperv2/diamond/DiamondDropperV2.sol/DiamondDropperV2.json --cli --struct DiamondDropperV2	
	mkdir -p bindings/Dropper/DropperV2/Diamond/facets/DropperV2CutFacet
	seer evm generate --package DropperV2CutFacet --output bindings/Dropper/DropperV2/Diamond/facets/DropperV2CutFacet/DropperV2CutFacet.go --hardhat web3/artifacts/contracts/drops/dropperv2/diamond/facets/DropperV2CutFacet.sol/DropperV2CutFacet.json --cli --struct DropperV2CutFacet
	mkdir -p bindings/Dropper/DropperV2/Diamond/facets/DropperV2LoupeFacet
	seer evm generate --package DropperV2LoupeFacet --output bindings/Dropper/DropperV2/Diamond/facets/DropperV2LoupeFacet/DropperV2LoupeFacet.go --hardhat web3/artifacts/contracts/drops/dropperv2/diamond/facets/DropperV2LoupeFacet.sol/DropperV2LoupeFacet.json --cli --struct DropperV2LoupeFacet
	mkdir -p bindings/Dropper/DropperV2/Diamond/facets/DropperV2OwnershipFacet
	seer evm generate --package DropperV2OwnershipFacet --output bindings/Dropper/DropperV2/Diamond/facets/DropperV2OwnershipFacet/DropperV2OwnershipFacet.go --hardhat web3/artifacts/contracts/drops/dropperv2/diamond/facets/DropperV2OwnershipFacet.sol/DropperV2OwnershipFacet.json --cli --struct DropperV2OwnershipFacet

bindings/Dropper/DropperV3.go: hardhat
	mkdir -p bindings/Dropper/DropperV3
	seer evm generate --package DropperV3Facet --output bindings/Dropper/DropperV3/DropperV3Facet.go --hardhat web3/artifacts/contracts/drops/dropper-V3/DropperV3Facet.sol/DropperV3Facet.json --cli --struct DropperV3Facet	
	mkdir -p bindings/Dropper/DropperV3/Diamond/DiamondDropperV3
	seer evm generate --package DiamondDropperV3 --output bindings/Dropper/DropperV3/Diamond/DiamondDropperV3/DiamondDropperV3.go --hardhat web3/artifacts/contracts/drops/dropper-V3/diamond/DiamondDropperV3.sol/DiamondDropperV3.json --cli --struct DiamondDropperV3
	mkdir -p bindings/Dropper/DropperV3/Diamond/facets/DropperV3CutFacet
	seer evm generate --package DropperV3CutFacet --output bindings/Dropper/DropperV3/Diamond/facets/DropperV3CutFacet/DropperV3CutFacet.go --hardhat web3/artifacts/contracts/drops/dropper-V3/diamond/facets/DropperV3CutFacet.sol/DropperV3CutFacet.json --cli --struct DropperV3CutFacet
	mkdir -p bindings/Dropper/DropperV3/Diamond/facets/DropperV3LoupeFacet
	seer evm generate --package DropperV3LoupeFacet --output bindings/Dropper/DropperV3/Diamond/facets/DropperV3LoupeFacet/DropperV3LoupeFacet.go --hardhat web3/artifacts/contracts/drops/dropper-V3/diamond/facets/DropperV3LoupeFacet.sol/DropperV3LoupeFacet.json --cli --struct DropperV3LoupeFacet
	mkdir -p bindings/Dropper/DropperV3/Diamond/facets/DropperV3OwnershipFacet
	seer evm generate --package DropperV3OwnershipFacet --output bindings/Dropper/DropperV3/Diamond/facets/DropperV3OwnershipFacet/DropperV3OwnershipFacet.go --hardhat web3/artifacts/contracts/drops/dropper-V3/diamond/facets/DropperV3OwnershipFacet.sol/DropperV3OwnershipFacet.json --cli --struct DropperV3OwnershipFacet

	
bindings: bindings/ERC20/ERC20.go bindings/TokenFaucet/TokenFaucet.go bindings/WrappedNativeToken/WrappedNativeToken.go bindings/Staker/Staker.go bindings/MockERC20/MockERC20.go bindings/MockERC721/MockERC721.go bindings/MockERC1155/MockERC1155.go bindings/PositionMetadata/PositionMetadata.go bindings/Terminus.go bindings/Dropper/DropperV2.go bindings/Dropper/DropperV3.go

test-web3:
	cd web3 && npx hardhat test

test-graffiti:
	go test ./cmd/graffiti -v

test: test-web3 test-graffiti

clean:
	rm -rf bindings/ERC20/* bin/* bindings/TokenFaucet/* bindings/WrappedNativeToken/* bindings/Staker/* bindings/MockERC20/* bindings/MockERC721/* bindings/MockERC1155/* bindings/Diamond/* bindings/Security/* bindings/Dropper bindings/PositionMetadata/*

clean-web3:
	rm -rf web3/node_modules web3/artifacts

deepclean: clean clean-web3

hardhat:
	cd web3 && npm install && npx hardhat compile
