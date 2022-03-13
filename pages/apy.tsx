import React, { useEffect, useState } from 'react'
import { fbt } from 'fbt-runtime'
import moment from 'moment'
import { ethers } from 'ethers'

import Layout from 'components/layout'
import Nav from 'components/Nav'
import BalanceHeader from 'components/buySell/BalanceHeader'
import { totalSupplyEvents } from 'utils/moralis'
import { aprToApy } from 'utils/math'

function addApy(se) {
  // iterate and take the previous and current supply events and calculate the ratio
  for (let i = 1; i < se.length; i++) {
    const current = se[i].rebasingCreditsPerToken
    const currentDate = se[i].block_timestamp.iso
    const past = se[i - 1].rebasingCreditsPerToken
    const pastDate = se[i - 1].block_timestamp.iso
    const ratio = past / current
    const days = moment(currentDate).diff(moment(pastDate), 'hours') / 24
    const apr = ((ratio - 1) * 100 * 365.25) / days
    const apy = aprToApy(apr, days)

    se[i].multiplier =
      bigNum18(se[i].totalSupply) / bigNum18(se[i].rebasingCredits)

    // show apy as xx.xx%
    se[i].apy = (apy * 100).toFixed(2)
    se[i].aprUnboosted = (apr / se[i].multiplier).toFixed(2)
  }
}

function cumulativeYield({ rebasingCreditsPerToken, rebasingCredits }): number {
  return (
    (1 - parseFloat(ethers.utils.formatUnits(rebasingCreditsPerToken, 18))) *
    parseFloat(ethers.utils.formatUnits(rebasingCredits, 18))
  )
}

function addYield(se) {
  // iterate and take the previous and current supply events and calculate the difference
  for (let i = 1; i < se.length; i++) {
    const current = cumulativeYield(se[i])
    const past = cumulativeYield(se[i - 1])
    const newYield = (current - past).toFixed(2)
    // show -0.00 yield as 0.00
    se[i].yield = newYield === '-0.00' ? '0.00' : newYield
  }
}

function bigNum18(value: string): number {
  return parseFloat(ethers.utils.formatUnits(value, 18))
}

export default function APY({ locale, onLocale }) {
  const [apyHistory, setApyHistory] = useState([])

  useEffect(() => {
    totalSupplyEvents().then((events) => {
      const eventsJson = events.map((s) => s.toJSON())
      addApy(eventsJson)
      addYield(eventsJson)
      eventsJson.reverse()
      eventsJson.pop() // last row has no apy or yield
      setApyHistory(eventsJson)
    })
  }, [])

  return (
    <>
      <Layout locale={locale} onLocale={onLocale} dapp>
        <Nav dapp page={'apy'} locale={locale} onLocale={onLocale} />
        <div className="d-flex flex-column p-0 pt-md-3">
          <BalanceHeader />

          <div className="apy-table">
            <p>Realized APY for the last thirty days:</p>

            <table className="table table-right">
              <thead className="header-text">
                <tr>
                  <th>Block Time</th>
                  <th>Block</th>
                  <th>APY</th>
                  <th>Yield</th>
                  <th>Multiplier</th>
                  <th>APR on Total</th>
                  <th>XUSD Total</th>
                  <th>Rebasing Supply</th>
                  <th>Non-Rebasing Supply</th>
                </tr>
              </thead>
              <tbody>
                {apyHistory.map((supplyEvent) => {
                  return (
                    <tr key={supplyEvent.block_number}>
                      <td>
                        {moment(supplyEvent.block_timestamp.iso).format('lll')}
                      </td>
                      <td>
                        <a
                          href={`https://snowtrace.io/tx/${supplyEvent.transaction_hash}`}
                          target="_blank"
                        >
                          {supplyEvent.block_number}
                        </a>
                      </td>
                      <td>
                        <strong>{supplyEvent.apy}%</strong>
                      </td>
                      <td>
                        <strong>{supplyEvent.yield}</strong>
                      </td>
                      <td>{supplyEvent.multiplier.toFixed(2)}x</td>
                      <td>
                        <strong>{supplyEvent.aprUnboosted}%</strong>
                      </td>
                      <td>{bigNum18(supplyEvent.totalSupply).toFixed(2)}</td>
                      <td>
                        {bigNum18(supplyEvent.rebasingCredits).toFixed(2)}
                      </td>
                      <td>
                        {(
                          bigNum18(supplyEvent.totalSupply) -
                          bigNum18(supplyEvent.rebasingCredits)
                        ).toFixed(2)}
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
