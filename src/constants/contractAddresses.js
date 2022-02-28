/* IMPORTANT these are duplicated in `dapp/src/constants/contractAddresses` changes here should
 * also be done there.
 */

const addresses = {}

addresses.mainnet = {}

// Native stablecoins
addresses.mainnet.DAIe = '0xd586E7F844cEa2F87f50152665BCbc2C279D8d70'
addresses.mainnet.USDCe = '0xA7D7079b0FEaD91F3e65f86E8915Cb59c1a4C664'
addresses.mainnet.USDTe = '0xc7198437980c041c805A1EDcbA50c1Ce5db95118'

// REDEFINE
addresses.mainnet.DAI = addresses.mainnet.DAIe
addresses.mainnet.USDC = addresses.mainnet.USDCe
addresses.mainnet.USDT = addresses.mainnet.USDTe

addresses.mainnet.USDC_native = '0xb97ef9ef8734c71904d8002f8b6bc66dd9c48a6e'
addresses.mainnet.USDT_native = '0x9702230a8ea53601f5cd2dc00fdbc13d4df4a8c7'

// Chainlink feeds
// Source https://data.chain.link/avalanche/mainnet
addresses.mainnet.chainlinkAVAX_USD =
  '0x0a77230d17318075983913bc2145db16c7366156'

addresses.mainnet.CurveAddressProvider =
  '0x0000000022d53366457f9d5e68ec105046fc4383'
addresses.mainnet.CurveXUSDMetaPool =
  '0x7F2d1C7b8911901de7c9785d6E7A7A10d8dEff66'
addresses.mainnet.CurveZapper = '0x001E3BA199B4FF4B5B6e97aCD96daFC0E2e4156e'

/* --- FUJI --- */
addresses.fuji = {}

addresses.fuji.USDT = '0x02823f9B469960Bb3b1de0B3746D4b95B7E35543' // mintable
addresses.fuji.DAI = '0x51BC2DfB9D12d9dB50C855A5330fBA0faF761D15'
addresses.fuji.USDC = '0x3a9fc2533eafd09bc5c36a7d6fdd0c664c81d659'

addresses.fuji.chainlinkAVAX_USD = '0x5498bb86bc934c8d34fda08e81d444153d0d06ad'

module.exports = addresses
