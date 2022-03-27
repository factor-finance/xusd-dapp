const chainIdToNetwork = {
  43114: {
    network: 'Mainnet',
    fullName: 'Avalanche C-Chain',
    rpcUrl: 'https://api.avax.network/ext/bc/C/rpc',
    scanUri: 'https://snowtrace.io',
  },
  43113: {
    network: 'Fuji',
    fullName: 'C-Chain (Fuji)',
    rpcUrl: 'https://api.avax-test.network/ext/bc/C/rpc',
    scanUri: 'https://testnet.snowtrace.io',
  },
  43112: {
    network: 'Localhost',
    fullName: 'Local RPC',
    rpcUrl: process.env.ETHEREUM_RPC_PROVIDER || 'http://localhost:8545/',
  },
}

// The chainId the dapp wants to use. There can be only one.
const CHAIN_ID = parseInt(process.env.ETHEREUM_RPC_CHAIN_ID) || 43114

export function isCorrectNetwork(chainId) {
  return chainId === CHAIN_ID
}

export async function switchEthereumChain() {
  await window.ethereum.request({
    method: 'wallet_switchEthereumChain',
    params: [{ chainId: '0x' + CHAIN_ID.toString(16) }],
  })
}

export function getEtherscanHost(web3React) {
  if (
    chainIdToNetwork[web3React.chainId] &&
    chainIdToNetwork[web3React.chainId].scanUri
  ) {
    return chainIdToNetwork[web3React.chainId].scanUri
  } else {
    // by default just return mainNet url
    return chainIdToNetwork[43114].scanUri
  }
}

export function shortenAddress(address) {
  if (!address || address.length < 10) {
    return address
  }

  return `${address.substring(0, 5)}...${address.substring(address.length - 5)}`
}

export function networkIdToName(chainId) {
  return chainIdToNetwork[chainId] && chainIdToNetwork[chainId].network
}

export function truncateAddress(address) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

let web3
export function trackXUSDInWallet(xusdAddress) {
  web3.currentProvider.sendAsync(
    {
      method: 'wallet_watchAsset',
      params: {
        type: 'ERC20',
        options: {
          address: xusdAddress,
          symbol: 'XUSD',
          decimals: 18,
          image: 'https://app.xusd.fi/images/currency/xusd-icon-small.svg',
        },
      },
    },
    console.log
  )
}

export function addNetwork(chainId) {
  if (!chainIdToNetwork[chainId]) return
  web3.currentProvider.sendAsync(
    {
      method: 'wallet_addEthereumChain',
      params: {
        chainId,
        chainName: chainIdToNetwork[chainId].fullName,
        nativeCurrency: {
          name: 'Avalanche',
          symbol: 'AVAX',
          decimals: 18,
        },
        rpcUrls: [chainIdToNetwork[chainId].rpcUrl],
        blockExplorerUrls: [chainIdToNetwork[chainId].scanUri],
      },
    },
    console.log
  )
}

/* status of token wallets and XUSD:
 * https://docs.google.com/spreadsheets/d/1bunkxBxfkAVz9C14vAFH8CZ53rImDNHTXp94AOEjpq0/edit#gid=1608902436
 */
export function providersNotAutoDetectingXUSD() {
  return ['metamask', 'trust', 'alphawallet', 'mist', 'parity']
}

export function providerName() {
  if (!process.browser) {
    return null
  }

  const { ethereum = {}, web3 = {} } = window

  if (ethereum.isMetaMask) {
    return 'metamask'
  } else if (ethereum.isImToken) {
    return 'imtoken'
  } else if (typeof window.__CIPHER__ !== 'undefined') {
    return 'cipher'
  } else if (!web3.currentProvider) {
    return null
  } else if (web3.currentProvider.isToshi) {
    return 'coinbase'
  } else if (web3.currentProvider.isTrust) {
    return 'trust'
  } else if (web3.currentProvider.isGoWallet) {
    return 'gowallet'
  } else if (web3.currentProvider.isAlphaWallet) {
    return 'alphawallet'
  } else if (web3.currentProvider.isStatus) {
    return 'status'
  } else if (web3.currentProvider.constructor.name === 'EthereumProvider') {
    return 'mist'
  } else if (web3.currentProvider.constructor.name === 'Web3FrameProvider') {
    return 'parity'
  } else if (
    web3.currentProvider.host &&
    web3.currentProvider.host.indexOf('infura') !== -1
  ) {
    return 'infura'
  } else if (
    web3.currentProvider.host &&
    web3.currentProvider.host.indexOf('localhost') !== -1
  ) {
    return 'localhost'
  }

  return 'unknown'
}
