const hre = require("hardhat");

const addresses = require("../utils/addresses");
const { log, deploymentWithProposal } = require("../utils/deploy");

module.exports = deploymentWithProposal(
  { deployName: "021_solidity_upgrade" },
  async ({
    oracleAddresses,
    assetAddresses,
    ethers,
    deployWithConfirmation,
    withConfirmation,
  }) => {
    const { deployerAddr } = await hre.getNamedAccounts();

    const sDeployer = await ethers.provider.getSigner(deployerAddr);
    // Vault and XUSD contracts
    const dXUSD = await deployWithConfirmation("XUSD");
    log("Deployed XUSD...");
    const dVaultAdmin = await deployWithConfirmation("VaultAdmin");
    const dVaultCore = await deployWithConfirmation("VaultCore");
    log("Deployed VaultAdmin and VaultCore...");
    const cXUSDProxy = await ethers.getContract("XUSDProxy");
    const cVaultProxy = await ethers.getContract("VaultProxy");
    const cVault = await ethers.getContractAt("Vault", cVaultProxy.address);
    const cVaultCore = await ethers.getContractAt(
      "VaultCore",
      cVaultProxy.address
    );
    const cGovernor = await ethers.getContract("Governor");

    // Oracle contract
    const dOracleRouter = await deployWithConfirmation("OracleRouter");
    log("Deployed OracleRouter...");

    // Buyback contract
    const cOldBuyback = await ethers.getContract("Buyback");
    const cOGN = await ethers.getContractAt("MockOGN", assetAddresses.OGN);
    const ognBalance = await cOGN.balanceOf(cOldBuyback.address);
    await deployWithConfirmation("Buyback", [
      assetAddresses.uniswapRouter,
      cVaultProxy.address,
      cXUSDProxy.address,
      assetAddresses.OGN,
      assetAddresses.USDT,
      assetAddresses.WETH,
      oracleAddresses.chainlink.OGN_ETH,
      oracleAddresses.chainlink.AVAX_USD,
    ]);
    log("Deployed Buyback...");

    const cBuyback = await ethers.getContract("Buyback");
    // Transfer Buyback governance to governor
    await withConfirmation(
      cBuyback.connect(sDeployer).transferGovernance(cGovernor.address)
    );
    log("Transferred governance of Buyback...");

    // Old strategies for removal
    const cOldCompoundStrategyProxy = await ethers.getContract(
      "CompoundStrategyProxy"
    );
    const cOldAaveStrategyProxy = await ethers.getContract("AaveStrategyProxy");
    const cOldThreePoolStrategyProxy = await ethers.getContract(
      "ThreePoolStrategyProxy"
    );
    /**
     *
     * Compound strategy
     *
     */

    const dCompoundStrategyProxy = await deployWithConfirmation(
      "CompoundStrategyProxy",
      [],
      "InitializeGovernedUpgradeabilityProxy"
    );
    log("Deployed CompoundStrategyProxy...");
    const cCompoundStrategyProxy = await ethers.getContractAt(
      "CompoundStrategyProxy",
      dCompoundStrategyProxy.address
    );
    const dCompoundStrategy = await deployWithConfirmation("CompoundStrategy");
    log("Deployed CompoundStrategy...");
    await withConfirmation(
      cCompoundStrategyProxy.connect(sDeployer)[
        // eslint-disable-next-line
        "initialize(address,address,bytes)"
      ](dCompoundStrategy.address, deployerAddr, [])
    );
    log("Initialized CompoundStrategyProxy...");
    const cCompoundStrategy = await ethers.getContractAt(
      "CompoundStrategy",
      dCompoundStrategyProxy.address
    );
    await withConfirmation(
      cCompoundStrategy
        .connect(sDeployer)
        ["initialize(address,address,address,address[],address[])"](
          addresses.dead,
          cVaultProxy.address,
          assetAddresses.COMP,
          [assetAddresses.USDC, assetAddresses.USDT],
          [assetAddresses.cUSDC, assetAddresses.cUSDT]
        )
    );
    log("Initialized CompoundStrategy...");
    // Transfer CompoundStrategy governance to governor
    await withConfirmation(
      cCompoundStrategy.connect(sDeployer).transferGovernance(cGovernor.address)
    );
    log("Transferred governance of CompoundStrategy...");

    /**
     *
     * AAVE strategy
     *
     */
    const dAaveStrategyProxy = await deployWithConfirmation(
      "AaveStrategyProxy",
      [],
      "InitializeGovernedUpgradeabilityProxy"
    );
    log("Deployed AaveStrategyProxy...");
    const cAaveStrategyProxy = await ethers.getContract("AaveStrategyProxy");
    const dAaveStrategy = await deployWithConfirmation("AaveStrategy");
    log("Deployed AaveStrategy");
    const cAaveStrategy = await ethers.getContractAt(
      "AaveStrategy",
      dAaveStrategyProxy.address
    );
    await withConfirmation(
      cAaveStrategyProxy
        .connect(sDeployer)
        ["initialize(address,address,bytes)"](
          dAaveStrategy.address,
          deployerAddr,
          []
        )
    );
    log("Initialized AaveStrategyProxy...");
    const initFunction =
      "initialize(address,address,address,address[],address[],address,address)";
    await withConfirmation(
      cAaveStrategy
        .connect(sDeployer)
        // eslint-disable-next-line
        [initFunction](
          assetAddresses.AAVE_ADDRESS_PROVIDER,
          cVault.address,
          assetAddresses.AAVE,
          [assetAddresses.DAI],
          [assetAddresses.avDAI],
          assetAddresses.AAVE_INCENTIVES_CONTROLLER,
          assetAddresses.STKAAVE
        )
    );
    log("Initialized AaveStrategy...");

    await withConfirmation(
      cAaveStrategy.connect(sDeployer).transferGovernance(cGovernor.address)
    );
    log("Transferred governance of AaveStrategy...");

    // Governance proposal
    return {
      name: "Deploy all new contracts and migrate all funds",
      actions: [
        {
          // Claim governance of XUSDProxy, transferred in 020_new_governor
          contract: cXUSDProxy,
          signature: "claimGovernance()",
        },
        {
          // Claim governance of cVaultProxy, transferred in 020_new_governor
          contract: cVaultProxy,
          signature: "claimGovernance()",
        },
        {
          // Claim governance of Buyback
          contract: cBuyback,
          signature: "claimGovernance()",
        },
        {
          // Claim governance of old Buyback
          contract: cOldBuyback,
          signature: "claimGovernance()",
        },
        {
          // Claim Governance of Compound strategy
          contract: cCompoundStrategy,
          signature: "claimGovernance()",
        },
        {
          // Claim Governance of Aave strategy
          contract: cAaveStrategy,
          signature: "claimGovernance()",
        },
        {
          // Upgrade XUSD implementation
          contract: cXUSDProxy,
          signature: "upgradeTo(address)",
          args: [dXUSD.address],
        },
        {
          // Set VaultCore implementation
          contract: cVaultProxy,
          signature: "upgradeTo(address)",
          args: [dVaultCore.address],
        },
        {
          // Set VaultAdmin implementation
          contract: cVault,
          signature: "setAdminImpl(address)",
          args: [dVaultAdmin.address],
        },
        {
          // Set new trustee
          contract: cVault,
          signature: "setTrusteeAddress(address)",
          args: [cBuyback.address],
        },
        {
          // Collect old OGN
          contract: cOldBuyback,
          signature: "transferToken(address,uint256)",
          args: [cOGN.address, ognBalance],
        },
        {
          // Move old OGN forward to new contract
          contract: cOGN,
          signature: "transfer(address,uint256)",
          args: [cBuyback.address, ognBalance],
        },
        {
          // Set new oracle address
          contract: cVault,
          signature: "setPriceProvider(address)",
          args: [dOracleRouter.address],
        },
        {
          // Add CRV as a swap token
          contract: cVault,
          signature: "addSwapToken(address)",
          args: [assetAddresses.CRV],
        },
        {
          // Add COMP as a swap token
          contract: cVault,
          signature: "addSwapToken(address)",
          args: [assetAddresses.COMP],
        },
        {
          // Add AAVE as a swap token
          contract: cVault,
          signature: "addSwapToken(address)",
          args: [assetAddresses.AAVE],
        },
        {
          // Approve Compound strategy in Vault
          contract: cVault,
          signature: "approveStrategy(address)",
          args: [cCompoundStrategyProxy.address],
        },
        {
          // Remove the deafult strategy for DAI
          contract: cVault,
          signature: "setAssetDefaultStrategy(address,address)",
          args: [assetAddresses.DAI, addresses.zero],
        },
        {
          // Add Compound as default USDT strategy
          contract: cVault,
          signature: "setAssetDefaultStrategy(address,address)",
          args: [assetAddresses.USDT, cCompoundStrategyProxy.address],
        },
        {
          // Add Compound as default USDC strategy
          contract: cVault,
          signature: "setAssetDefaultStrategy(address,address)",
          args: [assetAddresses.USDC, cCompoundStrategyProxy.address],
        },
        {
          // Approve AAVE strategy in Vault
          contract: cVault,
          signature: "approveStrategy(address)",
          args: [cAaveStrategyProxy.address],
        },
        {
          // Remove old Compound strategy
          contract: cVault,
          signature: "removeStrategy(address)",
          args: [cOldCompoundStrategyProxy.address],
        },
        {
          // Remove old Aave strategy
          contract: cVault,
          signature: "removeStrategy(address)",
          args: [cOldAaveStrategyProxy.address],
        },
        {
          // Remove old Aave strategy
          contract: cVault,
          signature: "removeStrategy(address)",
          args: [cOldThreePoolStrategyProxy.address],
        },
        {
          // Allocate funds to newly deployed strategies
          contract: cVaultCore,
          signature: "allocate()",
        },
      ],
    };
  }
);
