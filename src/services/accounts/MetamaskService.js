import EnvConfig from "../../configs/env";
import {getTokenBalances} from "../networkService";
import AppConfig from "../../configs/app";

export default class MetamaskService {

  constructor(web3) {
    this.web3 = web3;
    this.account = null;
    this.backgroundFetchBalanceWorker = null;
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

  sendTransaction(txObject) {
    // TODO: Sending signed transaction by Metamask
    this.web3.eth.sendTransaction(txObject, (err, txHash) => {
      console.log('MetamaskService::sendTransaction', err, txHash);
    });
  }

  getAccount() {
    return this.account;
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

    // return EnvConfig.TOKENS.map(async (token) => {
    //   try {
    //     let balance = await getTokenBalances(token.address, account);
    //     console.log('MetamaskService::updateTokenBalances', `User ${account}'s ${token.symbol} balance: ${balance}`);
    //     return (token.symbol, balance);
    //   } catch (error) {
    //     console.log('MetamaskService::updateTokenBalances', error);
    //   }
    // }).reduce((acc, cur) => acc[cur[0]] = cur[1], {});

    let tokenBalances = {};
    for (let token of EnvConfig.TOKENS) {
      try {
        let balance = await getTokenBalances(token.address, account);
        console.log('MetamaskService::updateTokenBalances', `User ${account}'s ${token.symbol} balance: ${balance}`);
        tokenBalances[token.symbol] = balance;
      } catch (error) {
        console.error('Error occured when fetching token ', token);
        console.error('MetamaskService::updateTokenBalances', error);
      }
    }
    console.log('MetamaskService::updateTokenBalances | Token balances', tokenBalances);
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
