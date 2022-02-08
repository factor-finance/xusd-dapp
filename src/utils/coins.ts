const displayName = {
  usdt: 'USDT.e',
  usdc: 'USDC.e',
  usdc_native: 'USDC',
  dai: 'DAI.e',
  xusd: 'XUSD',
  mix: 'Mix',
}

export function coinDisplayName(coin: string): string {
  return displayName[coin] || coin.toUpperCase()
}
