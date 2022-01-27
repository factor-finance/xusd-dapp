## Getting Started

Compile the contracts from [xusd-contracts](https://github.com/factor-finance/xusd-contracts/) to generate the network.json file and start a local blockchain:
```bash
cd ../xusd-contracts
yarn install
yarn run clean // a lot of times contracts do not get deployed properly without this
FORK=mainnet yarn run_node:fork
cp deployments/network.json ../xusd-dapp/
```

### Running the dApp Locally

Open a separate terminal to run the dApp in.

```bash
# Install the dependencies - Note your Node version 'Requirements' 
yarn install
```

The dApp will need to be started in standalone or forked mode - depending on how the hardhat node is running.
#### Forked Mode
```bash
# Start the dApp in forked mode
yarn dev
```

#### Standalone Mode
```bash
# Start the dApp in standalone mode
yarn run start
```

- Open http://localhost:3000 in your browser and connect your `Metamask` account. See [HERE](https://github.com/factor-finance/xusd-contracts#configure-web3-wallet) for instructions if you have not done that yet.
- Open http://localhost:3000/swap and verify that you have stablecoins in your account. See [HERE](https://github.com/factor-finance/xusd-contracts#minting-stablecoins-in-standalone-mode-in-via-hardhat-task) for instructions if you don't see a balance.


### Run Dapp on Mainnet
```
$ yarn run build
$ yarn run start:production
```

### Environment variables
- On local use `.env` file
- On prod use `prod.env` file.
