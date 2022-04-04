import Moralis from 'moralis'
import { ethers, BigNumber } from 'ethers'
import moment from 'moment'

/* Moralis init code */
async function init() {
  return Moralis.start({
    serverUrl: process.env.MORALIS_RPC_PROVIDER,
    appId: process.env.MORALIS_APP_ID,
  })
}

export async function accountLifetimeYield(
  account: string,
  currentBalance: string
): Promise<number> {
  await init()

  const zeroFromAddress = '0x0000000000000000000000000000000000000000'
  const accountLower = account.toLowerCase()

  const recvQuery = new Moralis.Query('XUSDProxyTransfer').equalTo(
    'to',
    accountLower
  )
  const sentQuery = new Moralis.Query('XUSDProxyTransfer').equalTo(
    'from',
    accountLower
  )
  const results = await Moralis.Query.or(recvQuery, sentQuery).find()

  const totalMinted = results.reduce((prev, cur) => {
    let valueWithSign = cur.get('value')
    if (cur.get('from') == accountLower) {
      // debit transfer from account
      valueWithSign = '-' + valueWithSign
    }
    return prev.add(BigNumber.from(valueWithSign))
  }, BigNumber.from('0'))

  const lifetimeYield = BigNumber.from(
    ethers.utils.parseUnits(currentBalance, 18)
  ).sub(totalMinted)

  return parseFloat(ethers.utils.formatUnits(lifetimeYield, 18))
}

export async function totalSupplyEvents(): Promise<any[]> {
  await init()

  const XUSDProxyTotalSupplyUpdated = Moralis.Object.extend(
    'XUSDProxyTotalSupplyUpdated'
  )
  const query = new Moralis.Query(XUSDProxyTotalSupplyUpdated).greaterThan(
    'block_timestamp',
    moment().subtract(30, 'days').toDate()
  )
  const results = await query.find()

  return results
}
