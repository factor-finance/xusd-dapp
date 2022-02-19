import React, { useEffect, useState } from 'react'
import { fbt } from 'fbt-runtime'
import moment from 'moment'
import { ethers } from 'ethers'

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
    // show apy as xx.xx%
    supplyEvents[i].apy = (apy * 100).toFixed(2)
  }
}

function bigNum18(value: string, fixed: number = 0): string {
  return parseFloat(ethers.utils.formatUnits(value, 18)).toFixed(fixed)
}

function yieldFixed(
  { rebasingCreditsPerToken, totalSupply },
  fixed: number = 2
): string {
  return (
    (1 - parseFloat(ethers.utils.formatUnits(rebasingCreditsPerToken, 18))) *
    parseFloat(ethers.utils.formatUnits(totalSupply, 18))
  ).toFixed(fixed)
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
            <p>Daily APY for the last thirty days:</p>

            <table className="table table-right">
              <thead className="header-text">
                <tr>
                  <th>Block</th>
                  <th>APY</th>
                  <th>Aprx. Yield</th>
                  <th>XUSD Total</th>
                  <th>Rebasing Supply</th>
                  <th>Non-Rebasing Supply</th>
                </tr>
              </thead>
              <tbody>
                {apyHistory.map((supplyEvent) => {
                  return (
                    <tr key={supplyEvent.block_number}>
                      <td>{supplyEvent.block_number}</td>
                      <td>
                        <strong>{supplyEvent.apy}%</strong>
                      </td>
                      <td>
                        <strong>{yieldFixed(supplyEvent)}</strong>
                      </td>
                      <td>{bigNum18(supplyEvent.totalSupply)}</td>
                      <td>{bigNum18(supplyEvent.rebasingCredits)}</td>
                      <td>
                        {parseInt(bigNum18(supplyEvent.totalSupply)) -
                          parseInt(bigNum18(supplyEvent.rebasingCredits))}
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
          padding: 20px;
          border-radius: 0 0 10px 10px;
          border-top: solid 1px #cdd7e0;
          background-color: #fafbfc;
        }

        .header-text {
          font-size: 1.2rem;
          margin-top: 23px;
          margin-bottom: 10px;
        }
      `}</style>
    </>
  )
}
