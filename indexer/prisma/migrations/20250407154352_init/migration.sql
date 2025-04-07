-- CreateEnum
CREATE TYPE "NETWOEK" AS ENUM ('BNB', 'Avalanche');

-- CreateTable
CREATE TABLE "TransactionData" (
    "id" SERIAL NOT NULL,
    "txHash" TEXT NOT NULL,
    "isDone" BOOLEAN NOT NULL DEFAULT false,
    "tokenAddress" TEXT NOT NULL,
    "amount" TEXT NOT NULL,
    "sender" TEXT NOT NULL,
    "network" TEXT NOT NULL,
    "nonce" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TransactionData_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NetworkStatus" (
    "id" SERIAL NOT NULL,
    "network" "NETWOEK" NOT NULL,
    "lastProcessedBlock" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NetworkStatus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Nonce" (
    "id" SERIAL NOT NULL,
    "nonce" INTEGER NOT NULL DEFAULT 0,
    "network" "NETWOEK" NOT NULL,

    CONSTRAINT "Nonce_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TransactionData_txHash_key" ON "TransactionData"("txHash");

-- CreateIndex
CREATE UNIQUE INDEX "NetworkStatus_network_key" ON "NetworkStatus"("network");

-- CreateIndex
CREATE UNIQUE INDEX "Nonce_network_key" ON "Nonce"("network");
