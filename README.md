# Cross-Chain Token Bridge

A decentralized bridge enabling token transfers between BNB Smart Chain Testnet and Polygon Amoy Testnet. Tokens are locked on the source chain and minted on the destination chain to ensure secure and consistent transfers.

The system includes smart contracts on both chains, a WebSocket listener for blockchain events, a queue for handling cross-chain transactions, and a frontend for user interaction. It ensures safety through nonce tracking and token whitelisting, offering a reliable bridge experience end to end.


## Sequence Diagram

<img width="1427" alt="Uml Sequence" src="https://jad7ulghye.ufs.sh/f/hb6AeldjPrMw3xSXWjIIHdJleTQU4jSfurMW7CxbzK6tPhRA" />


## Technical Implementation

### WebSocket Listener
- **Event-Based Architecture**: Uses WebSocket connections to listen for Bridge events in real-time.
- **Dual Chain Monitoring**: Monitors both BNB Smart Chain and Polygon Amoy networks simultaneously.
- **Block Tracking**: Maintains the last processed block per network to prevent missed events during reconnections.
- **Historical Processing**: On startup, processes historical events from the last known block.

### Bridge Queue
- **Transaction Processing**: Handles bridge events sequentially.
- **Nonce Management**: Keeps sequential nonces per network to avoid replay attacks.
- **Database Integration**: Uses PostgreSQL to store transaction data, network statuses, and nonces.
- **Transaction Verification**: Ensures no duplicate transactions by verifying existence before processing.
- **Gas Optimization**: Adjusts gas prices dynamically based on network conditions.

### Smart Contracts
- **Token Locking**: Locks tokens on the source chain when a bridge transaction is initiated.
- **Token Release**: Releases tokens on the destination chain upon valid event processing.
- **Access Control**: Only bridge owner can execute token release.
- **Token Whitelisting**: Maintains a whitelist of tokens allowed for bridging.
- **Amount Limits**: Sets min and max bridge limits to prevent abuse.
- **Event Emission**: Emits Bridge events with all required metadata.
- **Nonce Verification**: Prevents replay attacks using nonce checks.


## Video Demo
  
[![Video Demo](https://img.youtube.com/vi/5SE1Bx1tve8/maxresdefault.jpg)](https://www.youtube.com/watch?v=5SE1Bx1tve8)

