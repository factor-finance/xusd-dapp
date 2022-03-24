import { InjectedConnector } from '@web3-react/injected-connector'
import { WalletConnectConnector } from '@web3-react/walletconnect-connector'
import { WalletLinkConnector } from '@web3-react/walletlink-connector'
import { SafeAppConnector } from '@gnosis.pm/safe-apps-web3-react'
import { LedgerConnector } from '@web3-react/ledger-connector'
import { get } from 'lodash'

const POLLING_INTERVAL = 12000
const RPC_PROVIDER = process.env.ETHEREUM_RPC_PROVIDER
const CHAIN_ID = parseInt(process.env.ETHEREUM_RPC_CHAIN_ID) || 43114

export const injectedConnector = new InjectedConnector({
  supportedChainIds: [CHAIN_ID],
})

export const gnosisConnector = () => {
  let gnosisConnectorCache
  if (!process.browser) return
  if (!gnosisConnectorCache) gnosisConnectorCache = new SafeAppConnector()
  return gnosisConnectorCache
}

export const walletLinkConnector = new WalletLinkConnector({
  url: RPC_PROVIDER,
  appName: 'XUSD.fi',
  appLogoUrl: 'https://app.xusd.fi/images/xusd-logo-512x512.png',
  darkMode: false,
  supportedChainIds: [CHAIN_ID],
})

const walletConnectRpc = {}
walletConnectRpc[CHAIN_ID] = RPC_PROVIDER

export const walletConnectConnector = new WalletConnectConnector({
  rpc: walletConnectRpc,
  pollingInterval: POLLING_INTERVAL,
})

// Clear WalletConnect's state on disconnect
walletConnectConnector.on('disconnect', () => {
  console.log('Cleaning up...')
  delete localStorage.walletconnect
})

export const ledgerConnector = new LedgerConnector({
  chainId: CHAIN_ID,
  url: RPC_PROVIDER,
})

export const connectorNameIconMap = {
  MetaMask: 'metamask-icon.svg',
  Ledger: 'ledger-icon.svg',
  'Coinbase Wallet': 'coinbase-icon.svg',
  WalletConnect: 'walletconnect-icon.svg',
}

export const getConnectorIcon = (name) =>
  get(connectorNameIconMap, name, 'default-wallet-icon.svg')
