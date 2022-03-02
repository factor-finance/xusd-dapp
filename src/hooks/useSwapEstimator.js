import React, { useEffect, useState } from 'react'
import { ethers, BigNumber } from 'ethers'
import { useStoreState } from 'pullstate'
import { get, minBy } from 'lodash'
import AccountStore from 'stores/AccountStore'
import {
  mintAbsoluteGasLimitBuffer,
  mintPercentGasLimitBuffer,
  redeemPercentGasLimitBuffer,
} from 'utils/constants'
import { usePrevious } from 'utils/hooks'
import useCurrencySwapper from 'hooks/useCurrencySwapper'
import ContractStore from 'stores/ContractStore'
import { calculateSwapAmounts, formatCurrency } from 'utils/math'
import fetchWithTimeout from 'utils/fetchWithTimeout'
import { find } from 'lodash'

/* Swap estimator listens for input changes of the currency and amount users is attempting
 * to swap and with some delay (to not cause too many calls) kicks off swap estimations.
 */
const useSwapEstimator = ({
  swapMode,
  inputAmountRaw,
  selectedCoin,
  priceToleranceValue,
}) => {
  const contracts = useStoreState(ContractStore, (s) => s.contracts)
  const chainId = useStoreState(ContractStore, (s) => s.chainId)
  const coinInfoList = useStoreState(ContractStore, (s) => s.coinInfoList)
  const vaultAllocateThreshold = useStoreState(
    ContractStore,
    (s) => s.vaultAllocateThreshold
  )
  const vaultRebaseThreshold = useStoreState(
    ContractStore,
    (s) => s.vaultRebaseThreshold
  )
  const gasPrice = useStoreState(ContractStore, (s) => s.gasPrice)
  const previousGasPrice = usePrevious(gasPrice)
  const isGasPriceUserOverriden = useStoreState(
    ContractStore,
    (s) => s.isGasPriceUserOverriden
  )

  const balances = useStoreState(AccountStore, (s) => s.balances)

  const { contract: coinToSwapContract, decimals: coinToSwapDecimals } =
    coinInfoList[swapMode === 'mint' ? selectedCoin : 'xusd']

  let coinToReceiveContract, coinToReceiveDecimals

  // do not enter conditional body when redeeming a mix
  if (!(swapMode === 'redeem' && selectedCoin === 'mix')) {
    ;({ contract: coinToReceiveContract, decimals: coinToReceiveDecimals } =
      coinInfoList[swapMode === 'redeem' ? selectedCoin : 'xusd'])
  }

  const allowances = useStoreState(AccountStore, (s) => s.allowances)
  const allowancesLoaded =
    typeof allowances === 'object' &&
    allowances.xusd !== undefined &&
    allowances.usdt !== undefined &&
    allowances.usdc !== undefined &&
    allowances.dai !== undefined

  const account = useStoreState(AccountStore, (s) => s.account)
  const [ethPrice, setEthPrice] = useState(false)
  const [estimationCallback, setEstimationCallback] = useState(null)
  const {
    mintVaultGasEstimate,
    redeemVaultGasEstimate,
    swapCurveGasEstimate,
    quoteCurve,
  } = useCurrencySwapper({
    swapMode,
    inputAmountRaw,
    selectedCoin,
    priceToleranceValue,
  })

  const { swapAmount, minSwapAmount } = calculateSwapAmounts(
    inputAmountRaw,
    coinToSwapDecimals,
    priceToleranceValue
  )

  const swapEstimations = useStoreState(ContractStore, (s) => s.swapEstimations)
  const walletConnected = useStoreState(ContractStore, (s) => s.walletConnected)

  useEffect(() => {
    const swapsLoaded = swapEstimations && typeof swapEstimations === 'object'
    const userSelectionExists =
      swapsLoaded &&
      find(
        Object.values(swapEstimations),
        (estimation) => estimation.userSelected
      )

    const selectedSwap =
      swapsLoaded &&
      find(Object.values(swapEstimations), (estimation) =>
        userSelectionExists ? estimation.userSelected : estimation.isBest
      )

    ContractStore.update((s) => {
      s.selectedSwap = selectedSwap
    })
  }, [swapEstimations])

  // just so initial gas price is populated in the settings dropdown
  useEffect(() => {
    fetchGasPrice()
  }, [])

  useEffect(() => {
    /*
     * Weird race condition would happen where estimations were ran with the utils/contracts setting up
     * the contracts with alchemy provider instead of Metamask one. When estimations are ran with that
     * setup, half of the estimations fail with an error.
     */
    if (!walletConnected) {
      return
    }

    /*
     * When function is triggered because of a non user change in gas price, ignore the trigger.
     */
    if (!isGasPriceUserOverriden && previousGasPrice !== gasPrice) {
      return
    }

    if (!allowancesLoaded) {
      return
    }

    if (estimationCallback) {
      clearTimeout(estimationCallback)
    }

    const coinAmountNumber = parseFloat(inputAmountRaw)
    if (!(coinAmountNumber > 0) || Number.isNaN(coinAmountNumber)) {
      ContractStore.update((s) => {
        s.swapEstimations = null
      })
      return
    }

    /* Timeout the execution so it doesn't happen on each key stroke rather aiming
     * to when user has already stopped typing
     */
    setEstimationCallback(
      setTimeout(async () => {
        await runEstimations(swapMode, selectedCoin, inputAmountRaw)
      }, 700)
    )
  }, [
    swapMode,
    selectedCoin,
    inputAmountRaw,
    allowancesLoaded,
    walletConnected,
    isGasPriceUserOverriden,
    gasPrice,
  ])

  const runEstimations = async (mode, selectedCoin, amount) => {
    ContractStore.update((s) => {
      s.swapEstimations = 'loading'
    })
    let usedGasPrice = gasPrice

    let vaultResult, curveResult, ethPrice
    if (swapMode === 'mint') {
      ;[vaultResult, curveResult, ethPrice] = await Promise.all([
        estimateMintSuitabilityVault(),
        estimateSwapSuitabilityCurve(),
        fetchEthPrice(),
      ])
    } else {
      ;[vaultResult, curveResult, ethPrice] = await Promise.all([
        estimateRedeemSuitabilityVault(),
        estimateSwapSuitabilityCurve(),
        fetchEthPrice(),
      ])
    }

    if (!isGasPriceUserOverriden) {
      usedGasPrice = await fetchGasPrice()
    }

    let estimations = {
      vault: vaultResult,
      curve: curveResult,
    }

    estimations = enrichAndFindTheBest(
      estimations,
      usedGasPrice,
      ethPrice,
      amount
    )

    ContractStore.update((s) => {
      s.swapEstimations = estimations
    })
  }

  const enrichAndFindTheBest = (
    estimations,
    gasPrice,
    ethPrice,
    inputAmountRaw
  ) => {
    Object.keys(estimations).map((estKey) => {
      const value = estimations[estKey]
      // assign names to values, for easier manipulation
      value.name = estKey
      value.isBest = false
      value.userSelected = false

      estimations[estKey] = value
    })

    const canDoSwaps = Object.values(estimations).filter(
      (estimation) => estimation.canDoSwap
    )

    const inputAmount = parseFloat(inputAmountRaw)
    canDoSwaps.map((estimation) => {
      const gasUsdCost = getGasUsdCost(estimation.gasUsed, gasPrice, ethPrice)
      const gasUsdCostNumber = parseFloat(gasUsdCost)
      const amountReceivedNumber = parseFloat(estimation.amountReceived)

      estimation.gasEstimate = gasUsdCost
      estimation.effectivePrice =
        (inputAmount + gasUsdCostNumber) / amountReceivedNumber
    })

    const best = minBy(canDoSwaps, (estimation) => estimation.effectivePrice)

    if (best) {
      best.isBest = true
      canDoSwaps.map((estimation) => {
        if (estimation === best) {
          return
        }

        estimation.diff = estimation.effectivePrice - best.effectivePrice
        estimation.diffPercentage =
          ((best.effectivePrice - estimation.effectivePrice) /
            best.effectivePrice) *
          100
      })
    }

    return estimations
  }

  const getGasUsdCost = (gasLimit, gasPrice, ethPrice) => {
    if (!gasPrice || !ethPrice) {
      return null
    }

    const flooredEth = Math.floor(ethPrice)
    const priceInUsd = ethers.utils.formatUnits(
      gasPrice
        .mul(BigNumber.from(flooredEth))
        .mul(BigNumber.from(gasLimit))
        .toString(),
      18
    )

    return priceInUsd
  }

  const userHasEnoughStablecoin = (coin, swapAmount) => {
    return parseFloat(balances[coin]) > swapAmount
  }

  /* Gives information on suitability of Curve for this swap
   */
  const estimateSwapSuitabilityCurve = async () => {
    const isRedeem = swapMode === 'redeem'
    if (isRedeem && selectedCoin === 'mix') {
      return {
        canDoSwap: false,
        error: 'unsupported',
      }
    }

    try {
      const priceQuoteBn = await quoteCurve(swapAmount)
      const amountReceived = ethers.utils.formatUnits(
        priceQuoteBn,
        // 18 because xusd has 18 decimals
        isRedeem ? coinToReceiveDecimals : 18
      )

      /* Check if Curve Zapper has allowance/approval to spend coin. If not we can not run gas estimation and need
       * to guess the gas usage to estimate best trade route
       */
      if (
        parseFloat(allowances[isRedeem ? 'xusd' : selectedCoin].curve) <
          parseFloat(inputAmountRaw) ||
        !userHasEnoughStablecoin(
          isRedeem ? 'xusd' : selectedCoin,
          parseFloat(inputAmountRaw)
        )
      ) {
        return {
          canDoSwap: true,
          /* This estimate is from the few ones observed on the mainnet:
           * https://snowtrace.io/tx/0xe3cbdbfa6e08bebd5dcb5acf3736859b23f101ff63dfbd8f6cd6d6440f3ae1bb
           */
          gasUsed: 1100001,
          amountReceived,
        }
      }
      // TODO get gasEstimate working in fork mode
      let gasEstimate
      try {
        gasEstimate = await swapCurveGasEstimate(swapAmount, minSwapAmount)
      } catch (e) {
        console.error(
          `Unexpected error estimating curve swap gas: ${e.message}`
        )
        gasEstimate = 1100000
      }
      return {
        canDoSwap: true,
        gasUsed: gasEstimate,
        amountReceived,
      }
    } catch (e) {
      console.error(
        `Unexpected error estimating curve swap suitability: ${e.message}`
      )
      return {
        canDoSwap: false,
        error: 'unexpected_error',
      }
    }
  }

  /* Gives information on suitability of vault mint
   */
  const estimateMintSuitabilityVault = async () => {
    const amount = parseFloat(inputAmountRaw)

    try {
      // 18 decimals denominated BN exchange rate value
      const oracleCoinPrice = await contracts.vault.priceUSDMint(
        coinToSwapContract.address
      )
      const amountReceived =
        amount * parseFloat(ethers.utils.formatUnits(oracleCoinPrice, 18))

      // Check if Vault has allowance to spend coin.
      if (
        parseFloat(allowances[selectedCoin].vault) === 0 ||
        !userHasEnoughStablecoin(selectedCoin, amount)
      ) {
        const rebaseTreshold = parseFloat(
          ethers.utils.formatUnits(vaultRebaseThreshold, 18)
        )
        const allocateThreshold = parseFloat(
          ethers.utils.formatUnits(vaultAllocateThreshold, 18)
        )

        let gasUsed = 220000
        if (amount > allocateThreshold) {
          // https://snowtrace.io/tx/0x267da9abae04ae600d33d2c3e0b5772872e6138eaa074ce715afc8975c7f2deb
          gasUsed = 2900000
        } else if (amount > rebaseTreshold) {
          // https://snowtrace.io/tx/0xc8ac03e33cab4bad9b54a6e6604ef6b8e11126340b93bbca1348167f548ad8fd
          gasUsed = 520000
        }

        return {
          canDoSwap: true,
          gasUsed,
          amountReceived,
        }
      }

      const { minSwapAmount: minAmountReceived } = calculateSwapAmounts(
        amountReceived,
        coinToReceiveDecimals,
        priceToleranceValue
      )

      const gasEstimate = await mintVaultGasEstimate(
        swapAmount,
        minAmountReceived
      )

      return {
        canDoSwap: true,
        gasUsed: gasEstimate,
        // TODO: should this be rather done with BigNumbers instead?
        amountReceived,
      }
    } catch (e) {
      console.error(
        `Unexpected error estimating vault swap suitability: ${e.message}`
      )

      // local node and mainnet return errors in different formats, this handles both cases
      if (
        (e.data &&
          e.data.message &&
          e.data.message.includes('Mint amount lower than minimum')) ||
        e.message.includes('Mint amount lower than minimum')
      ) {
        return {
          canDoSwap: false,
          error: 'slippage_too_high',
        }
      }

      return {
        canDoSwap: false,
        error: 'unexpected_error',
      }
    }
  }

  /* Gives information on suitability of vault redeem
   */
  const estimateRedeemSuitabilityVault = async () => {
    if (selectedCoin !== 'mix') {
      return {
        canDoSwap: false,
        error: 'unsupported',
      }
    }

    const amount = parseFloat(inputAmountRaw)
    // Check if Vault has allowance to spend coin.

    let gasEstimate
    try {
      await loadRedeemFee()
      const coinSplits = await _calculateSplits(amount)
      const splitsSum = coinSplits
        .map((coin) => parseFloat(coin.amount))
        .reduce((a, b) => a + b, 0)

      if (!userHasEnoughStablecoin('xusd', amount)) {
        return {
          canDoSwap: true,
          gasUsed: 1500000,
          amountReceived: splitsSum,
          coinSplits,
        }
      }

      const { minSwapAmount: minAmountReceived } = calculateSwapAmounts(
        splitsSum,
        coinToReceiveDecimals,
        priceToleranceValue
      )

      gasEstimate = await redeemVaultGasEstimate(swapAmount, minAmountReceived)

      return {
        canDoSwap: true,
        gasUsed: gasEstimate,
        // TODO: should this be rather done with BigNumbers instead?
        amountReceived: splitsSum,
        coinSplits,
      }
    } catch (e) {
      console.error(`Can not estimate contract call gas used: ${e.message}`)

      // local node and mainnet return errors in different formats, this handles both cases
      if (
        (e.data &&
          e.data.message &&
          e.data.message.includes('Redeem amount lower than minimum')) ||
        e.message.includes('Redeem amount lower than minimum')
      ) {
        return {
          canDoSwap: false,
          error: 'slippage_too_high',
        }
      }

      return {
        canDoSwap: false,
        error: 'unexpected_error',
      }
    }
  }

  let redeemFee
  const loadRedeemFee = async () => {
    if (!redeemFee) {
      const redeemFeeBn = await contracts.vault.redeemFeeBps()
      redeemFee = parseFloat(ethers.utils.formatUnits(redeemFeeBn, 4))
    }
  }

  // Fetches current eth price
  const fetchEthPrice = async () => {
    // if production
    if (chainId === 43114) {
      return await _fetchEthPriceChainlink()
    } else {
      return await _fetchEthPriceCryptoApi()
    }
  }

  const _fetchEthPriceCryptoApi = async () => {
    try {
      const ethPriceRequest = await fetch(
        'https://min-api.cryptocompare.com/data/price?fsym=AVAX&tsyms=USD'
      )

      // floor so we can convert to BN without a problem
      const ethPrice = BigNumber.from(
        Math.floor(get(await ethPriceRequest.json(), 'USD'))
      )
      setEthPrice(ethPrice)
      return ethPrice
    } catch (e) {
      console.error(`Can not fetch eth prices: ${e.message}`)
    }

    return BigNumber.from(0)
  }

  const _fetchEthPriceChainlink = async () => {
    try {
      const priceFeed = await contracts.chainlinkEthAggregator.latestRoundData()
      const ethUsdPrice = parseFloat(
        ethers.utils.formatUnits(priceFeed.answer, 8)
      )
      return ethUsdPrice
    } catch (e) {
      console.error('Error happened fetching eth usd chainlink data:', e)
    }

    return 0
  }

  // Fetches current gas price
  const fetchGasPrice = async () => {
    // https://docs.avax.network/learn/platform-overview/transaction-fees/#dynamic-fee-transactions
    let jsonCallId = 1
    let gasPriorityFee = BigNumber.from(0)
    const nAVAX = '000000000'
    let gasPrice = BigNumber.from('25' + nAVAX)

    const fetchMethodResult = async (method) => {
      const data = {
        jsonrpc: '2.0',
        method: method,
        params: [],
        id: jsonCallId.toString(),
      }
      jsonCallId++

      const response = await fetch(process.env.ETHEREUM_RPC_PROVIDER, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        referrerPolicy: 'no-referrer',
        body: JSON.stringify(data),
      })
      if (response.ok) {
        return get(await response.json(), 'result')
      }
    }

    try {
      const gasPriceResponse = await fetchMethodResult('eth_baseFee')
      if (gasPriceResponse.ok) {
        gasPrice = BigNumber.from(
          get(await gasPriceResponse.json(), 'result') + nAVAX
        )
      }

      const gasPriorityFeeResponse = await fetchMethodResult(
        'eth_maxPriorityFeePerGas'
      )
      if (gasPriorityFeeResponse.ok) {
        gasPriorityFee = BigNumber.from(
          get(await gasPriorityFeeResponse.json(), 'result') + nAVAX
        )
      }

      if (!isGasPriceUserOverriden) {
        ContractStore.update((s) => {
          s.gasPrice = gasPrice
        })
      }
    } catch (e) {
      console.error(
        `Can not fetch gas prices, defaulting to 25 nAVAX: ${e.message}`
      )
      // fall back to base fee instead of throwing
    }
    return gasPrice.add(gasPriorityFee)
  }

  const _calculateSplits = async (sellAmount) => {
    const calculateIt = async () => {
      try {
        const assetAmounts = await contracts.vault.calculateRedeemOutputs(
          ethers.utils.parseUnits(sellAmount.toString(), 18)
        )

        const assets = await Promise.all(
          (
            await contracts.vault.getAllAssets()
          ).map(async (address, index) => {
            const coin = Object.keys(contracts).find(
              (coin) =>
                contracts[coin] &&
                contracts[coin].address.toLowerCase() === address.toLowerCase()
            )

            const amount = ethers.utils.formatUnits(
              assetAmounts[index],
              coinInfoList[coin].decimals
            )

            return {
              coin,
              amount,
            }
          })
        )

        return assets
      } catch (err) {
        console.error(err)
        return {}
      }
    }

    return await calculateIt()
  }

  return {
    estimateMintSuitabilityVault,
    estimateRedeemSuitabilityVault,
    estimateSwapSuitabilityCurve,
  }
}

export default useSwapEstimator
