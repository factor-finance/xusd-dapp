import { useEffect, useState } from 'react'
import { ethers } from 'ethers'
import { useStoreState } from 'pullstate'

import ContractStore from 'stores/ContractStore'
import AccountStore from 'stores/AccountStore'
import {
  mintAbsoluteGasLimitBuffer,
  mintPercentGasLimitBuffer,
  redeemPercentGasLimitBuffer,
  curveGasLimitBuffer,
} from 'utils/constants'

import { calculateSwapAmounts } from 'utils/math'

const useCurrencySwapper = ({
  swapMode,
  inputAmountRaw,
  outputAmount,
  selectedCoin,
  priceToleranceValue,
}) => {
  const [needsApproval, setNeedsApproval] = useState(false)
  const {
    vault: vaultContract,
    usdt: usdtContract,
    usdc: usdcContract,
    dai: daiContract,
    flipper,
    curveXUSDMetaPool,
    curveZapper,
  } = useStoreState(ContractStore, (s) => s.contracts)
  const curveMetapoolUnderlyingCoins = useStoreState(
    ContractStore,
    (s) => s.curveMetapoolUnderlyingCoins
  )

  const coinInfoList = useStoreState(ContractStore, (s) => s.coinInfoList)

  const allowances = useStoreState(AccountStore, (s) => s.allowances)
  const balances = useStoreState(AccountStore, (s) => s.balances)
  const account = useStoreState(AccountStore, (s) => s.address)
  const selectedSwap = useStoreState(ContractStore, (s) => s.selectedSwap)

  const allowancesLoaded =
    typeof allowances === 'object' &&
    allowances.xusd &&
    allowances.usdt &&
    allowances.usdc &&
    allowances.dai

  const { contract: coinContract, decimals } =
    coinInfoList[swapMode === 'mint' ? selectedCoin : 'xusd']

  let coinToReceiveDecimals, coinToReceiveContract
  // do not enter conditional body when redeeming a mix
  if (!(swapMode === 'redeem' && selectedCoin === 'mix')) {
    ;({ contract: coinToReceiveContract, decimals: coinToReceiveDecimals } =
      coinInfoList[swapMode === 'redeem' ? selectedCoin : 'xusd'])
  }

  // plain amount as displayed in UI (not in wei format)
  const amount = parseFloat(inputAmountRaw)

  const { swapAmount, minSwapAmount } = calculateSwapAmounts(
    inputAmountRaw,
    decimals,
    priceToleranceValue
  )

  useEffect(() => {
    if (
      !amount ||
      !selectedSwap ||
      !allowances ||
      Object.keys(allowances) === 0
    ) {
      return
    }

    const nameMaps = {
      vault: 'vault',
      flipper: 'flipper',
      curve: 'curve',
    }

    const coinNeedingApproval = swapMode === 'mint' ? selectedCoin : 'xusd'

    if (coinNeedingApproval === 'xusd' && selectedSwap.name === 'vault') {
      setNeedsApproval(false)
    } else {
      if (nameMaps[selectedSwap.name] === undefined) {
        throw new Error(
          `Can not fetch contract: ${selectedSwap.name} allowance for coin: ${coinNeedingApproval}`
        )
      }
      setNeedsApproval(
        Object.keys(allowances).length > 0 &&
          parseFloat(
            allowances[coinNeedingApproval][nameMaps[selectedSwap.name]]
          ) < ethers.utils.parseUnits(amount.toString(), decimals)
          ? selectedSwap.name
          : false
      )
    }
  }, [swapMode, amount, allowances, selectedCoin, selectedSwap])

  const _mintVault = async (
    callObject,
    swapAmount,
    minSwapAmount,
    options = {}
  ) => {
    return await callObject.mint(
      coinContract.address,
      swapAmount,
      minSwapAmount,
      options
    )
  }
  /* Increases the given gas limit by the specified buffer. BufferToIncrease is expressed
   * in relative percentages. Meaning a 0.2 value will set gasLimit to 120% of the original value
   */
  const increaseGasLimitByBuffer = (gasLimit, bufferToIncrease) => {
    return Math.round(gasLimit * (1 + bufferToIncrease))
  }
  const mintVaultGasEstimate = async (swapAmount, minSwapAmount) => {
    return (
      await _mintVault(vaultContract.estimateGas, swapAmount, minSwapAmount)
    ).toNumber()
  }

  const mintVault = async () => {
    const { minSwapAmount: minSwapAmountReceived } = calculateSwapAmounts(
      outputAmount,
      18,
      priceToleranceValue
    )

    const gasEstimate = await mintVaultGasEstimate(
      swapAmount,
      minSwapAmountReceived
    )
    const gasLimit = parseInt(
      gasEstimate +
        Math.max(
          mintAbsoluteGasLimitBuffer,
          gasEstimate * mintPercentGasLimitBuffer
        )
    )

    return {
      result: await _mintVault(
        vaultContract,
        swapAmount,
        minSwapAmountReceived,
        {
          gasLimit,
        }
      ),
      swapAmount,
      minSwapAmount: minSwapAmountReceived,
    }
  }

  const _redeemVault = async (
    callObject,
    swapAmount,
    minSwapAmount,
    options = {}
  ) => {
    const isRedeemAll = Math.abs(swapAmount - balances.xusd) < 1
    if (isRedeemAll) {
      return await callObject.redeemAll(minSwapAmount, options)
    } else {
      return await callObject.redeem(swapAmount, minSwapAmount, options)
    }
  }

  const redeemVaultGasEstimate = async (swapAmount, minSwapAmount) => {
    return (
      await _redeemVault(vaultContract.estimateGas, swapAmount, minSwapAmount)
    ).toNumber()
  }

  const redeemVault = async () => {
    const { minSwapAmount: minSwapAmountReceived } = calculateSwapAmounts(
      outputAmount,
      18,
      priceToleranceValue
    )

    const gasEstimate = await redeemVaultGasEstimate(
      swapAmount,
      minSwapAmountReceived
    )
    const gasLimit = parseInt(gasEstimate * (1 + redeemPercentGasLimitBuffer))

    return {
      result: await _redeemVault(
        vaultContract,
        swapAmount,
        minSwapAmountReceived,
        {
          gasLimit,
        }
      ),
      swapAmount,
      minSwapAmount: minSwapAmountReceived,
    }
  }

  const swapFlipper = async () => {
    // need to calculate these again, since Flipper takes all amount inputs in 18 decimal format
    const { swapAmount: swapAmountFlipper } = calculateSwapAmounts(
      inputAmountRaw,
      18
    )

    let flipperResult
    if (swapMode === 'mint') {
      if (selectedCoin === 'dai') {
        flipperResult = await flipper.buyXusdWithDai(swapAmountFlipper)
      } else if (selectedCoin === 'usdt') {
        flipperResult = await flipper.buyXusdWithUsdt(swapAmountFlipper)
      } else if (selectedCoin === 'usdc') {
        flipperResult = await flipper.buyXusdWithUsdc(swapAmountFlipper)
      }
    } else {
      if (selectedCoin === 'dai') {
        flipperResult = await flipper.sellXusdForDai(swapAmountFlipper)
      } else if (selectedCoin === 'usdt') {
        flipperResult = await flipper.sellXusdForUsdt(swapAmountFlipper)
      } else if (selectedCoin === 'usdc') {
        flipperResult = await flipper.sellXusdForUsdc(swapAmountFlipper)
      }
    }

    return {
      result: flipperResult,
      swapAmount,
      minSwapAmount,
    }
  }

  const _swapCurve = async (swapAmount, minSwapAmount, isGasEstimate) => {
    const swapParams = [
      curveXUSDMetaPool.address,
      curveMetapoolUnderlyingCoins.indexOf(
        _maybeToAvToken(coinContract.address)
      ),
      curveMetapoolUnderlyingCoins.indexOf(
        _maybeToAvToken(coinToReceiveContract.address)
      ),
      swapAmount,
      minSwapAmount,
    ]

    const gasLimit = increaseGasLimitByBuffer(
      await curveZapper.estimateGas.exchange_underlying(...swapParams, {
        from: account,
      }),
      curveGasLimitBuffer
    )

    if (isGasEstimate) {
      return gasLimit
    } else {
      return await curveZapper.exchange_underlying(...swapParams, {
        gasLimit,
      })
    }
  }

  const swapCurveGasEstimate = async (swapAmount, minSwapAmount) => {
    return (await _swapCurve(swapAmount, minSwapAmount, true)).toNumber()
  }

  const swapCurve = async () => {
    const { minSwapAmount: minSwapAmountReceived } = calculateSwapAmounts(
      outputAmount,
      coinToReceiveDecimals,
      priceToleranceValue
    )

    return {
      result: await _swapCurve(swapAmount, minSwapAmountReceived, false),
      swapAmount,
      minSwapAmount,
    }
  }

  const _maybeToAvToken = (address) => {
    // TODO: do this not in a stupid way, perhaps using coins and underlying coins call?
    if (address.toLowerCase() == usdcContract.address.toLowerCase()) {
      return '0x46A51127C3ce23fb7AB1DE06226147F446e4a857'.toLowerCase()
    } else if (address.toLowerCase() == usdtContract.address.toLowerCase()) {
      return '0x532E6537FEA298397212F09A61e03311686f548e'.toLowerCase()
    } else if (address.toLowerCase() == daiContract.address.toLowerCase()) {
      return '0x47AFa96Cdc9fAb46904A55a6ad4bf6660B53c38a'.toLowerCase()
    } else {
      return address.toLowerCase()
    }
  }

  const quoteCurve = async (swapAmount) => {
    const fromCoinIndex = curveMetapoolUnderlyingCoins.indexOf(
      _maybeToAvToken(coinContract.address)
    )
    const toCoinIndex = curveMetapoolUnderlyingCoins.indexOf(
      _maybeToAvToken(coinToReceiveContract.address)
    )
    const coinsReceived = await curveXUSDMetaPool.get_dy_underlying(
      fromCoinIndex,
      toCoinIndex,
      swapAmount
    )
    return coinsReceived
  }

  return {
    allowancesLoaded,
    needsApproval,
    mintVault,
    mintVaultGasEstimate,
    redeemVault,
    redeemVaultGasEstimate,
    swapFlipper,
    quoteCurve,
    swapCurve,
    swapCurveGasEstimate,
  }
}

export default useCurrencySwapper
