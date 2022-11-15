import {getExchangeContract, getTokenContract, getWeb3Instance} from "./web3Service";
import EnvConfig from "../configs/env";

export function getSwapABI(data) {
  /*TODO: Get Swap ABI*/
}

export function getTransferABI(data) {
  /*TODO: Get Transfer ABI*/
}

export function getApproveABI(srcTokenAddress, amount) {
  /*TODO: Get Approve ABI*/
}

export function getAllowance(srcTokenAddress, address, spender) {
  /*TODO: Get current allowance for a token in user wallet*/
}

/* Get Exchange Rate from Smart Contract */
export function getExchangeRate(srcTokenAddress, destTokenAddress, srcAmount) {
  const exchangeContract = getExchangeContract();

  return new Promise((resolve, reject) => {
    exchangeContract.methods.getExchangeRate(srcTokenAddress, destTokenAddress, srcAmount).call().then((result) => {
      resolve(result)
    }, (error) => {
      reject(error);
    })
  })
}

export async function getTokenBalances(tokenAddress, accountAddress) {
  if (tokenAddress === EnvConfig.NATIVE_TOKEN_ADDRESS) {
    const web3 = getWeb3Instance();
    return await web3.eth.getBalance(accountAddress);
  } else {
    const tokenContract = getTokenContract(tokenAddress);
    return await tokenContract.methods.balanceOf(accountAddress).call();  // call() used for read-only functions
  }
}
