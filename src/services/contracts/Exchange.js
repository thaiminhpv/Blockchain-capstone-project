import {getAllowance, getApproveABI, getExchangeRate, getSwapABI, getTransferABI} from "../networkService";
import EnvConfig from "../../configs/env";

export default class Exchange {

  constructor(web3, tokenService, metaMask) {
    this.web3 = web3;
    this.tokenService = tokenService;
    this.metamaskService = metaMask;
  }

  /**
   * @param srcSymbol
   * @param sourceAmount in Wei
   * @param destinationAddress
   * @returns {Promise<string>} gas fee in Ether
   */
  async getTransferFee(srcSymbol, sourceAmount, destinationAddress) {
    const gasPrice = await this.web3.eth.getGasPrice();
    const srcAmountFull = BigInt(sourceAmount).toString();
    let gasAmount;
    if (srcSymbol === EnvConfig.NATIVE_TOKEN.symbol) {
      // native token transfer
      gasAmount = await this.web3.eth.estimateGas({
        from: this.metamaskService.getAccount(),
        to: destinationAddress,
        value: srcAmountFull,
      });
    } else {
      // ERC20 token
      const srcToken = this.tokenService.findTokenBySymbol(srcSymbol);
      gasAmount = await getTransferABI({
        amount: srcAmountFull,
        toAddress: destinationAddress,
        tokenAddress: srcToken.address,
      }).estimateGas({
        from: this.metamaskService.getAccount(),
      });
    }
    const gasFee = gasPrice * gasAmount;
    return this.web3.utils.fromWei(BigInt(gasFee).toString(), 'ether');
  }

  /**
   * @param srcSymbol
   * @param destSymbol
   * @param srcAmount in Wei
   * @returns {Promise<string|number>} rate in %
   */
  async queryExchangeRate(srcSymbol, destSymbol, srcAmount = 1e18) {
    const srcToken = this.tokenService.findTokenBySymbol(srcSymbol);
    const destToken = this.tokenService.findTokenBySymbol(destSymbol);
    const srcAmountFull = BigInt(srcAmount);
    try {
      const exchangeRate = await getExchangeRate(srcToken.address, destToken.address, srcAmountFull);
      console.debug(`Exchange rate of ${srcSymbol}->${destSymbol}: ${exchangeRate}`);
      return this.web3.utils.fromWei(exchangeRate, 'ether');
    } catch (error) {
      console.error(error);
      return 0;
    }
  }

  /**
   * @param srcSymbol
   * @param destAddress
   * @param srcAmount in Wei
   * @returns {Promise<*>}
   */
  async transferToken(srcSymbol, destAddress, srcAmount) {
    return this.metamaskService.sendTransaction({
      from: this.metamaskService.getAccount(),
      to: destAddress,
      srcAmount: srcAmount,
      tokenAddress: this.tokenService.findTokenBySymbol(srcSymbol).address,
    })
  }

  /**
   * @param srcSymbol
   * @param destSymbol
   * @param srcAmount in Wei
   * @returns {Promise<*>}
   */
  async swapToken(srcSymbol, destSymbol, srcAmount) {
    const srcToken = this.tokenService.findTokenBySymbol(srcSymbol);
    const destToken = this.tokenService.findTokenBySymbol(destSymbol);
    const srcAmountFull = BigInt(srcAmount).toString();
    const from = this.metamaskService.getAccount()

    console.log(`Swapping ${srcAmountFull} ${srcSymbol} to ${destSymbol} via account ${from}`);
    let swapABI = getSwapABI({
      srcTokenAddress: srcToken.address,
      destTokenAddress: destToken.address,
      srcAmount: srcAmountFull,
    })
    let data = swapABI.encodeABI();
    const gasPrice = await this.web3.eth.getGasPrice();
    let transactionParameters, gasAmount, allowance;

    if (srcToken.address === EnvConfig.NATIVE_TOKEN.address) {
      gasAmount = await swapABI.estimateGas({from: from, value: srcAmountFull});
      transactionParameters = {
        to: EnvConfig.EXCHANGE_CONTRACT_ADDRESS,
        from: from,
        data: data,
        gasPrice: parseInt(gasPrice).toString(16),
        gas: parseInt(gasAmount).toString(16),
        value: parseInt(srcAmountFull).toString(16),
      };
    } else {
      // ERC20 token - check allowance -> approve -> check allowance -> swap
      allowance = await getAllowance(srcToken.address, from, EnvConfig.EXCHANGE_CONTRACT_ADDRESS);
      console.debug(`Exchange::swapToken - Allowance before: ${allowance}`);
      const approveABI = getApproveABI(srcToken.address, srcAmountFull);
      gasAmount = await approveABI.estimateGas({from: from});
      console.debug(`Exchange::swapToken - Approve gas amount: ${gasAmount}`);
      allowance = await getAllowance(srcToken.address, from, EnvConfig.EXCHANGE_CONTRACT_ADDRESS);
      console.debug(`Exchange::swapToken - Allowance after estimate gas amount: ${allowance}`);
      const approveTxHash = await ethereum.request({
        method: 'eth_sendTransaction',
        params: [{
          from: from,
          to: srcToken.address,
          data: approveABI.encodeABI(),
          gasPrice: parseInt(gasPrice).toString(16),
          gas: parseInt(gasAmount).toString(16),
        }]
      });
      allowance = await getAllowance(srcToken.address, from, EnvConfig.EXCHANGE_CONTRACT_ADDRESS);
      console.debug(`Exchange::swapToken - Allowance after call approve: ${allowance}`);
      gasAmount = await swapABI.estimateGas({from: from});
      console.debug(`Exchange::swapToken - Swap gas estimated amount: ${gasAmount}`);
      allowance = await getAllowance(srcToken.address, from, EnvConfig.EXCHANGE_CONTRACT_ADDRESS);
      console.debug(`Exchange::swapToken - Allowance after call estimate Swap gas: ${allowance}`);
      transactionParameters = {
        to: EnvConfig.EXCHANGE_CONTRACT_ADDRESS,
        from: from,
        data: data,
        gasPrice: parseInt(gasPrice).toString(16),
        gas: parseInt(gasAmount).toString(16),
      };
    }
    console.debug('Exchange::swapToken -', `gasPrice: ${gasPrice}, gasAmount: ${gasAmount}, srcAmount: ${srcAmount}`);
    console.debug('Exchange::swapToken -', transactionParameters);
    const txHash = await ethereum.request({
      method: 'eth_sendTransaction',
      params: [transactionParameters],
    });
    if (srcToken.address !== EnvConfig.NATIVE_TOKEN.address) {
      allowance = await getAllowance(srcToken.address, from, EnvConfig.EXCHANGE_CONTRACT_ADDRESS);
      console.debug(`Exchange::swapToken - Allowance after send transaction: ${allowance}`);
    }
    console.debug('Exchange::swapToken -', `done! txHash (Transaction hash): ${txHash}`);
    return txHash;
  }
}