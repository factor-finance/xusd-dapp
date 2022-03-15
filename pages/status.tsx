import React, { useEffect, useState } from 'react'
import { fbt } from 'fbt-runtime'
import moment from 'moment'
import { ethers } from 'ethers'
import { useStoreState } from 'pullstate'

import Layout from 'components/layout'
import Nav from 'components/Nav'
import BalanceHeader from 'components/buySell/BalanceHeader'
import ContractStore from 'stores/ContractStore'

function bigNum(value: string, decimals: number): number {
  return parseFloat(ethers.utils.formatUnits(value, decimals))
}

function bigNum18(value: string): number {
  return bigNum(value, 18)
}

function bigNum8(value: string): number {
  return bigNum(value, 8)
}

function bigNum6(value: string): number {
  return bigNum(value, 6)
}

function addrLink(value: any): any {
  // for array of addresses, return space separated list each one with addrLink called
  if (value.map) {
    return value
      .map((v) => addrLink(v))
      .reduce((prev, curr) => [prev, ' ', curr])
  }
  return value.toString().startsWith('0x') ? (
    <a
      href={`https://snowtrace.io/address/${value}`}
      target="blank"
      key={value}
    >
      {value}
    </a>
  ) : (
    value
  )
}

function section(title, data) {
  return (
    <>
      <thead>
        <tr>
          <th className="header-text">{title}</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {Object.entries(data).map(([key, value]) => {
          return (
            <tr key={key}>
              <td>{key}</td>
              <td>{value && addrLink(value)}</td>
            </tr>
          )
        })}
      </tbody>
      <style jsx>{`
        .header-text {
          font-size: 1.2rem;
          padding-top: 23px;
          padding-bottom: 10px;
        }
      `}</style>
    </>
  )
}

