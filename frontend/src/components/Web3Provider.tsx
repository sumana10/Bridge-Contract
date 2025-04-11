import { WagmiProvider, createConfig } from "wagmi";
import { bscTestnet, polygonAmoy } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConnectKitProvider, getDefaultConfig } from "connectkit";

const config = createConfig(
    getDefaultConfig({
        chains: [polygonAmoy, bscTestnet],
        walletConnectProjectId: import.meta.env.VITE_API_PROJECTID,
        appName: import.meta.env.VITE_API_PROJECT_NAME,
        appDescription: import.meta.env.VITE_API_PROJECT_DESC
    }),
);

const queryClient = new QueryClient();

export const Web3Provider = ({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) => {
    return (
        <WagmiProvider config={config}>
            <QueryClientProvider client={queryClient}>
                <ConnectKitProvider customTheme={{
                    "--ck-body-background": `#d6a4a4`,
                    "--ck-body-color": "#323232",
                    "--ck-body-color-muted": "#323232",
                    "--ck-primary-button-background": `#dae2f8`,
                    "--ck-primary-button-color": "#323232",
                    "--ck-primary-button-hover-background": "#dae2f8",
                    "--ck-secondary-button-background": "#dae2f8",
                    "--ck-secondary-button-hover-background": "#dae2f8",
                    "--ck-tooltip-background": "#dae2f8",
                    "--ck-secondary-button-color": "#323232",
                    "--ck-body-action-color": "#dae2f8",
                }}>
                    {children}
                </ConnectKitProvider>
            </QueryClientProvider>
        </WagmiProvider>
    );
};
