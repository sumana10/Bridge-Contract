// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import {Test, console} from "forge-std/Test.sol";
import {BridgeContract} from "../src/BridgeContract.sol";
import {EtherERC20} from "../src/EtherERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract BridgeContractTest is Test {
    BridgeContract public bridge;
    EtherERC20 public token;
    
    address public owner = address(1);
    address public user = address(2);
    
    uint256 public constant INITIAL_SUPPLY = 1_000_000 ether;
    uint256 public constant BRIDGE_AMOUNT = 100 ether;
    uint256 public constant MAX_AMOUNT = 500 ether;
    uint256 public constant MIN_AMOUNT = 10 ether;

    event Bridge(IERC20 indexed token, uint256 amount, address indexed sender);
    event Redeem(IERC20 indexed token, address indexed to, uint256 amount);
    event TokenWhitelisted(IERC20 indexed token, bool status);
    event MaxAmountUpdated(IERC20 indexed token, uint256 maxAmount);
    event MinAmountUpdated(IERC20 indexed token, uint256 minAmount);

    function setUp() public {
        vm.startPrank(owner);
        bridge = new BridgeContract();
        token = new EtherERC20();
        
        // Whitelist the token
        bridge.setTokenWhitelist(IERC20(address(token)), true);
        
        // Set max and min amounts
        bridge.setMaxAmount(IERC20(address(token)), MAX_AMOUNT);
        bridge.setMinAmount(IERC20(address(token)), MIN_AMOUNT);
        
        // Transfer some tokens to the user
        token.transfer(user, INITIAL_SUPPLY / 2);
        vm.stopPrank();
    }

    function testBridgeTokens() public {
        vm.startPrank(user);
        
        // Approve tokens for the bridge
        token.approve(address(bridge), BRIDGE_AMOUNT);
        
        // Check initial balances
        uint256 userBalanceBefore = token.balanceOf(user);
        uint256 bridgeBalanceBefore = token.balanceOf(address(bridge));
        
        // Expect the Bridge event to be emitted
        vm.expectEmit(true, true, false, true);
        emit Bridge(IERC20(address(token)), BRIDGE_AMOUNT, user);
        
        // Bridge tokens
        bridge.bridge(IERC20(address(token)), BRIDGE_AMOUNT);
        
        // Check final balances
        uint256 userBalanceAfter = token.balanceOf(user);
        uint256 bridgeBalanceAfter = token.balanceOf(address(bridge));
        
        assertEq(userBalanceAfter, userBalanceBefore - BRIDGE_AMOUNT, "User balance should decrease");
        assertEq(bridgeBalanceAfter, bridgeBalanceBefore + BRIDGE_AMOUNT, "Bridge balance should increase");
        
        vm.stopPrank();
    }

    function testRedeemTokens() public {
        // First bridge some tokens
        vm.startPrank(user);
        token.approve(address(bridge), BRIDGE_AMOUNT);
        bridge.bridge(IERC20(address(token)), BRIDGE_AMOUNT);
        vm.stopPrank();
        
        // Redeem tokens as owner
        vm.startPrank(owner);
        
        // Check initial balances
        uint256 recipientBalanceBefore = token.balanceOf(user);
        uint256 bridgeBalanceBefore = token.balanceOf(address(bridge));
        
        // Expect the Redeem event to be emitted
        vm.expectEmit(true, true, false, true);
        emit Redeem(IERC20(address(token)), user, BRIDGE_AMOUNT);
        
        // Redeem tokens
        bridge.redeem(IERC20(address(token)), user, BRIDGE_AMOUNT, 1); // nonce should be 1
        
        // Check final balances
        uint256 recipientBalanceAfter = token.balanceOf(user);
        uint256 bridgeBalanceAfter = token.balanceOf(address(bridge));
        
        assertEq(recipientBalanceAfter, recipientBalanceBefore + BRIDGE_AMOUNT, "Recipient balance should increase");
        assertEq(bridgeBalanceAfter, bridgeBalanceBefore - BRIDGE_AMOUNT, "Bridge balance should decrease");
        assertEq(bridge.nonce(), 1, "Nonce should be updated");
        
        vm.stopPrank();
    }

    function testWhitelistToken() public {
        // Create a new token
        vm.startPrank(owner);
        EtherERC20 newToken = new EtherERC20();
        
        // Expect the TokenWhitelisted event to be emitted
        vm.expectEmit(true, false, false, true);
        emit TokenWhitelisted(IERC20(address(newToken)), true);
        
        // Whitelist the token
        bridge.setTokenWhitelist(IERC20(address(newToken)), true);
        
        // Check if token is whitelisted
        assertTrue(bridge.whitelistedTokens(IERC20(address(newToken))), "Token should be whitelisted");
        
        // Unwhitelist the token
        bridge.setTokenWhitelist(IERC20(address(newToken)), false);
        
        // Check if token is not whitelisted
        assertFalse(bridge.whitelistedTokens(IERC20(address(newToken))), "Token should not be whitelisted");
        
        vm.stopPrank();
    }

    function testSetMaxAmount() public {
        uint256 newMaxAmount = 1000 ether;
        
        vm.startPrank(owner);
        
        // Expect the MaxAmountUpdated event to be emitted
        vm.expectEmit(true, false, false, true);
        emit MaxAmountUpdated(IERC20(address(token)), newMaxAmount);
        
        // Set max amount
        bridge.setMaxAmount(IERC20(address(token)), newMaxAmount);
        
        // Check max amount
        assertEq(bridge.maxAmounts(IERC20(address(token))), newMaxAmount, "Max amount should be updated");
        
        vm.stopPrank();
    }

    function testSetMinAmount() public {
        uint256 newMinAmount = 5 ether;
        
        vm.startPrank(owner);
        
        // Expect the MinAmountUpdated event to be emitted
        vm.expectEmit(true, false, false, true);
        emit MinAmountUpdated(IERC20(address(token)), newMinAmount);
        
        // Set min amount
        bridge.setMinAmount(IERC20(address(token)), newMinAmount);
        
        // Check min amount
        assertEq(bridge.minAmounts(IERC20(address(token))), newMinAmount, "Min amount should be updated");
        
        vm.stopPrank();
    }

    function testRecoverTokens() public {
        // First bridge some tokens
        vm.startPrank(user);
        token.approve(address(bridge), BRIDGE_AMOUNT);
        bridge.bridge(IERC20(address(token)), BRIDGE_AMOUNT);
        vm.stopPrank();
        
        vm.startPrank(owner);
        
        // Check initial balances
        uint256 ownerBalanceBefore = token.balanceOf(owner);
        uint256 bridgeBalanceBefore = token.balanceOf(address(bridge));
        
        // Recover tokens
        bridge.recoverTokens(IERC20(address(token)), BRIDGE_AMOUNT);
        
        // Check final balances
        uint256 ownerBalanceAfter = token.balanceOf(owner);
        uint256 bridgeBalanceAfter = token.balanceOf(address(bridge));
        
        assertEq(ownerBalanceAfter, ownerBalanceBefore + BRIDGE_AMOUNT, "Owner balance should increase");
        assertEq(bridgeBalanceAfter, bridgeBalanceBefore - BRIDGE_AMOUNT, "Bridge balance should decrease");
        
        vm.stopPrank();
    }

    // Error cases
    function testCannotBridgeNonWhitelistedToken() public {
        // Create a non-whitelisted token
        vm.startPrank(owner);
        EtherERC20 nonWhitelistedToken = new EtherERC20();
        nonWhitelistedToken.transfer(user, INITIAL_SUPPLY / 2);
        vm.stopPrank();
        
        vm.startPrank(user);
        nonWhitelistedToken.approve(address(bridge), BRIDGE_AMOUNT);
        
        // Expect revert
        vm.expectRevert(BridgeContract.BridgeContract__Token_Not_Whitelisted.selector);
        bridge.bridge(IERC20(address(nonWhitelistedToken)), BRIDGE_AMOUNT);
        
        vm.stopPrank();
    }

    function testCannotBridgeAmountTooLarge() public {
        vm.startPrank(user);
        
        // Approve tokens for the bridge
        token.approve(address(bridge), MAX_AMOUNT + 1 ether);
        
        // Expect revert
        vm.expectRevert(BridgeContract.BridgeContract__Amount_Too_Large.selector);
        bridge.bridge(IERC20(address(token)), MAX_AMOUNT + 1 ether);
        
        vm.stopPrank();
    }

    function testCannotBridgeAmountTooSmall() public {
        vm.startPrank(user);
        
        // Approve tokens for the bridge
        token.approve(address(bridge), MIN_AMOUNT - 1);
        
        // Expect revert
        vm.expectRevert(BridgeContract.BridgeContract__Amount_Too_Small.selector);
        bridge.bridge(IERC20(address(token)), MIN_AMOUNT - 1);
        
        vm.stopPrank();
    }

    function testCannotBridgeWithInsufficientAllowance() public {
        vm.startPrank(user);
        
        // Approve less tokens than needed
        token.approve(address(bridge), BRIDGE_AMOUNT - 1);
        
        // Expect revert
        vm.expectRevert(BridgeContract.BridgeContract__Insufficient_Allowance.selector);
        bridge.bridge(IERC20(address(token)), BRIDGE_AMOUNT);
        
        vm.stopPrank();
    }

    function testCannotRedeemWithInvalidNonce() public {
        // First bridge some tokens
        vm.startPrank(user);
        token.approve(address(bridge), BRIDGE_AMOUNT);
        bridge.bridge(IERC20(address(token)), BRIDGE_AMOUNT);
        vm.stopPrank();
        
        vm.startPrank(owner);
        
        // Expect revert with invalid nonce (should be 1, not 2)
        vm.expectRevert(BridgeContract.BridgeContract__Invalid_Nonce.selector);
        bridge.redeem(IERC20(address(token)), user, BRIDGE_AMOUNT, 2);
        
        // Expect revert with invalid nonce (should be 1, not 0)
        vm.expectRevert(BridgeContract.BridgeContract__Invalid_Nonce.selector);
        bridge.redeem(IERC20(address(token)), user, BRIDGE_AMOUNT, 0);
        
        vm.stopPrank();
    }

    function testCannotRedeemNonWhitelistedToken() public {
        // Create a non-whitelisted token
        vm.startPrank(owner);
        EtherERC20 nonWhitelistedToken = new EtherERC20();
        
        // Expect revert
        vm.expectRevert(BridgeContract.BridgeContract__Token_Not_Whitelisted.selector);
        bridge.redeem(IERC20(address(nonWhitelistedToken)), user, BRIDGE_AMOUNT, 1);
        
        vm.stopPrank();
    }

    function test_RevertWhen_TransferFailsInRedeem() public {
        // First bridge some tokens
        vm.startPrank(user);
        token.approve(address(bridge), BRIDGE_AMOUNT);
        bridge.bridge(IERC20(address(token)), BRIDGE_AMOUNT);
        vm.stopPrank();
        
        // Set token to fail transfers
        vm.startPrank(owner);
        token.setFailTransfers(true);
        
        // Expect revert when redeeming
        vm.expectRevert(BridgeContract.BridgeContract__Transaction_Failed.selector);
        bridge.redeem(IERC20(address(token)), user, BRIDGE_AMOUNT, 1);
        
        // Reset token to not fail transfers
        token.setFailTransfers(false);
        vm.stopPrank();
    }

    function test_RevertWhen_TransferFailsInRecoverTokens() public {
        // First bridge some tokens
        vm.startPrank(user);
        token.approve(address(bridge), BRIDGE_AMOUNT);
        bridge.bridge(IERC20(address(token)), BRIDGE_AMOUNT);
        vm.stopPrank();
        
        // Set token to fail transfers
        vm.startPrank(owner);
        token.setFailTransfers(true);
        
        // Expect revert when recovering tokens
        vm.expectRevert(BridgeContract.BridgeContract__Transaction_Failed.selector);
        bridge.recoverTokens(IERC20(address(token)), BRIDGE_AMOUNT);
        
        // Reset token to not fail transfers
        token.setFailTransfers(false);
        vm.stopPrank();
    }

    function testOnlyOwnerCanRedeem() public {
        vm.startPrank(user);
        
        // Expect revert
        vm.expectRevert();
        bridge.redeem(IERC20(address(token)), user, BRIDGE_AMOUNT, 1);
        
        vm.stopPrank();
    }

    function testOnlyOwnerCanSetWhitelist() public {
        vm.startPrank(user);
        
        // Expect revert
        vm.expectRevert();
        bridge.setTokenWhitelist(IERC20(address(token)), false);
        
        vm.stopPrank();
    }

    function testOnlyOwnerCanSetMaxAmount() public {
        vm.startPrank(user);
        
        // Expect revert
        vm.expectRevert();
        bridge.setMaxAmount(IERC20(address(token)), 1000 ether);
        
        vm.stopPrank();
    }

    function testOnlyOwnerCanSetMinAmount() public {
        vm.startPrank(user);
        
        // Expect revert
        vm.expectRevert();
        bridge.setMinAmount(IERC20(address(token)), 5 ether);
        
        vm.stopPrank();
    }

    function testOnlyOwnerCanRecoverTokens() public {
        vm.startPrank(user);
        
        // Expect revert
        vm.expectRevert();
        bridge.recoverTokens(IERC20(address(token)), BRIDGE_AMOUNT);
        
        vm.stopPrank();
    }
}