export default function NetworkStatus({ locale, onLocale }) {
  const c = useStoreState(ContractStore, (s) => s.network)
  const { usdt, dai, usdc, usdc_native, vault, xusd } = useStoreState(
    ContractStore,
    (s) => s.contracts
  )
  const [addresses, setAddresses] = useState({})
  const [governor, setGovernor] = useState({})
  const [governorAddresses, setGovernorAddresses] = useState({})
  const [xusdSettings, setXusdSettings] = useState({})
  const [oracle, setOracle] = useState({})
  const [vaultSettings, setVaultSettings] = useState({})
  const [vaultBalances, setVaultBalances] = useState({})
  const [vaultBufferBalances, setVaultBufferBalances] = useState({})
  const [strategiesBalances, setStrategiesBalances] = useState({})
  const [defaultStrategies, setDefaultStrategies] = useState({})
  const [aaveStrategy, setAaveStrategy] = useState({})
  const [curveStrategy, setCurveStrategy] = useState({})
  const [alphaHomoraStrategy, setAlphaHomoraStrategy] = useState({})

  useEffect(() => {
    if (!c) {
      return
    }
    const load = async () => {
      try {
        setAddresses({
          'XUSD proxy': c.XUSDProxy.address,
          'XUSD impl': await c.XUSDProxy.implementation(),
          XUSD: c.XUSD.__originalAddress,
          'Vault proxy': c.VaultProxy.address,
          'Vault impl': await c.VaultProxy.implementation(),
          Vault: c.Vault.__originalAddress,
          VaultCore: c.VaultCore.address,
          VaultAdmin: c.VaultAdmin.address,
          OracleRouter: c.OracleRouter.address,
          Governor: c.Governor.address,
          'AaveStrategy proxy': c.AaveStrategyProxy.address,
          'AaveStrategy impl': await c.AaveStrategyProxy.implementation(),
          AaveStrategy: c.AaveStrategy.__originalAddress,
          'CurveUsdcStrategy proxy': c.CurveUsdcStrategyProxy.address,
          'CurveUsdcStrategy impl':
            await c.CurveUsdcStrategyProxy.implementation(),
          CurveUsdcStrategy: c.CurveUsdcStrategy.__originalAddress,
          'AlphaHomoraStrategy proxy': c.AlphaHomoraStrategyProxy.address,
          'AlphaHomoraStrategy impl':
            await c.AlphaHomoraStrategyProxy.implementation(),
          AlphaHomoraStrategy: c.AlphaHomoraStrategy.__originalAddress,
        })
      } catch (e) {
        console.error(e)
      }
    }
    load()
  }, [c])

  useEffect(() => {
    if (!c) {
      return
    }
    const load = async () => {
      try {
        setGovernor({
          Admin: await c.Governor.admin(),
          'Pending Admin': await c.Governor.pendingAdmin(),
          'Delay (seconds)': (await c.Governor.delay()).toString(),
          'Proposal Count': (await c.Governor.proposalCount()).toString(),
        })
      } catch (e) {
        console.error(e)
      }
    }
    load()
  }, [c])

  useEffect(() => {
    if (!c) {
      return
    }
    const load = async () => {
      try {
        setGovernorAddresses({
          XUSD: await c.XUSDProxy.governor(),
          Vault: await c.VaultProxy.governor(),
          AaveStrategy: await c.AaveStrategyProxy.governor(),
          CurveUsdcStrategy: await c.CurveUsdcStrategyProxy.governor(),
        })
      } catch (e) {
        console.error(e)
      }
    }
    load()
  }, [c])

  useEffect(() => {
    if (!xusd) {
      return
    }
    const load = async () => {
      try {
        const totalSupply = await xusd.totalSupply()
        const nonRebasingSupply = await xusd.nonRebasingSupply()
        const rebasingSupply = totalSupply.sub(nonRebasingSupply)
        setXusdSettings({
          name: await xusd.name(),
          symbol: await xusd.symbol(),
          decimals: await xusd.decimals(),
          totalSupply: bigNum18(totalSupply),
          vaultAddress: await xusd.vaultAddress(),
          nonRebasingSupply: bigNum18(nonRebasingSupply),
          rebasingSupply: bigNum18(rebasingSupply),
          rebasingCreditsPerToken: bigNum18(
            await xusd.rebasingCreditsPerToken()
          ),
          rebasingCredits: bigNum18(await xusd.rebasingCredits()),
        })
      } catch (e) {
        console.error(e)
      }
    }
    load()
  }, [xusd])

  useEffect(() => {
    if (!c) {
      return
    }
    const load = async () => {
      try {
        setOracle({
          'DAI.e': bigNum8(await c.OracleRouter.price(dai.address)),
          'USDT.e': bigNum8(await c.OracleRouter.price(usdt.address)),
          'USDC.e': bigNum8(await c.OracleRouter.price(usdc.address)),
          USDC: bigNum8(await c.OracleRouter.price(usdc_native.address)),
        })
      } catch (e) {
        console.error(e)
      }
    }
    load()
  }, [c, dai, usdc, usdc_native, usdt])

  useEffect(() => {
    if (!vault) {
      return
    }
    const load = async () => {
      try {
        const vaultBuffer = bigNum18(await vault.vaultBuffer())
        const redeemFeeBps = await vault.redeemFeeBps()
        const trusteeFeeBps = await vault.trusteeFeeBps()
        setVaultSettings({
          rebasePaused: (await vault.rebasePaused()).toString(),
          capitalPaused: (await vault.capitalPaused()).toString(),
          redeemFeeBps: `${redeemFeeBps} (${redeemFeeBps / 100}%)`,
          trusteeFeeBps: `${trusteeFeeBps} (${trusteeFeeBps / 100}%)`,
          vaultBuffer: `${vaultBuffer} (${vaultBuffer * 100}%)`,
          'autoAllocateThreshold (USD)': bigNum18(
            await vault.autoAllocateThreshold()
          ),
          'rebaseThreshold (USD)': bigNum18(await vault.rebaseThreshold()),
          maxSupplyDiff: bigNum(await vault.maxSupplyDiff(), 16),
          'Price provider address': await vault.priceProvider(),
          'Uniswap address': await vault.uniswapAddr(),
          'Strategy count': (await vault.getStrategyCount()).toString(),
          'Asset count': (await vault.getAssetCount()).toString(),
          'Strategist address': await vault.strategistAddr(),
          'Trustee address': await vault.trusteeAddress(),
        })
      } catch (e) {
        console.error(e)
      }
    }
    load()
  }, [vault])

  useEffect(() => {
    if (!vault) {
      return
    }
    const load = async () => {
      try {
        setVaultBalances({
          'totalValue (USD)': bigNum18(await vault.totalValue()).toFixed(2),
          'DAI.e': bigNum18(await vault.checkBalance(dai.address)).toFixed(2),
          'USDT.e': bigNum6(await vault.checkBalance(usdt.address)).toFixed(2),
          'USDC.e': bigNum6(await vault.checkBalance(usdc.address)).toFixed(2),
          USDC: bigNum6(await vault.checkBalance(usdc_native.address)).toFixed(
            2
          ),
        })
      } catch (e) {
        console.error(e)
      }
    }
    load()
  }, [vault, dai, usdc, usdc_native, usdt])

  useEffect(() => {
    if (!vault) {
      return
    }
    const load = async () => {
      try {
        setVaultBufferBalances({
          'DAI.e': bigNum18(await dai.balanceOf(vault.address)).toFixed(2),
          'USDT.e': bigNum6(await usdt.balanceOf(vault.address)).toFixed(2),
          'USDC.e': bigNum6(await usdc.balanceOf(vault.address)).toFixed(2),
          USDC: bigNum6(await usdc_native.balanceOf(vault.address)).toFixed(2),
        })
      } catch (e) {
        console.error(e)
      }
    }
    load()
  }, [vault, dai, usdc, usdc_native, usdt])

  useEffect(() => {
    if (!c) {
      return
    }
    const load = async () => {
      try {
        setStrategiesBalances({
          'Aave avDAI.e': bigNum18(
            await c.AaveStrategy.checkBalance(dai.address)
          ),
          'Aave avUSDT.e': bigNum6(
            await c.AaveStrategy.checkBalance(usdt.address)
          ),
          'Aave avUSDC.e': bigNum6(
            await c.AaveStrategy.checkBalance(usdc.address)
          ),
          'Curve USDC/USDC.e':
            bigNum6(await c.CurveUsdcStrategy.checkBalance(usdc.address)) * 2,
        })
      } catch (e) {
        console.error(e)
      }
    }
    load()
  }, [c, dai, usdc, usdc_native, usdt])

  useEffect(() => {
    if (!vault) {
      return
    }
    const load = async () => {
      try {
        setDefaultStrategies({
          'DAI.e': await vault.assetDefaultStrategies(dai.address),
          'USDT.e': await vault.assetDefaultStrategies(usdt.address),
          'USDC.e': await vault.assetDefaultStrategies(usdc.address),
          USDC: await vault.assetDefaultStrategies(usdc_native.address),
        })
      } catch (e) {
        console.error(e)
      }
    }
    load()
  }, [vault, dai, usdc, usdc_native, usdt])

  useEffect(() => {
    if (!c) {
      return
    }
    const load = async () => {
      try {
        setAaveStrategy({
          vaultAddress: await c.AaveStrategy.vaultAddress(),
          platformAddress: await c.AaveStrategy.platformAddress(),
          rewardTokenAddresses: await c.AaveStrategy.getRewardTokenAddresses(),
          rewardLiquidationThreshold: (
            await c.AaveStrategy.rewardLiquidationThreshold()
          ).toString(),
          'supportsAsset(DAI.e)': (
            await c.AaveStrategy.supportsAsset(dai.address)
          ).toString(),
          'supportsAsset(USDT.e)': (
            await c.AaveStrategy.supportsAsset(usdt.address)
          ).toString(),
          'supportsAsset(USDC.e)': (
            await c.AaveStrategy.supportsAsset(usdc.address)
          ).toString(),
          'supportsAsset(USDC)': (
            await c.AaveStrategy.supportsAsset(usdc_native.address)
          ).toString(),
        })
      } catch (e) {
        console.error(e)
      }
    }
    load()
  }, [c, dai, usdc, usdc_native, usdt])

  useEffect(() => {
    if (!c) {
      return
    }
    const load = async () => {
      try {
        setCurveStrategy({
          vaultAddress: await c.CurveUsdcStrategy.vaultAddress(),
          platformAddress: await c.CurveUsdcStrategy.platformAddress(),
          rewardTokenAddresses:
            await c.CurveUsdcStrategy.getRewardTokenAddresses(),
          rewardLiquidationThreshold: (
            await c.CurveUsdcStrategy.rewardLiquidationThreshold()
          ).toString(),
          'supportsAsset(DAI.e)': (
            await c.CurveUsdcStrategy.supportsAsset(dai.address)
          ).toString(),
          'supportsAsset(USDT.e)': (
            await c.CurveUsdcStrategy.supportsAsset(usdt.address)
          ).toString(),
          'supportsAsset(USDC.e)': (
            await c.CurveUsdcStrategy.supportsAsset(usdc.address)
          ).toString(),
          'supportsAsset(USDC)': (
            await c.CurveUsdcStrategy.supportsAsset(usdc_native.address)
          ).toString(),
        })
      } catch (e) {
        console.error(e)
      }
    }
    load()
  }, [c, dai, usdc, usdc_native, usdt])

  useEffect(() => {
    if (!c) {
      return
    }
    const load = async () => {
      try {
        setAlphaHomoraStrategy({
          vaultAddress: await c.AlphaHomoraStrategy.vaultAddress(),
          platformAddress: await c.AlphaHomoraStrategy.platformAddress(),
          rewardTokenAddresses:
            await c.AlphaHomoraStrategy.getRewardTokenAddresses(),
          rewardLiquidationThreshold: (
            await c.AlphaHomoraStrategy.rewardLiquidationThreshold()
          ).toString(),
          'supportsAsset(DAI.e)': (
            await c.AlphaHomoraStrategy.supportsAsset(dai.address)
          ).toString(),
          'supportsAsset(USDT.e)': (
            await c.AlphaHomoraStrategy.supportsAsset(usdt.address)
          ).toString(),
          'supportsAsset(USDC.e)': (
            await c.AlphaHomoraStrategy.supportsAsset(usdc.address)
          ).toString(),
          'supportsAsset(USDC)': (
            await c.AlphaHomoraStrategy.supportsAsset(usdc_native.address)
          ).toString(),
        })
      } catch (e) {
        console.error(e)
      }
    }
    load()
  }, [c, dai, usdc, usdc_native, usdt])

  return (
    <>
      <Layout locale={locale} onLocale={onLocale} dapp>
        <Nav dapp page={'status'} locale={locale} onLocale={onLocale} />
        <div className="d-flex flex-column p-0 pt-md-3">
          <BalanceHeader />

          <div className="status-table">
            <h4 style={{ padding: '0.75rem', fontWeight: 'bold' }}>
              Factor XUSD network status: 🟢
            </h4>
            <table className="table table-right">
              {section('Strategy balances', strategiesBalances)}
              {section('Vault balances', vaultBalances)}
              {section('Vault buffer balances', vaultBufferBalances)}
              {section('Vault settings', vaultSettings)}
              {section('Contract addresses', addresses)}
              {section('Oracle prices', oracle)}
              {section('Default strategies', defaultStrategies)}
              {section('Aave avToken strategy', aaveStrategy)}
              {section('Curve USDC/USDC.e strategy', curveStrategy)}
              {section('Alpha Homora strategy', alphaHomoraStrategy)}
              {section('XUSD', xusdSettings)}
              {section('Governor', governor)}
              {section('Governor addresses', governorAddresses)}
            </table>
          </div>
        </div>
      </Layout>
      <style jsx>{`
        .status-table {
          min-height: 470px;
          height: 100%;
          padding: 20px;
          border-radius: 0 0 10px 10px;
          border-top: solid 1px #cdd7e0;
          background-color: #fafbfc;
        }
      `}</style>
    </>
  )
}
