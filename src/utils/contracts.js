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
    network = require(`../../${chainId === 43114 ? 'prod.' : ''}network.json`)
  } catch (e) {
    console.error('network.json file not present')
    // contract addresses not present no need to continue initialisation
    return
  }
  let networkKey
  if (network.chainId === '43113') {
    networkKey = 'fuji'
  } else if (network.chainId === '43114') {
    networkKey = 'mainnet'
  } else {
    throw new Error('No network for contracts')
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

  let usdt, dai, tusd, usdc, xusd, vault, chainlinkEthAggregator

  let iVaultJson, chainlinkAggregatorV3Json

  try {
    iVaultJson = require('../../abis/IVault.json')
    chainlinkAggregatorV3Json = require('../../abis/ChainlinkAggregatorV3Interface.json')
  } catch (e) {
    console.error(`Can not find contract artifact file: `, e)
  }

  vault = getContract(vaultProxy.address, iVaultJson.abi)

  xusd = getContract(xusdProxy.address, network.contracts['XUSD'].abi)
  usdt = getContract(addresses[networkKey].USDT, usdtAbi.abi)
  usdc = getContract(addresses[networkKey].USDC, usdcAbi.abi)
  dai = getContract(addresses[networkKey].DAI, daiAbi.abi)

  chainlinkEthAggregator = getContract(
    addresses[networkKey].chainlinkAVAX_USD,
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

  const _rebasingCreditsPerToken = async (block = 'latest') => {
    if (block === 'latest' && ContractStore.rebasingCreditsPerToken) {
      return ContractStore.rebasingCreditsPerToken
    }
    const rebasingCreditsPerTokenHex = await jsonRpcProvider.call(
      {
        to: ContractStore.XUSD,
        data: '0x6691cb3d', // rebasingCreditsPerToken()
      },
      block
    )
    const rebasingCreditsPerToken =
      rebasingCreditsPerTokenHex === '0x'
        ? '0'
        : ethers.utils.formatUnits(rebasingCreditsPerTokenHex, 16)
    if (block === 'latest') {
      ContractStore.update((s) => {
        s.rebasingCreditsPerToken = rebasingCreditsPerToken
      })
    }
    return rebasingCreditsPerToken
  }

  const _rebasingCredits = async (block = 'latest') => {
    if (block === 'latest' && ContractStore.rebasingCredits) {
      return ContractStore.rebasingCredits
    }
    const rebasingCreditsHex = await jsonRpcProvider.call(
      {
        to: ContractStore.XUSD,
        data: '0x077f22b7', // rebasingCreditsPerToken()
      },
      block
    )
    const rebasingCredits =
      rebasingCreditsHex === '0x'
        ? '0'
        : ethers.utils.formatUnits(rebasingCreditsHex, 16)
    if (block === 'latest') {
      ContractStore.update((s) => {
        s.rebasingCredits = rebasingCredits
      })
    }
    return rebasingCredits
  }

  const fetchAPY = async (days = 30) => {
    try {
      const isDemoMode = process.env.ETHEREUM_RPC_CHAIN_ID == 43113
      let current, past
      const block = await jsonRpcProvider.getBlockNumber()

      if (!isDemoMode) {
        // FIXME using block.timestamp to get 30 days ago efficiently
        const pastBlock = block - ((3600 * 24) / 2) * days
        current = await _rebasingCreditsPerToken(block)
        past = await _rebasingCreditsPerToken(pastBlock)
      } else {
        current = 822910590285928237
        past = 837910590285928237
      }
      const ratio = past / current // FIXME maths?
      const apr = ((ratio - 1) * 100 * 365.25) / days
      const apy = aprToApy(apr, days)
      ContractStore.update((s) => {
        s.apy = apy
      })
    } catch (err) {
      console.error('Failed to fetch the APY', err)
    }
  }

  const fetchCreditsPerToken = async () => {
    try {
      // const computedSupply = ethers.utils.formatUnits(
      //   await xusd.totalSupply(),
      //   18
      // )
      const allCoinsData = [
        { name: 'usdt', decimals: 6, contract: usdt },
        { name: 'dai', decimals: 18, contract: dai },
        { name: 'usdc', decimals: 6, contract: usdc },
      ]
      const balances = []
      await allCoinsData.forEach(async (coinData) => {
        let balance
        try {
          balance = await coinData.contract.balanceOf(vault.address)
        } catch (err) {
          console.log('Error getting balance', coinData.name, err)
          balance = 0
        }
        balances.push(
          balance === '0x'
            ? '0'
            : ethers.utils.parseUnits(
                BigNumber.from(balance).toString(),
                coinData.decimals
              )
        )
      })

      const computedSupply = balances
      console.log(
        'balance',
        balances,
        balances.length
        // balances[0].add(balances[1]).add(balances[2]),
        // computedSupply
      )

      const rebasingCredits = await _rebasingCredits()
      YieldStore.update((s) => {
        s.currentCreditsPerToken = _rebasingCreditsPerToken('latest')
        // https://github.com/OriginProtocol/ousd-analytics/blob/f32e99b3b15eaaad5999e45fd67add0ccd6b6ee8/eagleproject/core/blockchain/harvest/snapshots.py#L216
        // 1 / rebasing_credits_ratio
        s.nextCreditsPerToken =
          (rebasingCredits + 0) /
          (daiBalance +
            usdcBalance +
            usdtBalance -
            s.non_rebasing_supply -
            future_fee)
      })
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
        fetchAPY(),
        fetchExchangeRates(),
        fetchCreditsPerToken(),
        fetchCreditsBalance(),
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
    chainlinkEthAggregator,
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
