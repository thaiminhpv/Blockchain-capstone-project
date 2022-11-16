import EnvConfig from "../../configs/env";
import {getTokenBalances, getTransferABI} from "../networkService";
import AppConfig from "../../configs/app";

export default class MetamaskService {

  constructor(web3) {
    this.web3 = web3;
    this.account = null;
    this.backgroundFetchBalanceWorker = null;
  }

  numEtherToWeiHex(num) {
    return parseInt(this.web3.utils.toWei(BigInt(num).toString(), 'ether')).toString(16);
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

    let gasPrice = await this.web3.eth.getGasPrice();
    if (tokenAddress === EnvConfig.NATIVE_TOKEN.address) {
      // Value should be in hex
      // https://ethereum.stackexchange.com/questions/85308/metamask-displaying-wrong-value-when-making-rpc-sendtransaction-call
      let srcAmountFull = this.numEtherToWeiHex(srcAmount);
      console.debug('sendTransaction::srcAmountFull', srcAmountFull);

      let gasAmount = await this.web3.eth.estimateGas({from, to, value: srcAmount});
      console.debug('MetamaskService::sendTransaction', `gasPrice: ${gasPrice}, gasAmount: ${gasAmount}, srcAmount: ${srcAmount}`);

      const transactionParameters = {
        gasPrice: parseInt(gasPrice).toString(16),
        gas: parseInt(gasAmount).toString(16),
        to: to, // Required except during contract publications.
        from: from, // must match user's active address.
        value: srcAmountFull, // Only required to send ether to the recipient from the initiating external account.
        // data: '0x7f7465737432000000000000000000000000000000000000000000000000000000600057', // Optional, but used for defining smart contract creation and interaction.
        // chainId: '0x3', // Used to prevent transaction reuse across blockchains. Auto-filled by MetaMask.
      };

      const txHash = await ethereum.request({
        method: 'eth_sendTransaction',
        params: [transactionParameters],
      });
      console.debug('MetamaskService::sendTransaction', `txHash (Transaction hash): ${txHash}`);
      return txHash;
    } else {
      // ERC20 token
      let transferABI = getTransferABI({
        amount: this.web3.utils.toWei(srcAmount, 'ether'),
        toAddress: to,
        tokenAddress: tokenAddress
      })
      let gasAmount = await transferABI.estimateGas({from: from});
      let data = transferABI.encodeABI();

      console.debug('MetamaskService::sendTransaction', `gasPrice: ${gasPrice}, gasAmount: ${gasAmount}, srcAmount: ${srcAmount}`);
      const transactionParameters = {
        to: tokenAddress,
        from: from,
        data: data,
        gasPrice: parseInt(gasPrice).toString(16),
        gas: parseInt(gasAmount).toString(16),
      };
      const txHash = await ethereum.request({
        method: 'eth_sendTransaction',
        params: [transactionParameters],
      });
      console.debug('MetamaskService::sendTransaction', `txHash (Transaction hash): ${txHash}`);
      return txHash;
    }
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

}
