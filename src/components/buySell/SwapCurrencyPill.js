import React, { useState, useEffect } from 'react'
import { useStoreState } from 'pullstate'
import { fbt } from 'fbt-runtime'

import AccountStore from 'stores/AccountStore'
import Dropdown from 'components/Dropdown'
import {
  formatCurrency,
  formatCurrencyMinMaxDecimals,
  truncateDecimals,
  checkValidInputForCoin,
  removeCommas,
} from 'utils/math'
import { coinDisplayName } from 'utils/coins'

const DownCaret = ({ color = '#608fcf', size = '30' }) => (
  <svg
    style={{ marginRight: -13 }}
    width={size}
    height={size}
    viewBox="0 0 20 20"
  >
    <g stroke={color} strokeWidth="1" strokeLinecap="round">
      <line x1="7" y1="9" x2="10" y2="12" />
      <line x1="10" y1="12" x2="13" y2="9" />
    </g>
  </svg>
)

const CoinImage = ({ small, coin, isSemiTransparent = false }) => {
  const className = `coin-image ${isSemiTransparent ? 'transparent' : ''}`
  return (
    <div className="d-flex align-items-center">
      {coin !== 'mix' && (
        <img
          className={`${className} ${small ? 'small' : ''}`}
          src={`/images/currency/${coin}-icon-small.svg`}
        />
      )}
      {coin === 'mix' && (
        <div className="d-flex align-items-start">
          <img
            className={`${className} mixed coin-1 ${small ? 'small' : ''}`}
            src={`/images/currency/dai-icon-small.svg`}
          />
          <img
            className={`${className} mixed coin-2 ${small ? 'small' : ''}`}
            src={`/images/currency/usdt-icon-small.svg`}
          />
          <img
            className={`${className} mixed coin-3 ${small ? 'small' : ''}`}
            src={`/images/currency/usdc-icon-small.svg`}
          />
        </div>
      )}
      <style jsx>{`
        .coin-image {
          width: 26px;
          height: 26px;
        }

        .coin-image.transparent {
          opacity: 0.3;
        }

        .coin-image.small {
          width: 14px;
          height: 14px;
        }

        .mixed {
          position: relative;
        }

        .coin-1 {
          z-index: 1;
        }

        .coin-2 {
          z-index: 2;
          margin-left: -9px;
        }

        .coin-3 {
          z-index: 3;
          margin-left: -9px;
        }
      `}</style>
    </div>
  )
}

const CoinSelect = ({ selected, onChange, options = [] }) => {
  const [open, setOpen] = useState(false)

  if (options.length === 0) {
    return (
      <>
        <div
          className={`coin-select d-flex align-items-center justify-content-start`}
        >
          <CoinImage coin={selected} />
          <div className="coin mr-auto">{coinDisplayName(selected)}</div>
        </div>
        <style jsx>{`
          .coin-select {
            min-width: 160px;
            min-height: 40px;
            padding: 7px 20px 7px 7px;
            font-size: 18px;
          }

          .coin {
            color: black;
            margin-left: 12px;
          }
        `}</style>
      </>
    )
  }

  return (
    <>
      <Dropdown
        content={
          <div className="dropdown-menu show wrapper d-flex flex-column">
            {options.map((option) => {
              return (
                <div
                  key={option}
                  className={`${
                    option === 'xusd' ? 'xusd' : ''
                  }  d-flex justify-content-start align-items-center p-5px dropdown-item`}
                  onClick={() => {
                    onChange(option)
                    setOpen(false)
                  }}
                >
                  <CoinImage
                    coin={option}
                    isSemiTransparent={option === 'xusd'}
                  />
                  <div className="coin mr-auto">{coinDisplayName(option)}</div>
                </div>
              )
            })}
          </div>
        }
        open={open}
        onClose={() => setOpen(false)}
      >
        <div
          className={`coin-select d-flex align-items-center justify-content-start`}
          onClick={(e) => {
            e.preventDefault()
            setOpen(!open)
          }}
        >
          <CoinImage coin={selected} />
          <div className="coin mr-auto">{coinDisplayName(selected)}</div>
          <DownCaret />
        </div>
      </Dropdown>
      <style jsx>{`
        .dropdown-menu {
          padding: 10px;
          right: auto;
          left: 0;
          top: 100%;
        }

        .coin-select {
          min-width: 160px;
          min-height: 40px;
          padding: 7px 20px 7px 7px;
          border-radius: 20px;
          border: solid 1px #cdd7e0;
          background-color: white;
          cursor: pointer;
        }

        .coin-select:hover {
          background-color: #f2f3f5;
        }

        .p-5px {
          padding: 5px;
        }

        .single-coin {
          width: 26px;
          height: 26px;
        }

        .cursor-pointer {
          cursor: pointer;
        }

        .dropdown-item {
          cursor: pointer;
        }

        /*.dropdown-item.xusd {
          background-color: #e2e3e5;
        }

        .dropdown-item.xusd:hover {
          background-color: #d2d3d5;
        }*/

        .dropdown-item.xusd .coin {
          color: #18314055;
        }

        .dropdown-item:hover {
          background-color: #f2f3f5;
        }

        .coin {
          color: black;
          margin-left: 12px;
        }

        @media (max-width: 799px) {
          .coin-select {
            min-width: 120px;
            min-height: 32px;
            padding: 4px 14px 4px 4px;
          }

          .coin {
            color: black;
            margin-left: 8px;
          }
        }
      `}</style>
    </>
  )
}

