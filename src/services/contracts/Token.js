import EnvConfig from "../../configs/env";
import AppConfig from "../../configs/app";
import {getTokenBalances} from "../networkService";

export default class Token {
  constructor(web3) {
    this.web3 = web3;
    this.backgroundFetchBalanceWorker = null;
  }

  findTokenBySymbol(symbol) {
    return EnvConfig.TOKENS.find(token => token.symbol === symbol);
  }

  findTokenByRawName(rawName) {
    return EnvConfig.TOKENS.find((token) => `${token.name} (${token.symbol})` === rawName);
  }

  /**
   * Get token balances of current account
   * This will be used to update balances in the UI
   * @returns {Promise<unknown>} tokenBalances - A map of token balances [tokenSymbol]: balance
   */
  async updateTokenBalances(account) {
    let tokenBalances = {};
    for (let token of EnvConfig.TOKENS) {
      try {
        let balance = await getTokenBalances(token.address, account);
        console.debug('updateTokenBalances', `User ${account}'s ${token.symbol} balance: ${balance}`);
        tokenBalances[token.symbol] = balance;
      } catch (error) {
        console.error('Error occured when fetching token ', token);
        console.error('updateTokenBalances', error);
      }
    }
    console.debug('updateTokenBalances | Token balances', tokenBalances);
    return tokenBalances;
  }

  /**
   * This is a background worker that will fetch token balances every 10 seconds
   * @param account
   * @param callback
   */
  startBackgroundFetchBalanceWorker(account, callback) {
    // single instance of background worker
    if (this.backgroundFetchBalanceWorker) clearInterval(this.backgroundFetchBalanceWorker);
    this.backgroundFetchBalanceWorker = setInterval(() => {
      this.updateTokenBalances(account).then((tokenBalances) => {
        callback(tokenBalances);
      });
    }, AppConfig.ACCOUNT_BALANCES_FETCH_INTERVAL);
  }
}
