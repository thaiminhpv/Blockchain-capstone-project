import EnvConfig from "../../configs/env";
import AppConfig from "../../configs/app";
import {getTokenBalances} from "../networkService";

export default class Token {
  constructor(web3) {
    this.web3 = web3;
    this.backgroundFetchBalanceWorker = null;
    this.backgroundFetchTokenRateWorker = null;
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
        console.debug('Token::updateTokenBalances', `User ${account}'s ${token.symbol} balance: ${balance}`);
        tokenBalances[token.symbol] = balance;
      } catch (error) {
        console.error('Token::updateTokenBalances - Error occured when fetching token ', token);
        console.error('Token::updateTokenBalances - Error: ', error);
      }
    }
    console.debug('Token::updateTokenBalances', tokenBalances);
    return tokenBalances;
  }

  /**
   * This is a background worker that will fetch token balances every 10 seconds
   * @param account
   * @param callback
   */
  startBackgroundFetchBalanceWorker(account, callback) {
    console.info("Background fetch balance worker started!");
    // single instance of background worker
    if (this.backgroundFetchBalanceWorker) clearInterval(this.backgroundFetchBalanceWorker);
    this.backgroundFetchBalanceWorker = setInterval(() => {
      console.debug('Token::backgroundFetchBalanceWorker', 'Fetching token balances...');
      this.updateTokenBalances(account).then((tokenBalances) => {
        callback(tokenBalances);
      });
    }, AppConfig.ACCOUNT_BALANCES_FETCH_INTERVAL);
  }

  /**
   * This is a background worker that will fetch token exchange rate every 10 seconds
   * @param callback
   */
  startBackgroundFetchTokenRateWorker(callback) {
    console.info('Background refresh exchange rate service started!');
    // single instance of background worker
    if (this.backgroundFetchTokenRateWorker) clearInterval(this.backgroundFetchTokenRateWorker);
    this.backgroundFetchTokenRateWorker = setInterval(() => {
      console.debug('Token::backgroundFetchTokenRateWorker', 'Fetching token rates...');
      callback();
    }, AppConfig.ACCOUNT_BALANCES_FETCH_INTERVAL);
  }
}
