import Moralis from 'moralis'
import { ethers, BigNumber } from 'ethers'

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

  const XUSDProxyTransfer = Moralis.Object.extend('XUSDProxyTransfer')
  const query = new Moralis.Query(XUSDProxyTransfer)
  query.containedIn('to', [accountLower, zeroFromAddress])
  query.containedIn('from', [accountLower, zeroFromAddress])
  const results = await query.find()

  const totalMinted = results.reduce((prev, cur) => {
    let valueWithSign = cur.get('value')
    if (cur.get('to') == zeroFromAddress) {
      // debit redeeming to the contract
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
  const query = new Moralis.Query(XUSDProxyTotalSupplyUpdated)
  const results = await query.find()

  return results
}
