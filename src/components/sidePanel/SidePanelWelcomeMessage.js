import React from 'react'
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

  const xusdToBuy = ['dai', 'usdt', 'usdc', 'usdc_native']
    .map((coin) => balances[coin] * xusdExchangeRates[coin].mint)
    .reduce((a, b) => a + b)

  return (
    <>
      <div className="side-panel-message">
        <div className="title">{fbt('Welcome!', 'Welcome!')}</div>
        <div className="text">
          <p>
            {fbt(
              'Convert other stablecoins into Factor XUSD so you can instantly earn yields.',
              'welcome-message'
            )}
          </p>
          {xusdToBuy > 0 && (
            <p>
              {fbt(
                'You can buy up to ~' +
                  fbt.param('xusd-coin', formatCurrency(xusdToBuy, 2)) +
                  ' XUSD with the ' +
                  fbt.param('usdt-coin', formatCurrency(balances['usdt'], 0)) +
                  ' USDT.e, ' +
                  fbt.param('usdc-coin', formatCurrency(balances['usdc'], 0)) +
                  ' USDC.e, and ' +
                  fbt.param(
                    'usdc_native-coin',
                    formatCurrency(balances['usdc_native'], 0)
                  ) +
                  ' USDC, and ' +
                  fbt.param('dai-coin', formatCurrency(balances['dai'], 0)) +
                  ' DAI.e in your wallet.',
                'welcome-message-buying-power'
              )}
            </p>
          )}
          <a href="https://docs.xusd.fi" target="_blank" rel="noreferrer">
            Learn more about Factor XUSD
          </a>
          .
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

        .side-panel-message .text p {
          margin-bottom: 7px;
        }

        .side-panel-message .text a {
          color: #1a82ff;
          cursor: pointer;
        }

        .side-panel-message .text a:hover {
          text-decoration: underline;
        }
      `}</style>
    </>
  )
}

export default SidePanelWelcomeMessage
