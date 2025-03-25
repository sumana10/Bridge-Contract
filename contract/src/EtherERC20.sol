// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract EtherERC20 is ERC20, Ownable {
    bool public failTransfers;
    uint8 private constant _decimals = 18;

    error BridgeContract__Transaction_Failed();

    constructor() ERC20("Ether Token", "ETK") Ownable(msg.sender) {
        _mint(msg.sender, 1_000_000 * 10 ** decimals());
    }

    /**
     * @dev Returns the number of decimals used for token amounts.
     */
    function decimals() public pure override returns (uint8) {
        return _decimals;
    }

    /**
     * @dev Allows the owner to set whether transfers should fail.
     * Useful for testing error handling in the bridge contract.
     * @param _fail Whether transfers should fail
     */
    function setFailTransfers(bool _fail) external onlyOwner {
        failTransfers = _fail;
    }

    /**
     * @dev Allows the owner to mint additional tokens.
     * @param to Address to receive the minted tokens
     * @param amount Amount of tokens to mint
     */
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    /**
     * @dev Allows token holders to burn their tokens.
     * @param amount Amount of tokens to burn
     */
    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
    }

    /**
     * @dev Allows burning tokens from an account with allowance.
     * @param account Address to burn tokens from
     * @param amount Amount of tokens to burn
     */
    function burnFrom(address account, uint256 amount) external {
        uint256 currentAllowance = allowance(account, msg.sender);
        require(currentAllowance >= amount, "ERC20: burn amount exceeds allowance");
        unchecked {
            _approve(account, msg.sender, currentAllowance - amount);
        }
        _burn(account, amount);
    }

    /**
     * @dev Overrides the transfer function to allow simulating failures.
     */
    function transfer(address to, uint256 amount) public override returns (bool) {
        if (failTransfers) revert BridgeContract__Transaction_Failed();
        return super.transfer(to, amount);
    }

    /**
     * @dev Overrides the transferFrom function to allow simulating failures.
     */
    function transferFrom(address from, address to, uint256 amount) public override returns (bool) {
        if (failTransfers) revert BridgeContract__Transaction_Failed();
        return super.transferFrom(from, to, amount);
    }
}
