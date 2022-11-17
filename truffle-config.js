const HDWalletProvider = require('truffle-hdwallet-provider');
const infuraKey = "a93ffc...<PUT YOUR INFURA-KEY HERE>";
const fs = require('fs');
const mnemonic = fs.readFileSync(".secret").toString().trim();
// const mnemonic = '<PUT YOUR WALLET 12-WORD RECOVERY PHRASE HERE>';
module.exports = {
  networks: {
    development: {
      host: "127.0.0.1",     // Localhost (default: none)
      port: 8545,            // Standard Ethereum port (default: none)
      network_id: "*",       // Any network (default: none)
    },
    ropsten: {
      //provider: () => new HDWalletProvider(mnemonic, `https://ropsten.infura.io/${infuraKey}`),
      provider: () => new HDWalletProvider(
        mnemonic,
        `https://ropsten.infura.io/${infuraKey}`,
        0,
        1,
        true,
        "m/44'/889'/0'/0/", // Connect with HDPath same as TOMO
      ),
      network_id: 3,       // Ropsten's id
      gas: 5500000,        // Ropsten has a lower block limit than mainnet
      // confirmations: 2,    // # of confs to wait between deployments. (default: 0)
      // timeoutBlocks: 200,  // # of blocks before a deployment times out  (minimum/default: 50)
      // skipDryRun: true     // Skip dry run before migrations? (default: false for public nets )
    }, 
    tomotestnet: {
      provider: () => new HDWalletProvider(
        mnemonic,
        "https://testnet.tomochain.com",
        0,
        1,
        true,
        "m/44'/889'/0'/0/",
      ),
      network_id: "89",
      gas: 10000000,
      gasPrice: 10000000000000,  // TomoChain requires min 10 TOMO to deploy, to fight spamming attacks
    },
    tomomainnet: {
      provider: () => new HDWalletProvider(
        mnemonic,
        "https://rpc.tomochain.com",
        0,
        1,
        true,
        "m/44'/889'/0'/0/",
      ),
      network_id: "88",
      gas: 10000000,
      gasPrice: 10000000000000,  // TomoChain requires min 10 TOMO to deploy, to fight spamming attacks
    },
  },

  mocha: {
  },

  compilers: {
    solc: {
      version: "^0.4.26"
    }
  }
};
