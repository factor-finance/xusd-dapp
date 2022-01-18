import { fbt } from 'fbt-runtime'
import { useStoreState } from 'pullstate'
import Link from 'next/link'

import ContractStore from 'stores/ContractStore'
import analytics from 'utils/analytics'
import { getDocsLink } from 'utils/getDocsLink'
import LocaleDropdown from 'components/LocaleDropdown'
import { providerName, trackXUSDInWallet } from 'utils/web3'

const analyticsURL = process.env.ANALYTICS_URL
const jobsURL = process.env.JOBS_URL
const termsURL = process.env.TERMS_URL
const privacyURL = process.env.PRIVACY_URL
const discordURL = process.env.DISCORD_URL
export default function Footer({ onLocale, locale, dapp }) {
  const xusdAddr = useStoreState(
    ContractStore,
    (s) => s.contracts && s.contracts.xusd && s.contracts.xusd.address
  )
  const provider = providerName()
  return (
    <>
      <footer>
        <div className="container">
          <div className="row">
            <div className="col-12 col-lg-6 pl-lg-0">
              <nav className="nav d-flex justify-content-center justify-content-lg-start">
                {analyticsURL && (
                  <a
                    href={analyticsURL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="nav-link"
                    onClick={() => {
                      analytics.track('To Analytics', {
                        category: 'navigation',
                      })
                    }}
                  >
                    {fbt('Analytics', 'Analytics link')}
                  </a>
                )}
                {jobsURL && (
                  <a
                    href={jobsURL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="nav-link"
                    onClick={() => {
                      analytics.track('To Jobs', {
                        category: 'navigation',
                      })
                    }}
                  >
                    {fbt('Jobs', 'Jobs link')}
                  </a>
                )}
                <a
                  href={getDocsLink(locale)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="nav-link"
                  onClick={() => {
                    analytics.track('To Docs', {
                      category: 'navigation',
                    })
                  }}
                >
                  {fbt('Docs', 'Documentation link')}
                </a>
                {termsURL && (
                  <a
                    href={termsURL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="nav-link"
                    onClick={() => {
                      analytics.track('To Terms', {
                        category: 'navigation',
                      })
                    }}
                  >
                    {fbt('Terms', 'Terms link')}
                  </a>
                )}
                {privacyURL && (
                  <a
                    href={privacyURL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="nav-link"
                    onClick={() => {
                      analytics.track('To Privacy', {
                        category: 'navigation',
                      })
                    }}
                  >
                    {fbt('Privacy', 'Privacy link')}
                  </a>
                )}
                {discordURL && (
                  <a
                    href={discordURL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="nav-link"
                    onClick={() => {
                      analytics.track('To Discord', {
                        category: 'navigation',
                      })
                    }}
                  >
                    {fbt('Discord', 'Discord link')}
                  </a>
                )}
                {
                  <a
                    href="#"
                    rel="noreferrer"
                    className="nav-link"
                    onClick={() => {
                      trackXUSDInWallet(xusdAddr)
                    }}
                  >
                    {fbt('Add XUSD to Wallet', 'Add XUSD to Wallet')}
                  </a>
                }
              </nav>
            </div>
            <div className="col-12 col-lg-6 text-center text-lg-right pr-lg-0 d-flex justify-content-end">
              <LocaleDropdown
                footer
                locale={locale}
                onLocale={onLocale}
                outerClassName={`${dapp ? 'ml-2' : ''}`}
                className="nav-dropdown"
                useNativeSelectbox={false}
              />
              <a
                href="https://github.com/factor-finance"
                target="_blank"
                rel="noopener noreferrer"
                className="nav-link"
              >
                {fbt('Factor Finance', 'Factor Finance')}
              </a>
            </div>
          </div>
        </div>
      </footer>
      <style jsx>{`
        footer {
          background-color: #f2f3f5;
          color: #8293a4;
          font-size: 0.75rem;
          padding: 18px 0;
        }

        a:hover {
          color: black;
        }

        @media (max-width: 799px) {
        }
      `}</style>
    </>
  )
}
