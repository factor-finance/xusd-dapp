import React, { useState, useEffect } from 'react'
import { ethers, BigNumber } from 'ethers'
import { useCookies } from 'react-cookie'
import { useWeb3React } from '@web3-react/core'
import _ from 'lodash'

import AccountStore from 'stores/AccountStore'
import ContractStore from 'stores/ContractStore'
import { usePrevious } from 'utils/hooks'
import { isCorrectNetwork } from 'utils/web3'
import { useStoreState } from 'pullstate'
import { setupContracts } from 'utils/contracts'
import { login } from 'utils/account'
import { accountLifetimeYield } from 'utils/moralis'

import { displayCurrency } from 'utils/math'

const AccountListener = (props) => {
  const web3react = useWeb3React()
  const { account, chainId, library, active } = web3react
  const prevAccount = usePrevious(account)
  const prevActive = usePrevious(active)
  const [contracts, setContracts] = useState(null)
  const [setCookie] = useCookies(['loggedIn'])
  const {
    active: userActive,
    refetchUserData,
    refetchStakingData,
  } = useStoreState(AccountStore, (s) => s)
  const prevRefetchStakingData = usePrevious(refetchStakingData)
  const prevRefetchUserData = usePrevious(refetchUserData)
  const isDevelopment = process.env.NODE_ENV === 'development'
  const isProduction = process.env.NODE_ENV === 'production'

  useEffect(() => {
    if ((prevActive && !active) || prevAccount !== account) {
      AccountStore.update((s) => {
        s.allowances = {}
        s.balances = {}
      })
    }
  }, [active, prevActive, account, prevAccount])

  useEffect(() => {
    const fetchVaultThresholds = async () => {
      if (!contracts) return

      const vault = contracts.vault
      const allocateThreshold = await vault.autoAllocateThreshold()
      const rebaseThreshold = await vault.rebaseThreshold()

      ContractStore.update((s) => {
        s.vaultAllocateThreshold = allocateThreshold
        s.vaultRebaseThreshold = rebaseThreshold
      })
    }

    fetchVaultThresholds()
  }, [contracts])

  const loadData = async (contracts, {} = {}) => {
    if (!account) {
      return
    }
    if (!contracts) {
      console.warn('Contracts not yet loaded!')
      return
    }
    if (!isCorrectNetwork(chainId)) {
      return
    }

    const { usdt, dai, usdc, usdc_native, xusd, vault } = contracts

    const loadbalancesDev = async () => {
      try {
        const [
          xusdBalance,
          usdtBalance,
          daiBalance,
          usdcBalance,
          usdcNativeBalance,
        ] = await Promise.all([
          /* IMPORTANT (!) production uses a different method to load balances. Any changes here need to
           * also happen in production version of this function.
           */
          xusd.balanceOf(account).then((bal) => displayCurrency(bal, xusd)),
          usdt.balanceOf(account).then((bal) => displayCurrency(bal, usdt)),
          dai.balanceOf(account).then((bal) => displayCurrency(bal, dai)),
          usdc.balanceOf(account).then((bal) => displayCurrency(bal, usdc)),
          usdc_native
            .balanceOf(account)
            .then((bal) => displayCurrency(bal, usdc_native)),
        ])

        AccountStore.update((s) => {
          s.balances = {
            usdt: usdtBalance,
            dai: daiBalance,
            usdc: usdcBalance,
            usdc_native: usdcNativeBalance,
            xusd: xusdBalance,
          }
        })
      } catch (e) {
        console.error(
          'AccountListener.js error - can not load account balances: ',
          e
        )
      }
    }

    let jsonCallId = 1
    const loadBalancesProd = async () => {
      // FIXME call using provider.call?
      const data = {
        jsonrpc: '2.0',
        method: 'eth_getTokenBalances',
        params: [
          account,
          [
            xusd.address,
            usdt.address,
            dai.address,
            usdc.address,
            usdc_native.address,
          ],
        ],
        id: jsonCallId.toString(),
      }
      jsonCallId++

      const response = await fetch(process.env.ETHEREUM_RPC_PROVIDER, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        referrerPolicy: 'no-referrer',
        body: JSON.stringify(data),
      })
      if (response.ok) {
        const responseJson = await response.json()
        const balanceData = {}

        const allContractData = [
          { name: 'xusd', decimals: 18, contract: xusd },
          { name: 'usdt', decimals: 6, contract: usdt },
          { name: 'dai', decimals: 18, contract: dai },
          { name: 'usdc', decimals: 6, contract: usdc },
          { name: 'usdc_native', decimals: 6, contract: usdc_native },
        ]

        allContractData.forEach((contractData) => {
          const balanceResponseData = responseJson.result.tokenBalances.filter(
            (tokenBalanceData) =>
              tokenBalanceData.contractAddress.toLowerCase() ===
              contractData.contract.address.toLowerCase()
          )[0]

          if (balanceResponseData.error === null) {
            balanceData[contractData.name] =
              balanceResponseData.tokenBalance === '0x'
                ? '0'
                : ethers.utils.formatUnits(
                    balanceResponseData.tokenBalance,
                    contractData.decimals
                  )
          } else {
            console.error(
              `Can not load balance for ${contractData.name} reason: ${balanceResponseData.error}`
            )
          }
        })

        AccountStore.update((s) => {
          s.balances = balanceData
        })
      } else {
        throw new Error(
          `Could not fetch balances http status: ${response.status}`
        )
      }
    }

    const loadBalances = async () => {
      if (!account) return

      if (false) {
        await loadBalancesProd()
      } else {
        await loadbalancesDev()
      }
    }

    const loadAllowances = async () => {
      if (!account) return

      try {
        const [
          xusdAllowanceVault,
          usdtAllowanceVault,
          daiAllowanceVault,
          usdcAllowanceVault,
          usdcNativeAllowanceVault,
        ] = await Promise.all([
          xusd
            .allowance(account, vault.address)
            .then((bal) => displayCurrency(bal, xusd)),
          usdt
            .allowance(account, vault.address)
            .then((bal) => displayCurrency(bal, usdt)),
          dai
            .allowance(account, vault.address)
            .then((bal) => displayCurrency(bal, dai)),
          usdc
            .allowance(account, vault.address)
            .then((bal) => displayCurrency(bal, usdc)),
          usdc_native
            .allowance(account, vault.address)
            .then((bal) => displayCurrency(bal, usdc_native)),
        ])

        AccountStore.update((s) => {
          s.allowances = {
            usdt: {
              vault: usdtAllowanceVault,
            },
            dai: {
              vault: daiAllowanceVault,
            },
            usdc: {
              vault: usdcAllowanceVault,
            },
            usdc_native: {
              vault: usdcNativeAllowanceVault,
            },
            xusd: {
              vault: xusdAllowanceVault,
            },
          }
        })
      } catch (e) {
        console.error(
          'AccountListener.js error - can not load account allowances: ',
          e
        )
      }
    }

    const loadRebaseStatus = async () => {
      if (!account) return
      // TODO handle other contract types. We only detect Gnosis Safe as having
      // opted out here as rebaseState will always be 0 for all EOAs
      const isSafe = !!_.get(library, 'provider.safe.safeAddress', false)
      AccountStore.update((s) => {
        s.isSafe = isSafe
      })
      const rebaseOptInState = await xusd.rebaseState(account)
      AccountStore.update((s) => {
        s.rebaseOptedOut = isSafe && rebaseOptInState === 0
      })
    }

    const loadLifetimeEarnings = async () => {
      if (!account) return

      const xusdBalance = AccountStore.currentState.balances['xusd']
      if (!xusdBalance) return

      const lifetimeYield = await accountLifetimeYield(account, xusdBalance)

      AccountStore.update((s) => {
        s.lifetimeYield = lifetimeYield
      })
    }

    await Promise.all([
      loadBalances().then(loadLifetimeEarnings),
      loadAllowances(),
      loadRebaseStatus(),
    ])
  }

  useEffect(() => {
    if (account) {
      login(account, setCookie)
    }

    const setupContractsAndLoad = async () => {
      /* If we have a web3 provider present and is signed into the allowed network:
       * - NODE_ENV === production -> mainnet
       * - NODE_ENV === development -> localhost, forknet
       * then we use that chainId to setup contracts.
       *
       * In other case we still want to have read only capability of the contracts with a general provider
       * so we can fetch `getAPR` from Vault for example to use on marketing pages even when the user is not
       * logged in with a web3 provider.
       *
       */
      let usedChainId, usedLibrary
      if (chainId && isCorrectNetwork(chainId)) {
        usedChainId = chainId
        usedLibrary = library
      } else {
        usedChainId = parseInt(process.env.ETHEREUM_RPC_CHAIN_ID)
        usedLibrary = null
      }

      window.fetchId = window.fetchId ? window.fetchId : 0
      window.fetchId += 1
      const contracts = await setupContracts(
        account,
        usedLibrary,
        usedChainId,
        window.fetchId
      )
      setContracts(contracts)

      setTimeout(() => {
        loadData(contracts)
      }, 1)
    }

    setupContractsAndLoad()
  }, [account, chainId])

  useEffect(() => {
    // trigger a force referch user data when the flag is set by a user
    if (
      (contracts && isCorrectNetwork(chainId),
      refetchUserData && !prevRefetchUserData)
    ) {
      loadData(contracts)
    }
    AccountStore.update((s) => {
      s.refetchUserData = false
    })
  }, [userActive, contracts, refetchUserData, prevRefetchUserData])

  useEffect(() => {
    // trigger a force referch user data when the flag is set by a user
    if (
      (contracts && isCorrectNetwork(chainId),
      refetchStakingData && !prevRefetchStakingData)
    ) {
      loadData(contracts, { onlyStaking: true })
    }
    AccountStore.update((s) => {
      s.refetchStakingData = false
    })
  }, [userActive, contracts, refetchStakingData, prevRefetchStakingData])

  useEffect(() => {
    let balancesInterval
    if (contracts && userActive === 'active' && isCorrectNetwork(chainId)) {
      loadData(contracts)

      balancesInterval = setInterval(() => {
        loadData(contracts)
      }, 7000)
    }

    return () => {
      if (balancesInterval) {
        clearInterval(balancesInterval)
      }
    }
  }, [userActive, contracts])

  return ''
}

export default AccountListener
