import React, { useEffect, useState } from 'react'
import { fbt } from 'fbt-runtime'
const moment = require('moment')

import Layout from 'components/layout'
import Nav from 'components/Nav'
import BalanceHeader from 'components/buySell/BalanceHeader'
import { totalSupplyEvents } from 'utils/moralis'
import { aprToApy } from 'utils/math'

function supplyEventsAddApy(supplyEvents) {
  // iterate and take the previous and current supply events and calculate the ratio
  for (let i = 1; i < supplyEvents.length; i++) {
    const current = supplyEvents[i].rebasingCreditsPerToken
    const currentDate = supplyEvents[i].createdAt
    const past = supplyEvents[i - 1].rebasingCreditsPerToken
    const pastDate = supplyEvents[i - 1].createdAt
    const ratio = past / current
    const days = moment(currentDate).diff(moment(pastDate), 'hours') / 24
    const apr = ((ratio - 1) * 100 * 365.25) / days
    const apy = aprToApy(apr, days)
    supplyEvents[i].apy = apy
  }
}

export default function APY({ locale, onLocale }) {
  const [apyHistory, setApyHistory] = useState([])

  useEffect(() => {
    totalSupplyEvents().then((events) => {
      const eventsJson = events.map((s) => s.toJSON())
      supplyEventsAddApy(eventsJson)
      eventsJson.reverse()
      setApyHistory(eventsJson)
    })
  }, [])

  return (
    <>
      <Layout locale={locale} onLocale={onLocale} dapp>
        <Nav dapp page={'apy'} locale={locale} onLocale={onLocale} />
        <div className="d-flex flex-column p-0 pt-md-5">
          <BalanceHeader />

          <div className="apy-table">
            <p className="mt-4 mb-0">Daily APY for the last thirty days:</p>

            <table className="table table-right">
              <thead className="header-text">
                <tr>
                  <th>Block</th>
                  <th>APY</th>
                  <th>Multiplier</th>
                  <th>Unboosted</th>
                  <th>Aprx. Yield</th>
                  <th>XUSD Supply</th>
                  <th>Backing Supply</th>
                  <th>Rebasing Supply</th>
                  <th>Non-Rebasing Supply</th>
                  <th>%</th>
                  <th>Ratio</th>
                </tr>
              </thead>
              <tbody>
                {apyHistory.map((supplyEvent) => {
                  return (
                    <tr key={supplyEvent.block_number}>
                      <td>{supplyEvent.block_number}</td>
                      <td>{supplyEvent.apy}%</td>
                      <td>??x</td>
                      <td>??%</td>
                      <td>??%</td>
                      <td>{supplyEvent.totalSupply}</td>
                      <td>{supplyEvent.totalSupply + 0 /*pending yield*/}</td>
                      <td>{supplyEvent.rebasingCredits}</td>
                      <td>
                        {supplyEvent.totalSupply - supplyEvent.rebasingCredits}
                      </td>
                      <td>
                        {supplyEvent.rebasingCredits /
                          (supplyEvent.totalSupply -
                            supplyEvent.rebasingCredits)}
                      </td>
                      <td>
                        {supplyEvent.rebasingCredits /
                          (supplyEvent.totalSupply -
                            supplyEvent.rebasingCredits)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </Layout>
      <style jsx>{`
        .apy-table {
          min-height: 470px;
          height: 100%;
          padding: 70px;
          border-radius: 0 0 10px 10px;
          border-top: solid 1px #cdd7e0;
          background-color: #fafbfc;
        }

        .header-text {
          font-size: 22px;
          line-height: 0.86;
          text-align: center;
          color: black;
          margin-top: 23px;
          margin-bottom: 10px;
        }

        .subtext {
          font-size: 14px;
          line-height: 1.36;
          text-align: center;
          color: #8293a4;
          margin-bottom: 50px;
        }

        @media (max-width: 799px) {
        }
      `}</style>
    </>
  )
}
