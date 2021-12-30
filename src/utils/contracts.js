import { ethers, Contract, BigNumber } from 'ethers'

import ContractStore from 'stores/ContractStore'
import CoinStore from 'stores/CoinStore'
import { aprToApy } from 'utils/math'
import { displayCurrency } from 'utils/math'
import { sleep } from 'utils/utils'

import AccountStore from 'stores/AccountStore'
import YieldStore from 'stores/YieldStore'
import addresses from 'constants/contractAddresses'
import usdtAbi from 'constants/mainnetAbi/usdt.json'
import usdcAbi from 'constants/mainnetAbi/cUsdc.json'
import daiAbi from 'constants/mainnetAbi/dai.json'
import flipperAbi from 'constants/mainnetAbi/flipper.json'

/* fetchId - used to prevent race conditions.
 * Sometimes "setupContracts" is called twice with very little time in between and it can happen
 * that the call issued first (for example with not yet signed in account) finishes after the second
 * call. We must make sure that previous calls to setupContracts don't override later calls Stores
 */
export async function setupContracts(account, library, chainId, fetchId) {
  /* without an account logged in contracts are initialized with JsonRpcProvider and
   * can operate in a read-only mode.
   *
   * Using StaticJsonRpcProvider instead of JsonRpcProvider so it doesn't constantly query
   * the network for the current chainId. In case chainId changes, we rerun setupContracts
   * anyway. And StaticJsonRpcProvider also prevents "detected network changed" errors when
   * running node in forked mode.
   */
  const jsonRpcProvider = new ethers.providers.StaticJsonRpcProvider(
    process.env.ETHEREUM_RPC_PROVIDER,
    { chainId: parseInt(process.env.ETHEREUM_RPC_CHAIN_ID) }
  )

  let provider = jsonRpcProvider

  let walletConnected = false

  // if web3 account signed in change the dapp's "general provider" with the user's web3 provider
  if (account && library) {
    walletConnected = true
    provider = library.getSigner(account)
  }

  const getContract = (address, abi, overrideProvider) => {
    try {
      return new ethers.Contract(
        address,
        abi,
        overrideProvider ? overrideProvider : provider
      )
    } catch (e) {
      console.error(
        `Error creating contract in [getContract] with address:${address} abi:${JSON.stringify(
          abi
        )}`
      )
      throw e
    }
  }

  let network
  try {
    network = require(`../../${chainId === 1 ? 'prod.' : ''}network.json`)
  } catch (e) {
    console.error('network.json file not present')
    // contract addresses not present no need to continue initialisation
    return
  }

  const contracts = {}
  for (const key in network.contracts) {
    // Use Proxy address if one exists
    const address = network.contracts[`${key}Proxy`]
      ? network.contracts[`${key}Proxy`].address
      : network.contracts[key].address

    try {
      contracts[key] = new ethers.Contract(
        address,
        network.contracts[key].abi,
        library ? library.getSigner(account) : null
      )
    } catch (e) {
      console.error(
        `Error creating contract in [setup] with address:${address} name:${key}`
      )
      throw e
    }
  }

  const xusdProxy = contracts['XUSDProxy']
  const vaultProxy = contracts['VaultProxy']

  let usdt,
    dai,
    tusd,
    usdc,
    xusd,
    vault,
    flipper,
    chainlinkEthAggregator,
    chainlinkFastGasAggregator

  let iVaultJson,
    iErc20Json,
    singleAssetStakingJson,
    chainlinkAggregatorV3Json

  try {
    iVaultJson = require('../../abis/IVault.json')
    iErc20Json = require('../../abis/IERC20.json')
    singleAssetStakingJson = require('../../abis/SingleAssetStaking.json')
    chainlinkAggregatorV3Json = require('../../abis/ChainlinkAggregatorV3Interface.json')
  } catch (e) {
    console.error(`Can not find contract artifact file: `, e)
  }

  vault = getContract(vaultProxy.address, iVaultJson.abi)

  xusd = getContract(xusdProxy.address, network.contracts['XUSD'].abi)
  usdt = getContract(addresses.mainnet.USDT, usdtAbi.abi)
  usdc = getContract(addresses.mainnet.USDC, usdcAbi.abi)
  dai = getContract(addresses.mainnet.DAI, daiAbi.abi)
  flipper = getContract(addresses.mainnet.Flipper, flipperAbi)

  chainlinkEthAggregator = getContract(
    addresses.mainnet.chainlinkAVAX_USD,
    chainlinkAggregatorV3Json.abi
  )

  chainlinkFastGasAggregator = getContract(
    addresses.mainnet.chainlinkFAST_GAS,
    chainlinkAggregatorV3Json.abi
  )

  const fetchExchangeRates = async () => {
    const coins = {
      dai: dai,
      usdt: usdt,
      usdc: usdc,
    }
    const xusdExchangeRates = {
      ...ContractStore.currentState.xusdExchangeRates,
    }
    const userActive = AccountStore.currentState.active === 'active'
    // do not fetch anything if the user is not active
    if (!userActive) {
      return
    }

    for (const name in coins) {
      const coin = coins[name]
      try {
        const priceBNMint = await vault.priceUSDMint(coin.address)
        const priceBNRedeem = await vault.priceUSDRedeem(coin.address)
        // Oracle returns with 18 decimal places
        // Also, convert that to USD/<coin> format
        const priceMint = Number(priceBNMint.toString()) / 1000000000000000000
        const priceRedeem =
          Number(priceBNRedeem.toString()) / 1000000000000000000
        xusdExchangeRates[name] = {
          mint: priceMint,
          redeem: priceRedeem,
        }
      } catch (err) {
        console.error('Failed to fetch exchange rate', name, err)
      }
    }

    ContractStore.update((store) => {
      store.xusdExchangeRates = { ...xusdExchangeRates }
    })
  }

  const fetchAPY = async () => {
    try {
      const response = await fetch(process.env.APR_ANALYTICS_ENDPOINT)
      if (response.ok) {
        const json = await response.json()
        const apy = aprToApy(parseFloat(json.apr), 7)
        ContractStore.update((s) => {
          s.apy = apy
        })
      }
    } catch (err) {
      console.error('Failed to fetch APY', err)
    }
  }

  const fetchCreditsPerToken = async () => {
    try {
      const response = await fetch(process.env.CREDITS_ANALYTICS_ENDPOINT)
      if (response.ok) {
        const json = await response.json()
        YieldStore.update((s) => {
          s.currentCreditsPerToken = parseFloat(json.current_credits_per_token)
          s.nextCreditsPerToken = parseFloat(json.next_credits_per_token)
        })
      }
    } catch (err) {
      console.error('Failed to fetch credits per token', err)
    }
  }

  const fetchCreditsBalance = async () => {
    try {
      if (!walletConnected) {
        return
      }
      const credits = await xusd.creditsBalanceOf(account)
      AccountStore.update((s) => {
        s.creditsBalanceOf = ethers.utils.formatUnits(credits[0], 18)
      })
    } catch (err) {
      console.error('Failed to fetch credits balance', err)
    }
  }

  const callWithDelay = () => {
    setTimeout(async () => {
      Promise.all([
        fetchExchangeRates(),
        fetchCreditsPerToken(),
        fetchCreditsBalance(),
        fetchAPY(),
      ])
    }, 2)
  }

  callWithDelay()

  if (ContractStore.currentState.fetchId > fetchId) {
    console.log('Contracts already setup with newer fetchId. Exiting...')
    return
  }

  if (window.fetchInterval) {
    clearInterval(fetchInterval)
  }

  if (walletConnected) {
    // execute in parallel and repeat in an interval
    window.fetchInterval = setInterval(() => {
      callWithDelay()
    }, 20000)
  }

  const contractsToExport = {
    usdt,
    dai,
    tusd,
    usdc,
    xusd,
    vault,
    flipper,
    chainlinkEthAggregator,
    chainlinkFastGasAggregator,
  }

  const coinInfoList = {
    usdt: {
      contract: usdt,
      decimals: 6,
    },
    usdc: {
      contract: usdc,
      decimals: 6,
    },
    dai: {
      contract: dai,
      decimals: 18,
    },
    xusd: {
      contract: xusd,
      decimals: 18,
    },
  }

  ContractStore.update((s) => {
    s.contracts = contractsToExport
    s.coinInfoList = coinInfoList
    s.walletConnected = walletConnected
    s.chainId = chainId
    s.readOnlyProvider = jsonRpcProvider
    s.fetchId = fetchId
  })

  await afterSetup(contractsToExport)

  return contractsToExport
}

// calls to be executed only once after setup
const afterSetup = async ({ vault }) => {
  const redeemFee = await vault.redeemFeeBps()
  YieldStore.update((s) => {
    s.redeemFee = parseFloat(ethers.utils.formatUnits(redeemFee, 4))
  })
}
