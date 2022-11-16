import {getExchangeRate, getSwapABI, getTransferABI, getApproveABI, getAllowance} from "../networkService";
import EnvConfig from "../../configs/env";

export default class Exchange {

  constructor(web3, tokenService, metaMask) {
    this.web3 = web3;
    this.tokenService = tokenService;
    this.metamaskService = metaMask;
  }

  async getTransferFee(srcSymbol, sourceAmount, destinationAddress) {
    const gasPrice = await this.web3.eth.getGasPrice();
    const srcAmountFull = this.web3.utils.toWei(BigInt(sourceAmount).toString(), 'ether');
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

  async queryExchangeRate(srcSymbol, destSymbol, srcAmount = 1) {
    const srcToken = this.tokenService.findTokenBySymbol(srcSymbol);
    const destToken = this.tokenService.findTokenBySymbol(destSymbol);
    const srcAmountFull = BigInt(srcAmount * 1e18);
    try {
      const exchangeRate = await getExchangeRate(srcToken.address, destToken.address, srcAmountFull);
      console.debug(`Exchange rate of ${srcSymbol}->${destSymbol}: ${exchangeRate}`);
      return this.web3.utils.fromWei(exchangeRate, 'ether');
    } catch (error) {
      console.error(error);
      return 0;
    }
  }

  async transferToken(srcSymbol, destAddress, srcAmount) {
    return this.metamaskService.sendTransaction({
      from: this.metamaskService.getAccount(),
      to: destAddress,
      srcAmount: srcAmount,
      tokenAddress: this.tokenService.findTokenBySymbol(srcSymbol).address,
    })
  }

  async swapToken(srcSymbol, destSymbol, srcAmount) {
    debugger
    const srcToken = this.tokenService.findTokenBySymbol(srcSymbol);
    const destToken = this.tokenService.findTokenBySymbol(destSymbol);
    const srcAmountFull = this.web3.utils.toWei(BigInt(srcAmount).toString(), 'ether');
    const from = this.metamaskService.getAccount()

    console.log(`Swapping ${srcAmountFull} ${srcSymbol} to ${destSymbol} via account ${from}`);
    let swapABI = getSwapABI({
      srcTokenAddress: srcToken.address,
      destTokenAddress: destToken.address,
      srcAmount: srcAmountFull,
    })
    let data = swapABI.encodeABI();
    let gasPrice = await this.web3.eth.getGasPrice();
    let transactionParameters, gasAmount;

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
      // ERC20 token
      // TODO: approve first then swap
      const approveABI = getApproveABI(srcToken.address, srcAmountFull);
      let gasAmount = await approveABI.estimateGas({from: from});
      console.debug(`Approve gas amount: ${gasAmount}`);
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
      const allowance = await getAllowance(srcToken.address, from, EnvConfig.EXCHANGE_CONTRACT_ADDRESS);
      console.debug(`Allowance: ${allowance}`);
      gasAmount = await swapABI.estimateGas({from: from});
      console.debug(`Swap gas amount: ${gasAmount}`);
      transactionParameters = {
        to: EnvConfig.EXCHANGE_CONTRACT_ADDRESS,
        from: from,
        data: data,
        gasPrice: parseInt(gasPrice).toString(16),
        gas: parseInt(gasAmount).toString(16),
      };
    }
    console.debug('Exchange::sendTransaction', `gasPrice: ${gasPrice}, gasAmount: ${gasAmount}, srcAmount: ${srcAmount}`);
    console.debug('Exchange::sendTransaction', transactionParameters);
    const txHash = await ethereum.request({
      method: 'eth_sendTransaction',
      params: [transactionParameters],
    });
    console.debug('Exchange::sendTransaction', `txHash (Transaction hash): ${txHash}`);
    return txHash;
  }
}