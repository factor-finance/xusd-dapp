import React, { useState, useEffect } from 'react'
import { fbt } from 'fbt-runtime'
import { useStoreState } from 'pullstate'
import { useWeb3React } from '@web3-react/core'
import withIsMobile from 'hoc/withIsMobile'

import AccountStore from 'stores/AccountStore'
import AnimatedXusdStore from 'stores/AnimatedXusdStore'
import ContractStore from 'stores/ContractStore'
import { formatCurrency } from 'utils/math'
import { animateValue } from 'utils/animation'
import { usePrevious } from 'utils/hooks'
import useExpectedYield from 'utils/useExpectedYield'
import withRpcProvider from 'hoc/withRpcProvider'

const BalanceHeader = ({ isMobile }) => {
  const { account } = useWeb3React()
  const apy = useStoreState(ContractStore, (s) => s.apy)
  const xusdBalance = useStoreState(AccountStore, (s) => s.balances['xusd'])
  const lifetimeYield = useStoreState(AccountStore, (s) => s.lifetimeYield)
  const xusdBalanceLoaded = typeof xusdBalance === 'string'
  const animatedXusdBalance = useStoreState(
    AnimatedXusdStore,
    (s) => s.animatedXusdBalance
  )
  const mintAnimationLimit = 0.5

  // eslint-disable-next-line no-unused-vars
  const [balanceEmphasised, setBalanceEmphasised] = useState(false)
  const prevXusdBalance = usePrevious(xusdBalance)
  const addXusdModalState = useStoreState(
    AccountStore,
    (s) => s.addXusdModalState
  )
  const { animatedExpectedIncrease } = useExpectedYield()

  const normalXusdAnimation = (from, to) => {
    setBalanceEmphasised(true)
    return animateValue({
      from: parseFloat(from) || 0,
      to: parseFloat(to),
      callbackValue: (val) => {
        AnimatedXusdStore.update((s) => {
          s.animatedXusdBalance = val
        })
      },
      onCompleteCallback: () => {
        setBalanceEmphasised(false)
        if (addXusdModalState === 'waiting') {
          AccountStore.update((s) => {
            s.addXusdModalState = 'show'
          })
        }
      },
      // non even duration number so more of the decimals in xusdBalance animate
      duration: 1985,
      id: 'header-balance-xusd-animation',
      stepTime: 30,
    })
  }

  useEffect(() => {
    if (xusdBalanceLoaded) {
      const xusdBalanceNum = parseFloat(xusdBalance)
      const prevXusdBalanceNum = parseFloat(prevXusdBalance)
      // user must have minted the XUSD
      if (
        !isNaN(parseFloat(xusdBalanceNum)) &&
        !isNaN(parseFloat(prevXusdBalanceNum)) &&
        Math.abs(xusdBalanceNum - prevXusdBalanceNum) > mintAnimationLimit
      ) {
        normalXusdAnimation(prevXusdBalance, xusdBalance)
      } else if (
        !isNaN(parseFloat(xusdBalanceNum)) &&
        xusdBalanceNum > mintAnimationLimit
      ) {
        normalXusdAnimation(0, xusdBalance)
      } else {
        normalXusdAnimation(prevXusdBalance, 0)
      }
    }
  }, [xusdBalance])

  /*
   * Type: number or percentage
   */
  const Statistic = ({
    title,
    value,
    type,
    titleLink,
    marginBottom = false,
  }) => {
    return (
      <>
        <div
          className={`d-flex holder flex-row flex-md-column align-items-end align-items-md-start justify-content-start ${
            marginBottom ? 'margin-bottom' : ''
          }`}
        >
          <div className={`value ${type}`}>{value}</div>
          {titleLink && (
            <a
              className={`title link ${type}`}
              href={titleLink}
              rel="noopener noreferrer"
              target="blank"
            >
              {title}
            </a>
          )}
          {!titleLink && <div className="title">{title}</div>}
        </div>
        <style jsx>{`
          .title {
            color: #8293a4;
            font-size: 14px;
          }
          .title.link {
            cursor: pointer;
            text-decoration: underline;
          }
          .value {
            color: white;
            font-size: 28px;
          }

          .value.percentage::after {
            content: '%';
            padding-left: 2px;
          }

          @media (max-width: 799px) {
            .title {
              width: 55%;
              text-align: left;
              margin-bottom: 3px;
            }

            .title.percentage {
              margin-bottom: 10px;
            }

            .holder {
              width: 100%;
            }

            .value.percentage {
              font-size: 32px;
            }

            .value {
              color: white;
              font-size: 20px;
              width: 45%;
              text-align: left;
            }

            .margin-bottom {
              margin-bottom: 20px;
            }
          }
        `}</style>
      </>
    )
  }
  const displayedBalance = formatCurrency(animatedXusdBalance || 0, 2)
  return (
    <>
      <div className="balance-header d-flex flex-column justify-content-start">
        <div className="d-flex flex-column flex-md-row balance-holder justify-content-start w-100">
          <div className="apy-container d-flex justify-content-center">
            <div
              className={`contents d-flex align-items-center justify-content-center box box-black ${
                isMobile ? 'w-50' : ''
              }`}
            >
              <Statistic
                title={fbt('30-day trailing APY', '30-day trailing APY')}
                titleLink="/apy"
                value={
                  typeof apy === 'number'
                    ? formatCurrency(apy * 100, 2)
                    : '--.--'
                }
                type={typeof apy === 'number' ? 'percentage' : ''}
              />
            </div>
          </div>
          <div className="d-flex flex-column flex-md-row align-items-center justify-content-between box box-narrow box-dark w-100">
            <Statistic
              title={fbt('XUSD Balance', 'XUSD Balance')}
              value={
                !isNaN(parseFloat(displayedBalance)) && xusdBalanceLoaded
                  ? displayedBalance
                  : '--.--'
              }
              type={'number'}
              marginBottom={true}
            />
            <Statistic
              title={fbt('Pending yield', 'Pending yield')}
              value={
                animatedExpectedIncrease
                  ? formatCurrency(animatedExpectedIncrease, 2)
                  : '--.--'
              }
              type={'number'}
              marginBottom={true}
            />
            <Statistic
              title={fbt(
                'Lifetime earnings',
                'Lifetime XUSD balance header earnings'
              )}
              titleLink={
                account && process.env.HIDE_INACTIVE_PAGES != 'true'
                  ? `${
                      process.env.ANALYTICS_ENDPOINT
                    }/address/${account.toLowerCase()}`
                  : false
              }
              value={lifetimeYield ? formatCurrency(lifetimeYield, 2) : '--.--'}
              type={'number'}
            />
          </div>
        </div>
      </div>
      <style jsx>{`
        .balance-header {
          margin-bottom: 19px;
        }

        .balance-header .inaccurate-balance {
          border: 2px solid #ed2a28;
          border-radius: 5px;
          color: #ed2a28;
          margin-bottom: 40px;
          padding: 15px;
        }

        .balance-header .inaccurate-balance a {
          text-decoration: underline;
        }

        .balance-header .light-grey-label {
          font-size: 14px;
          font-weight: bold;
          color: #8293a4;
        }

        .balance-header .detail {
          font-size: 12px;
          color: #8293a4;
        }

        .balance-header a:hover {
          color: white;
        }

        .balance-header .xusd-value {
          font-size: 14px;
          color: white;
          text-align: left;
          text-overflow: ellipsis;
          transition: font-size 0.2s cubic-bezier(0.5, -0.5, 0.5, 1.5),
            color 0.2s cubic-bezier(0.5, -0.5, 0.5, 1.5);
          position: relative;
          margin-left: 11px;
        }

        .balance-header .xusd-value.big {
          color: #00d592;
        }

        .balance-header .apy-container {
          height: 100%;
        }

        .balance-header .apy-container .contents {
          z-index: 2;
        }

        .balance-header .apy-container .apy-percentage {
          font-size: 14px;
          color: #ffffff;
          font-weight: bold;
          margin-left: 8px;
        }

        .balance-header .apy-container .apy-percentage::after {
          content: '%';
          font-weight: bold;
          padding-left: 2px;
        }

        .balance-header .expected-increase {
          font-size: 12px;
          color: #8293a4;
        }

        .balance-header .expected-increase p {
          margin: auto;
        }

        .balance-header .expected-increase .dropdown {
          justify-content: center !important;
        }

        .balance-header .expected-increase .dropdown .disclaimer-tooltip {
          display: flex !important;
        }

        .balance-header .expected-increase .collect {
          color: #1a82ff;
          cursor: pointer;
        }

        .box {
          padding: 30px;
          min-width: 210px;
          min-height: 118px;
          border-radius: 10px;
          box-shadow: 0 0 14px 0 rgba(0, 0, 0, 0.1);
          border: solid 1px white;
          color: white;
        }

        .box-narrow {
          padding: 30px 50px;
        }

        .box.box-black {
          background-color: black;
          margin-right: 10px;
          min-width: 230px;
        }

        .box.box-dark {
          background-color: #001f3f;
        }

        @media (max-width: 799px) {
          .balance-header {
            align-items: center;
            text-align: center;
            padding: 0px 20px;
            min-height: 80px;
          }

          .apy-container {
            margin-bottom: 10px;
          }

          .balance-header .gradient-border {
            width: 100px;
            height: 100px;
            margin-right: 20px;
            padding-right: 20px;
          }

          .box {
            padding: 20px;
            min-width: auto;
            min-height: 90px;
          }

          .box.box-black {
            min-width: 100%;
            margin-right: 0px;
          }

          .balance-header .xusd-value.mio-club {
            font-size: 20px;
          }

          .balance-header .xusd-value .grey {
            color: #8293a4;
          }

          .balance-header .xusd-value-holder {
            white-space: nowrap;
          }

          .balance-header .apy-container .apy-label {
            font-family: Lato;
            font-size: 11px;
            font-weight: bold;
            text-align: center;
            color: #8293a4;
          }

          .balance-header .apy-container .apy-percentage {
            font-family: Lato;
            font-weight: normal;
          }

          .balance-header .xusd-value::after {
            content: '';
          }

          .balance-header .light-grey-label {
            font-family: Lato;
            font-size: 11px;
            font-weight: bold;
            color: #8293a4;
            margin-bottom: -2px;
          }

          .balance-holder {
            width: 100%;
          }
        }
      `}</style>
    </>
  )
}

export default withIsMobile(withRpcProvider(BalanceHeader))
