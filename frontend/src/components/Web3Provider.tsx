import { WagmiProvider, createConfig } from "wagmi";
import { bscTestnet,polygonAmoy} from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConnectKitProvider, getDefaultConfig } from "connectkit";

const config = createConfig(
    getDefaultConfig({
      chains: [polygonAmoy, bscTestnet],
      walletConnectProjectId:import.meta.env.VITE_API_PROJECTID,
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
                <ConnectKitProvider>
                    {children}
                </ConnectKitProvider>
            </QueryClientProvider>
        </WagmiProvider>
    );
};