/*
 * selectedCoin - the coin or coin combination to be shown - selected
 * balances - Array of balances to be shown. UI differs when there is only 1 item vs many in the array
 */
const SwapCurrencyPill = ({
  topItem,
  onSelectChange,
  onAmountChange,
  selectedCoin,
  selectedSwap,
  swapsLoaded,
  swapsLoading,
  priceToleranceValue,
  swapMode,
  onErrorChange,
  coinValue,
}) => {
  const coinBalances = useStoreState(AccountStore, (s) => s.balances)
  const [error, setError] = useState(null)
  const stableCoinMintOptions = ['xusd', 'dai', 'usdt', 'usdc', 'usdc_native']
  const coinRedeemOptions = [
    'xusd',
    'mix',
    'dai',
    'usdt',
    'usdc',
    'usdc_native',
  ]

  const bottomItem = !topItem
  const showXusd =
    (swapMode === 'redeem' && topItem) || (swapMode === 'mint' && bottomItem)

  const roundTo2to6Decimals = (value) => {
    return formatCurrencyMinMaxDecimals(value, {
      minDecimals: 2,
      maxDecimals: 6,
      truncate: true,
    })
  }

  const getDisplayBalance = () => {
    const roundTo2Decimals = (value) => {
      return formatCurrency(parseFloat(value), 2)
    }
    if (showXusd) {
      return {
        coin: coinDisplayName('xusd'),
        balance: roundTo2Decimals(coinBalances.xusd),
        detailedBalance: roundTo2to6Decimals(coinBalances.xusd),
      }
    } else {
      if (selectedCoin === 'mix') {
        // don't show stablecoin balance when mix stablecoin breakdown shall be displayed
        return null
      } else {
        return {
          coin: coinDisplayName(selectedCoin),
          balance: roundTo2Decimals(coinBalances[selectedCoin]),
          detailedBalance: roundTo2to6Decimals(coinBalances[selectedCoin]),
        }
      }
    }
  }

  const getSelectOptions = () => {
    if (showXusd) {
      return []
    } else {
      if (topItem) {
        return stableCoinMintOptions
      } else {
        return coinRedeemOptions
      }
    }
  }

  useEffect(() => {
    if (onErrorChange) {
      onErrorChange(error)
    }
  }, [error])

  useEffect(() => {
    checkForBalanceError()
  }, [coinValue, swapMode, selectedCoin])

  const checkForBalanceError = () => {
    if (bottomItem) {
      return
    }

    const coin = swapMode === 'mint' ? selectedCoin : 'xusd'

    setError(
      parseFloat(coinBalances[coin]) < parseFloat(coinValue)
        ? fbt('Insufficient balance', 'Insufficient balance for swapping')
        : null
    )
  }

  const displayBalance = getDisplayBalance()
  const coinsSelectOptions = getSelectOptions()
  const expectedAmount =
    bottomItem &&
    selectedSwap &&
    selectedSwap.amountReceived &&
    formatCurrency(selectedSwap.amountReceived, 2)

  const minReceived =
    bottomItem &&
    selectedSwap &&
    selectedSwap.amountReceived &&
    priceToleranceValue
      ? selectedSwap.amountReceived -
        (selectedSwap.amountReceived * priceToleranceValue) / 100
      : null

  const coinSplits = bottomItem && selectedSwap && selectedSwap.coinSplits

  const maxBalanceSet =
    topItem &&
    displayBalance &&
    removeCommas(displayBalance.detailedBalance) === removeCommas(coinValue)

  const balanceClickable =
    topItem &&
    displayBalance &&
    !maxBalanceSet &&
    parseFloat(displayBalance.balance) > 0
  const noSwapRouteAvailable = swapsLoaded && !selectedSwap

  const onMaxBalanceClick = (e) => {
    e.preventDefault()
    if (!balanceClickable || !displayBalance) {
      return
    }

    const valueNoCommas = removeCommas(displayBalance.detailedBalance)
    onAmountChange(valueNoCommas)
  }

  return (
    <>
      <div
        className={`currency-pill d-flex flex-column ${
          topItem ? 'topItem' : ''
        }`}
      >
        <div
          className={`d-flex align-items-start justify-content-between currency-pill-inner`}
        >
          <div className="d-flex flex-column justify-content-between align-items-start h-100">
            <CoinSelect
              selected={showXusd ? 'xusd' : selectedCoin}
              onChange={(coin) => {
                onSelectChange(coin)
              }}
              options={coinsSelectOptions}
            />
            <div className="d-flex align-items-center">
              <div
                className={`d-flex justify-content-between balance mt-auto mr-2 ${
                  balanceClickable ? 'clickable' : ''
                }`}
                onClick={onMaxBalanceClick}
              >
                {displayBalance && (
                  <div>
                    {fbt(
                      'Balance: ' +
                        fbt.param('coin-balance', displayBalance.balance),
                      'Coin balance'
                    )}
                    <span className="ml-1">{displayBalance.coin}</span>
                  </div>
                )}
                {balanceClickable && (
                  <a className="max-link ml-2" onClick={onMaxBalanceClick}>
                    {fbt('Max', 'Set maximum currency amount')}
                  </a>
                )}
              </div>
            </div>
          </div>
          <div className="d-flex flex-column justify-content-between align-items-end h-100 input-holder">
            {topItem && (
              <input
                type="text"
                value={coinValue}
                placeholder="0.00"
                onChange={(e) => {
                  const value = truncateDecimals(e.target.value)
                  const valueNoCommas = removeCommas(value)
                  if (checkValidInputForCoin(valueNoCommas, selectedCoin)) {
                    onAmountChange(valueNoCommas)
                  }
                }}
                onBlur={() => {
                  const valueRounded = removeCommas(
                    roundTo2to6Decimals(coinValue)
                  )
                  onAmountChange(valueRounded)
                }}
              />
            )}
            {topItem && error && <div className="error">{error}</div>}
            {bottomItem && (
              <div className="expected-value">
                {expectedAmount ||
                  (swapsLoading ? fbt('Loading...', 'Swaps Loading...') : '-')}
              </div>
            )}
            {bottomItem && (
              <div className="balance mt-auto">
                {minReceived !== null
                  ? fbt(
                      'Min. received: ' +
                        fbt.param(
                          'xusd-amount',
                          formatCurrency(minReceived, 2)
                        ) +
                        ' XUSD',
                      'Min XUSD amount received'
                    )
                  : topItem
                  ? ''
                  : '-'}
              </div>
            )}
            {bottomItem && noSwapRouteAvailable && (
              <div className="error">
                {fbt(
                  'Route for selected swap not available',
                  'no route available for selected swap'
                )}
              </div>
            )}
          </div>
        </div>
        {coinSplits && (
          <div className="d-flex flex-column multiple-balance-holder">
            {coinSplits.map((split) => {
              return (
                <div
                  className="d-flex justify-content-between align-items-center balance multiple-balance"
                  key={split.coin}
                >
                  <div className="d-flex justify-content-start align-items-center">
                    <CoinImage small coin={split.coin} />
                    <div className="ml-5px">{coinDisplayName(split.coin)}</div>
                  </div>
                  <div>{formatCurrency(split.amount, 2)}</div>
                </div>
              )
            })}
          </div>
        )}
      </div>
      <style jsx>{`
        .currency-pill {
          min-height: 90px;
          margin-bottom: 10px;
          padding: 10px 23px 14px 10px;
          border: solid 1px #cdd7e0;
          border-radius: 10px;
          background-color: white;
        }

        .currency-pill-inner {
          height: 80px;
        }

        .balance {
          font-size: 12px;
          color: #8293a4;
          margin-left: 4px;
        }

        .error {
          font-size: 12px;
          color: #ed2a28;
          margin-left: 4px;
        }

        .multiple-balance {
          margin-top: 6px;
        }

        .multiple-balance-holder {
          border-top: 1px solid #cdd7e0;
          margin-left: -10px;
          margin-right: -24px;
          padding-left: 10px;
          padding-right: 24px;
          margin-top: 10px;
          padding-top: 4px;
        }

        .mt-20 {
          margin-top: 20px;
        }

        .mt-10 {
          margin-top: 10px;
        }

        .coin {
          width: 15px;
          height: 15px;
          margin-right: 5px;
        }

        input {
          border: 0px;
          text-align: right;
          font-size: 24px;
          color: #183140;
          background-color: transparent;
        }

        .expected-value {
          font-size: 24px;
          color: #8293a4;
        }

        .ml-5px {
          margin-left: 5px;
        }

        .max-link:hover,
        .clickable:hover {
          text-decoration: underline;
        }

        .clickable {
          cursor: pointer;
        }

        .max-link {
          font-size: 12px;
          color: #8293a4;
          weight: bold;
          cursor: pointer;
        }

        @media (max-width: 799px) {
          .input-holder {
            max-width: 50%;
          }

          input {
            font-size: 20px;
          }

          .expected-value {
            font-size: 20px;
          }

          .balance {
            font-size: 10px;
            margin-left: 4px;
            white-space: nowrap;
          }

          .max-link {
            font-size: 10px;
          }
        }
      `}</style>
    </>
  )
}

export default SwapCurrencyPill
