import React, { useState } from 'react'
import { fbt } from 'fbt-runtime'
import { useStoreState } from 'pullstate'

import { formatCurrency } from 'utils/math'
import AccountStore from 'stores/AccountStore'
import ContractStore from 'stores/ContractStore'

const SidePanelWelcomeMessage = () => {
  const xusdExchangeRates = useStoreState(
    ContractStore,
    (s) => s.xusdExchangeRates
  )
  const balances = useStoreState(AccountStore, (s) => s.balances)

  const xusdToBuy = ['dai', 'usdt', 'usdc']
    .map((coin) => balances[coin] * xusdExchangeRates[coin].mint)
    .reduce((a, b) => a + b)

  return (
    <>
      <div className="side-panel-message">
        <div className="title">{fbt('Welcome!', 'Welcome!')}</div>
        <div className="text">
          {fbt(
            `The XUSD.fi lets you easily convert other stablecoins into XUSD so you can instantly earn yields.`,
            'welcome-message'
          )}{' '}
          {xusdToBuy > 0 &&
            fbt(
              'You can buy up to ~' +
                fbt.param('xusd-coin', formatCurrency(xusdToBuy, 2)) +
                ' XUSD with the ' +
                fbt.param('usdt-coin', formatCurrency(balances['usdt'], 0)) +
                ' USDT, ' +
                fbt.param('usdc-coin', formatCurrency(balances['usdc'], 0)) +
                ' USDC, and ' +
                fbt.param('dai-coin', formatCurrency(balances['dai'], 0)) +
                ' DAI in your wallet.',
              'welcome-message-buying-power'
            )}
        </div>
      </div>
      <style jsx>{`
        .side-panel-message {
          width: 100%;
          border-radius: 5px;
          border: solid 1px #cdd7e0;
          background-color: #ffffff;
          padding: 15px 20px;
          margin-bottom: 10px;
        }

        .side-panel-message .title {
          font-family: Lato;
          font-size: 14px;
          font-weight: bold;
          color: #183140;
          margin-bottom: 7px;
        }

        .side-panel-message .text {
          font-size: 14px;
          line-height: 1.5;
          color: #8293a4;
        }
      `}</style>
    </>
  )
}

export default SidePanelWelcomeMessage
