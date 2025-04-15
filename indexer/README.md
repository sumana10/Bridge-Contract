# Cross-Chain Bridge Service Workflow Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        Application Initialization                        │
└───────────────────────────────────┬─────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        Database Connection Test                          │
│                                                                         │
│  • Query networkStatus, transactionData, and nonce tables               │
│  • Exit process if connection fails                                     │
└───────────────────────────────────┬─────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                     Initialize Blockchain Providers                      │
│                                                                         │
│  • Create WebSocket or HTTP providers for BNB and Amoy networks         │
│  • Set up contract instances with ABI                                   │
│  • Configure automatic reconnection for WebSocket providers             │
└───────────────────────────────────┬─────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      Initialize Event Listeners                          │
│                                                                         │
│  • Call listenToBridgeEvents() for both networks                        │
│  • Set up event handlers for "Bridge" events                            │
└───────────────────────────────────┬─────────────────────────────────────┘
                                    │
                                    ▼
                 ┌─────────────────────────────────────┐
                 │         Continuous Monitoring        │
                 └──────────┬─────────────┬─────────────┘
                            │             │
        ┌───────────────────┘             └────────────────┐
        ▼                                                  ▼
┌─────────────────────────┐                    ┌─────────────────────────┐
│  Provider Health Check  │                    │     Block Heartbeat     │
│    (Every 30 seconds)   │                    │    (Every 15 seconds)   │
│                         │                    │                         │
│ • Check if providers    │                    │ • Get current block     │
│   are connected         │                    │   numbers               │
│ • Reinitialize if       │                    │ • Compare with last     │
│   disconnected          │                    │   processed blocks      │
└───────────┬─────────────┘                    │ • Trigger event sync    │
            │                                  │   if > 5 blocks behind  │
            │                                  └───────────┬─────────────┘
            │                                              │
            └──────────────────┬───────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         Event Processing Flow                            │
└───────────────────────────────────┬─────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                       listenToBridgeEvents Function                      │
│                                                                         │
│  1. Get last processed block from database                              │
│  2. Get current block from blockchain                                   │
│  3. If gap exists, fetch historical events                              │
│  4. Process historical events and add to queue                          │
│  5. Update last processed block                                         │
│  6. Set up real-time event listener                                     │
└───────────────────────────────────┬─────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          Bridge Event Detected                           │
│                                                                         │
│  • Extract token address, amount, sender from event                     │
│  • Add job to Bull queue                                                │
│  • Update last processed block                                          │
└───────────────────────────────────┬─────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           Job Queue Processing                           │
│                                                                         │
│  1. Check if transaction exists in database                             │
│  2. If new, get unique nonce and create transaction record              │
│  3. If already processed (isDone=true), skip                            │
│  4. Execute transferToken function                                      │
│  5. Mark transaction as done after successful transfer                  │
└───────────────────────────────────┬─────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                            Token Transfer                                │
│                                                                         │
│  1. Create provider for target network                                  │
│  2. Create wallet with private key                                      │
│  3. Call redeem() on bridge contract                                    │
│  4. Wait for transaction confirmation                                   │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                         Error Handling & Cleanup                         │
└───────────────────────────────────┬─────────────────────────────────────┘
                                    │
                 ┌─────────────────────────────────────┐
                 │        Global Error Handlers        │
                 │                                     │
                 │  • uncaughtException handler        │
                 │  • unhandledRejection handler       │
                 └─────────────────────────────────────┘

                 ┌─────────────────────────────────────┐
                 │         Graceful Shutdown           │
                 │                                     │
                 │  • SIGINT handler                   │
                 │  • Remove event listeners           │
                 │  • Close providers                  │
                 │  • Close queue and database         │
                 └─────────────────────────────────────┘
```

## Key Components and Data Flow

1. **Initialization**:
   - Test database connection
   - Create blockchain providers for BNB and Amoy networks
   - Initialize event listeners

2. **Continuous Monitoring**:
   - Provider health check every 30 seconds
   - Block heartbeat check every 15 seconds
   - Automatic reconnection and reinitialization

3. **Event Detection**:
   - Listen for "Bridge" events on both networks
   - Process historical events during gaps
   - Add detected events to job queue

4. **Job Processing**:
   - Check for duplicate transactions
   - Assign unique nonces
   - Execute cross-chain transfers
   - Update transaction status

5. **Error Handling & Cleanup**:
   - Global error handlers for uncaught exceptions
   - Graceful shutdown on SIGINT
   - Resource cleanup (providers, listeners, queue, database)
