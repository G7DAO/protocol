import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import { ERC721 } from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import { ERC1155 } from "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";

contract MockERC20 is ERC20 {
    constructor() ERC20("Mock ERC20", "MOCK20") {}

    function mint(address account, uint256 amount) external {
        _mint(account, amount);
    }

    function burn(address account, uint256 amount) external {
        _burn(account, amount);
    }
}

contract MockERC721 is ERC721 {
    constructor() ERC721("Mock ERC721", "MOCK721") {}

    function mint(address account, uint256 tokenId) external {
        _mint(account, tokenId);
    }

    function burn(uint256 tokenId) external {
        _burn(tokenId);
    }
}

contract MockERC1155 is ERC1155 {
    constructor() ERC1155("https://example.com/mock/erc1155.json") {}

    function mint(address account, uint256 tokenId, uint256 amount) external {
        _mint(account, tokenId, amount, "");
    }

    function burn(address account, uint256 tokenId, uint256 amount) external {
        _burn(account, tokenId, amount);
    }
}
