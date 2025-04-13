// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title BridgeContract
 * @dev Facilitates cross-chain token transfers by locking tokens on the source chain
 * and releasing them on the destination chain.
 */
contract BridgeContract is Ownable {
    // Custom errors
    error BridgeContract__Transaction_Failed();
    error BridgeContract__Insufficient_Allowance();
    error BridgeContract__Token_Not_Whitelisted();
    error BridgeContract__Amount_Too_Large();
    error BridgeContract__Amount_Too_Small();
    error BridgeContract__Invalid_Nonce();

    // Events
    event Bridge(IERC20 indexed token, uint256 amount, address indexed sender);
    event Redeem(IERC20 indexed token, address indexed to, uint256 amount);
    event TokenWhitelisted(IERC20 indexed token, bool status);
    event MaxAmountUpdated(IERC20 indexed token, uint256 maxAmount);
    event MinAmountUpdated(IERC20 indexed token, uint256 minAmount);

    // State variables
    uint256 public nonce;
    mapping(IERC20 => bool) public whitelistedTokens;
    mapping(IERC20 => uint256) public maxAmounts;
    mapping(IERC20 => uint256) public minAmounts;
    

    constructor() Ownable(_msgSender()) {}

    /**
     * @dev Locks tokens in the bridge contract on the source chain.
     * @param _tokenAddress The address of the token to bridge
     * @param _amount The amount of tokens to bridge
     */
    function bridge(IERC20 _tokenAddress, uint256 _amount) public {
        // Validate token and amount
        if (!whitelistedTokens[_tokenAddress]) revert BridgeContract__Token_Not_Whitelisted(); 
        if (_amount > maxAmounts[_tokenAddress] && maxAmounts[_tokenAddress] > 0)
            revert BridgeContract__Amount_Too_Large(); 
        if (_amount < minAmounts[_tokenAddress] && minAmounts[_tokenAddress] > 0)
            revert BridgeContract__Amount_Too_Small();
        
        // Check allowance
        if (_tokenAddress.allowance(_msgSender(), address(this)) < _amount)
            revert BridgeContract__Insufficient_Allowance();
        
        // Transfer tokens from sender to bridge
        bool success = _tokenAddress.transferFrom(_msgSender(), address(this), _amount);
        if (!success) revert BridgeContract__Transaction_Failed();
        
        // Emit bridge event
        emit Bridge(_tokenAddress, _amount, _msgSender());
    }

    /**
     * @dev Releases tokens from the bridge contract on the destination chain.
     * @param _tokenAddress The address of the token to release
     * @param _to The address to receive the tokens
     * @param _amount The amount of tokens to release
     * @param _nonce The sequential nonce for this operation
     */
    function redeem(
        IERC20 _tokenAddress,
        address _to,
        uint256 _amount,
        uint256 _nonce
    ) external onlyOwner {
        // Validate token and nonce
        if (!whitelistedTokens[_tokenAddress]) revert BridgeContract__Token_Not_Whitelisted();
        if (_nonce != nonce + 1) revert BridgeContract__Invalid_Nonce();
        
        // Transfer tokens to recipient
        bool success = _tokenAddress.transfer(_to, _amount);
        if (!success) revert BridgeContract__Transaction_Failed();
        
        // Update nonce
        nonce = _nonce;
        
        // Emit redeem event
        emit Redeem(_tokenAddress, _to, _amount);
    }

    /**
     * @dev Adds or removes a token from the whitelist.
     * @param _tokenAddress The token address to whitelist
     * @param _status Whether the token should be whitelisted
     */
  function setTokenWhitelist(IERC20 _tokenAddress, bool _status) external onlyOwner {
        whitelistedTokens[_tokenAddress] = _status;
        emit TokenWhitelisted(_tokenAddress, _status);
    }
    /**
     * @dev Sets the maximum amount that can be bridged for a token.
     * @param _tokenAddress The token address
     * @param _maxAmount The maximum amount
     */
 
    function setMaxAmount(IERC20 _tokenAddress, uint256 _maxAmount) external onlyOwner {
        maxAmounts[_tokenAddress] = _maxAmount;
        emit MaxAmountUpdated(_tokenAddress, _maxAmount);

    }
    /**
     * @dev Sets the minimum amount that can be bridged for a token.
     * @param _tokenAddress The token address
     * @param _minAmount The minimum amount
     */
    function setMinAmount(IERC20 _tokenAddress, uint256 _minAmount) external onlyOwner {
        minAmounts[_tokenAddress] = _minAmount;
        emit MinAmountUpdated(_tokenAddress, _minAmount);
    }

    /**
     * @dev Recovers tokens accidentally sent to the contract.
     * @param _tokenAddress The token address
     * @param _amount The amount to recover
     */
    function recoverTokens(IERC20 _tokenAddress, uint256 _amount) external onlyOwner {
        bool success = _tokenAddress.transfer(owner(), _amount);
        if (!success) revert BridgeContract__Transaction_Failed();
    }
}
