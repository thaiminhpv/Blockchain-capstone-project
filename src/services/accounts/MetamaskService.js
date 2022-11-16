import EnvConfig from "../../configs/env";
import {getTokenBalances, getTransferABI} from "../networkService";
import AppConfig from "../../configs/app";

export default class MetamaskService {

  constructor(web3) {
    this.web3 = web3;
    this.account = null;
    this.backgroundFetchBalanceWorker = null;
  }

  getAccount() {
    return this.account;
  }

  addCustomTokenToMetamask(token, image = "https://picsum.photos/200", decimals = 18) {
    let [address, symbol] = [token["address"], token["symbol"]]
    image = token["image"] || image

    console.log(`Adding token ${token["name"]} to metamask with address ${address} and symbol ${symbol}`);
    window.ethereum.sendAsync({
      method: 'metamask_watchAsset',
      params: {
        "type": "ERC20",
        "options": {
          "address": address,
          "symbol": symbol,
          "decimals": decimals,
          "image": image,
        }
      }
    }, (err, added) => {
      console.log('MetamaskService::addCustomTokenToMetamask', err, added);
    });
  }

  async sendTransaction({
      from,
      to,
      srcAmount,
      tokenAddress,
    }) {
    let srcAmountFull = this.web3.utils.toWei(BigInt(srcAmount).toString(), 'ether');

    if (tokenAddress === EnvConfig.NATIVE_TOKEN.address) {
      // TODO: Sending signed transaction by Metamask
      const transactionParameters = {
        // nonce: '0x00', // ignored by MetaMask
        // gasPrice: '0x09184e72a000', // customizable by user during MetaMask confirmation.
        // gas: '0x2710', // customizable by user during MetaMask confirmation.
        to: to, // Required except during contract publications.
        from: from, // must match user's active address.
        // value: '0x00', // Only required to send ether to the recipient from the initiating external account.
        // data: '0x7f7465737432000000000000000000000000000000000000000000000000000000600057', // Optional, but used for defining smart contract creation and interaction.
        // chainId: '0x3', // Used to prevent transaction reuse across blockchains. Auto-filled by MetaMask.
      };

      const txHash = await ethereum.request({
        method: 'eth_sendTransaction',
        params: [transactionParameters],
      });
    } else {
      // ERC20 token
      let data = getTransferABI({
        amount: srcAmountFull,
        toAddress: to,
        tokenAddress: tokenAddress
      }).encodeABI();

      let tx = {
        from: from,
        to: tokenAddress,
        data: data,
      };

    }
    return txHash;
  }

  async connectWallet() {
    // https://medium.com/metamask/https-medium-com-metamask-breaking-change-injecting-web3-7722797916a8
    if (!(window.ethereum && window.ethereum.isMetaMask)) {
      console.log('Non-Ethereum browser detected. You should consider trying MetaMask!');
    } else {
      try {
        let accounts = await ethereum.request({ method: 'eth_requestAccounts' });
        console.log('MetamaskService::connectWallet', accounts);
        this.account = accounts[0];
        return this.getAccount();
      } catch (error) {
        // User denied account access...
        console.error('Error: MetamaskService::connectWallet', error);
        console.log('User denied account access');
      }
    }
  }

  /**
   * Update token balances of current account
   * @returns {Promise<unknown>} tokenBalances - A map of token balances [tokenSymbol]: balance
   */
  async updateTokenBalances() {
    // every 10 seconds exec updateTokenBalances
    // this is a background worker that updates the this.tokenbalances
    // this.tokenbalances will be used to update the UI
    // this.tokenbalances is a map of token address to balance
    let account = this.getAccount();

    let tokenBalances = {};
    for (let token of EnvConfig.TOKENS) {
      try {
        let balance = await getTokenBalances(token.address, account);
        console.debug('MetamaskService::updateTokenBalances', `User ${account}'s ${token.symbol} balance: ${balance}`);
        tokenBalances[token.symbol] = balance;
      } catch (error) {
        console.error('Error occured when fetching token ', token);
        console.error('MetamaskService::updateTokenBalances', error);
      }
    }
    console.debug('MetamaskService::updateTokenBalances | Token balances', tokenBalances);
    return tokenBalances;
  }

  startBackgroundFetchBalanceWorker(callback) {
    // single instance of background worker
    if (this.backgroundFetchBalanceWorker) clearInterval(this.backgroundFetchBalanceWorker);
    this.backgroundFetchBalanceWorker = setInterval(() => {
      this.updateTokenBalances().then((tokenBalances) => {
        callback(tokenBalances);
      });
    }, AppConfig.ACCOUNT_BALANCES_FETCH_INTERVAL);
  }
}
