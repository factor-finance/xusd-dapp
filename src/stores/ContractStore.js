import { Store } from 'pullstate'
import { BigNumber } from 'ethers'

const ContractStore = new Store({
  contracts: {},
  network: null,
  apy: null,
  xusdExchangeRates: {
    dai: {
      mint: 1,
      redeem: 1,
    },
    usdt: {
      mint: 1,
      redeem: 1,
    },
    usdc: {
      mint: 1,
      redeem: 1,
    },
    usdc_native: {
      mint: 1,
      redeem: 1,
    },
  },
  // 'null' -> default zero state, 'loading' -> loading the estimates
  swapEstimations: null,
  selectedSwap: undefined,
  coinInfoList: {
    usdt: {
      contract: null,
      decimals: 6,
    },
    usdc: {
      contract: null,
      decimals: 6,
    },
    usdc_native: {
      contract: null,
      decimals: 6,
    },
    dai: {
      contract: null,
      decimals: 18,
    },
    xusd: {
      contract: null,
      decimals: 18,
    },
    mix: {
      contract: null,
      decimals: 0,
    },
  },
  chainId: parseInt(process.env.ETHEREUM_RPC_CHAIN_ID),
  walletConnected: false,
  vaultAllocateThreshold: null,
  vaultRebaseThreshold: null,
  gasPrice: BigNumber.from(0),
  isGasPriceUserOverriden: false,
  readOnlyProvider: false,
  showAllContracts: false,
  curveMetapoolUnderlyingCoins: false,
  fetchId: -1,
})

export default ContractStore
