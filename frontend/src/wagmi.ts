import { getDefaultWallets } from '@rainbow-me/rainbowkit'
import { configureChains, createConfig } from 'wagmi'
import { goerli, localhost, mainnet, polygonMumbai } from 'wagmi/chains'
import { publicProvider, } from 'wagmi/providers/public'
import { jsonRpcProvider } from '@wagmi/core/providers/jsonRpc'

const walletConnectProjectId = '5011b7441f2edd4e60c9179ccec41c39'

const { chains, publicClient, webSocketPublicClient } = configureChains(
  [mainnet, polygonMumbai, localhost, ...(import.meta.env?.MODE === 'development' ? [goerli] : [])],
  [
    jsonRpcProvider({
      rpc: () => ({ http: `http://127.0.0.1:7545/` })
    }),
    publicProvider(),
  ],
)

const { connectors } = getDefaultWallets({
  appName: 'ZK-werewolf',
  chains,
  projectId: walletConnectProjectId,
})

export const config = createConfig({
  autoConnect: true,
  connectors,
  publicClient,
  webSocketPublicClient,
})

export { chains }
