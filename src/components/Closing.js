import React from 'react'
import { fbt } from 'fbt-runtime'

import GetXUSD from './GetXUSD'

export default function Closing(props) {
  return (
    <div className="closing">
      <h5>
        {fbt(
          'Start earning with XUSD in just a few minutes',
          'Start earning with XUSD in just a few minutes'
        )}
      </h5>
      <GetXUSD
        className="mx-auto"
        style={{ marginTop: 40 }}
        {...props}
        trackSource="Footer section CTA"
      />
      <style jsx>{`
        h5 {
          font-family: Poppins;
          font-size: 1.75rem;
          font-weight: 500;
          line-height: 0.86;
        }

        @media (max-width: 992px) {
          h5 {
            font-size: 24px;
            line-height: 1.33;
          }
        }
      `}</style>
    </div>
  )
}
