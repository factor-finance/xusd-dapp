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

    const { usdt, dai, usdc, xusd, vault } = contracts

    const loadbalancesDev = async () => {
      try {
        const [xusdBalance, usdtBalance, daiBalance, usdcBalance] =
          await Promise.all([
            /* IMPORTANT (!) production uses a different method to load balances. Any changes here need to
             * also happen in production version of this function.
             */
            displayCurrency(await xusd.balanceOf(account), xusd),
            displayCurrency(await usdt.balanceOf(account), usdt),
            displayCurrency(await dai.balanceOf(account), dai),
            displayCurrency(await usdc.balanceOf(account), usdc),
          ])

        AccountStore.update((s) => {
          s.balances = {
            usdt: usdtBalance,
            dai: daiBalance,
            usdc: usdcBalance,
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
      const data = {
        jsonrpc: '2.0',
        method: 'alchemy_getTokenBalances',
        params: [
          account,
          [xusd.address, usdt.address, dai.address, usdc.address],
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
          `Could not fetch balances from Alchemy http status: ${response.status}`
        )
      }
    }

    const loadBalances = async () => {
      if (!account) return

      if (isProduction) {
        await loadBalancesProd()
      } else {
        await loadbalancesDev()
      }
    }

    const loadAllowances = async () => {
      if (!account) return

      try {
        const [
          usdtAllowanceVault,
          daiAllowanceVault,
          usdcAllowanceVault,
          xusdAllowanceVault,
        ] = await Promise.all([
          displayCurrency(await usdt.allowance(account, vault.address), usdt),
          displayCurrency(await dai.allowance(account, vault.address), dai),
          displayCurrency(await usdc.allowance(account, vault.address), usdc),
          displayCurrency(await xusd.allowance(account, vault.address), xusd),
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

    await Promise.all([loadBalances(), loadAllowances(), loadRebaseStatus()])
  }

  useEffect(() => {
    if (account) {
      login(account, setCookie)
    }

    const loadLifetimeEarnings = async () => {
      if (!account) return

      // FIXME: set up analytics
      let response
      response = await fetch(
        `${
          process.env.ANALYTICS_ENDPOINT
        }/api/v1/address/${account.toLowerCase()}/yield`
      )
      if (!response) return

      if (response.ok) {
        const lifetimeYield = (await response.json()).lifetime_yield
        AccountStore.update((s) => {
          s.lifetimeYield = lifetimeYield
        })
      }
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
    loadLifetimeEarnings()
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
