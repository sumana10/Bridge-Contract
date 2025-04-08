export const addTransaction = (tx) => {
    try {
        const storedTxs = localStorage.getItem('bridgeTransactions');
        const txs = storedTxs ? JSON.parse(storedTxs) : [];
        const newTx = { ...tx, timestamp: Date.now() };
        localStorage.setItem('bridgeTransactions', JSON.stringify([newTx, ...txs]));
        return newTx;
    } catch (error) {
        console.error("Error saving transaction:", error);
        return null;
    }
};

export const updateTransaction = (hash, updates) => {
    try {
        const storedTxs = localStorage.getItem('bridgeTransactions');
        if (!storedTxs) return null;

        const txs = JSON.parse(storedTxs);
        const updatedTxs = txs.map(tx =>
            tx.hash === hash ? { ...tx, ...updates } : tx
        );

        localStorage.setItem('bridgeTransactions', JSON.stringify(updatedTxs));
        return updatedTxs.find(tx => tx.hash === hash);
    } catch (error) {
        console.error("Error updating transaction:", error);
        return null;
    }
};

export const getTransactions = (address = null) => {
    try {
        const storedTxs = localStorage.getItem('bridgeTransactions');
        if (!storedTxs) return [];

        const txs = JSON.parse(storedTxs);

        if (address) {
            return txs.filter(tx =>
                tx.userAddress?.toLowerCase() === address?.toLowerCase()
            );
        }

        return txs;
    } catch (error) {
        console.error("Error retrieving transactions:", error);
        return [];
    }
};
