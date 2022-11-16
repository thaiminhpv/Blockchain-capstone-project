import {getExchangeRate, getSwapABI, getTransferABI} from "../networkService";
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
      gasAmount = await swapABI.estimateGas({from: from});
      transactionParameters = {
        to: EnvConfig.EXCHANGE_CONTRACT_ADDRESS,
        from: from,
        data: data,
        gasPrice: parseInt(gasPrice).toString(16),
        gas: parseInt(gasAmount).toString(16),
      };
    }
    console.debug('MetamaskService::sendTransaction', `gasPrice: ${gasPrice}, gasAmount: ${gasAmount}, srcAmount: ${srcAmount}`);
    console.debug('MetamaskService::sendTransaction', transactionParameters);
    const txHash = await ethereum.request({
      method: 'eth_sendTransaction',
      params: [transactionParameters],
    });
    console.debug('MetamaskService::sendTransaction', `txHash (Transaction hash): ${txHash}`);
    return txHash;
  }

}