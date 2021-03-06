import React from 'react'
import classnames from 'classnames'
import Head from 'next/head'
import { useStoreState } from 'pullstate'
import { fbt } from 'fbt-runtime'
import { get } from 'lodash'

import AccountStore from 'stores/AccountStore'
import ContractStore from 'stores/ContractStore'
import withRpcProvider from 'hoc/withRpcProvider'
import AppFooter from './AppFooter'
import StarryBackground from './Stars'

const UNISWAP_URL =
  'https://app.uniswap.org/#/swap?inputCurrency=0xdac17f958d2ee523a2206206994597c13d831ec7&outputCurrency=0x2A8e1E676Ec238d8A992307B495b45B3fEAa5e86'

const Layout = ({
  locale,
  onLocale,
  children,
  dapp,
  short,
  shorter,
  medium,
  showUniswapNotice,
  storeTransaction,
  storeTransactionError,
}) => {
  const xusdContract = useStoreState(ContractStore, (s) =>
    get(s, 'contracts.xusd')
  )
  const rebaseOptedOut = useStoreState(AccountStore, (s) =>
    get(s, 'rebaseOptedOut')
  )

  const optIn = async () => {
    try {
      const result = await xusdContract.rebaseOptIn()
      storeTransaction(result, `rebaseOptIn`, 'xusd', {})
    } catch (error) {
      // 4001 code happens when a user rejects the transaction
      if (error.code !== 4001) {
        storeTransactionError(`rebaseOptIn`, 'xusd')
      }
      console.error('Error XUSD REBASE OPT IN: ', error)
    }
  }

  return (
    <>
      <Head>
        <title>Factor XUSD</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta
          property="og:image"
          key="og:image"
          content="https://xusd.fi/images/share-facebook.png"
        />
        <meta
          name="twitter:image"
          key="twitter:image"
          content="https://xusd.fi/images/share-twitter.png"
        />
      </Head>
      <div
        className={classnames(
          'notice text-white text-center p-3',
          {
            dapp,
          },
          rebaseOptedOut ? '' : 'd-none'
        )}
      >
        <div className="container d-flex flex-column flex-md-row align-items-center">
          <img
            src="/images/gnosis-safe-icon.svg"
            className="mb-2 mb-md-0 mr-md-3"
            style={{ width: '50px' }}
          />
          {fbt(
            'It looks like you are minting from a contract and have not opted into yield. You must opt in to receive yield.',
            'Rebase opt in notice'
          )}
          <button
            onClick={optIn}
            rel="noopener noreferrer"
            className="btn btn-dark mt-3 mt-md-0 ml-md-auto"
          >
            Opt in
          </button>
        </div>
      </div>
      <div
        className={classnames(
          'notice text-white text-center p-3',
          {
            dapp,
          },
          showUniswapNotice ? '' : 'd-none'
        )}
      >
        <div className="container d-flex flex-column flex-md-row align-items-center">
          <img src="/images/horsey.svg" className="mb-2 mb-md-0 mr-md-3" />
          {fbt(
            'Gas fees are high right now. It might be cheaper to buy XUSD on Uniswap.',
            'Uniswap notice'
          )}
          <a
            href={UNISWAP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-dark mt-3 mt-md-0 ml-md-auto"
          >
            Try Uniswap
          </a>
        </div>
      </div>
      <StarryBackground />
      <main className={classnames({ dapp, short, shorter, medium })}>
        {dapp && <div className="container">{children}</div>}
        {!dapp && children}
      </main>
      {dapp && <AppFooter dapp={dapp} locale={locale} onLocale={onLocale} />}
      <style jsx>{`
        .notice {
          background-color: #7a26f3;
          margin-bottom: 35px;
        }

        .notice.dapp {
          margin-bottom: 0px;
        }

        .notice .btn {
          font-size: 12px;
          height: auto;
          padding: 5px 20px;
        }

        .container {
          max-width: 940px !important;
          padding-left: 0px;
          padding-right: 0px;
        }
      `}</style>
    </>
  )
}

export default withRpcProvider(Layout)
