import {getExchangeContract, getTokenContract, getWeb3Instance} from "./web3Service";
import EnvConfig from "../configs/env";

export function getSwapABI({
    srcTokenAddress,
    destTokenAddress,
    srcAmount
  }) {
  return getExchangeContract().methods.exchange(srcTokenAddress, destTokenAddress, srcAmount);
}

/**
 * Get ERC20 token Transfer ABI
 * @param amount
 * @param toAddress
 * @param tokenAddress
 * @returns {*}
 */
export function getTransferABI({amount, toAddress, tokenAddress}) {
  return getTokenContract(tokenAddress).methods.transfer(toAddress, amount)
}

export function getApproveABI(srcTokenAddress, amount) {
  return getTokenContract(srcTokenAddress).methods.approve(EnvConfig.EXCHANGE_CONTRACT_ADDRESS, amount)
}

export async function getAllowance(srcTokenAddress, address, spender) {
  return await getTokenContract(srcTokenAddress).methods.allowance(address, spender).call();
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
  if (tokenAddress === EnvConfig.NATIVE_TOKEN.address) {
    const web3 = getWeb3Instance();
    return await web3.eth.getBalance(accountAddress);
  } else {
    const tokenContract = getTokenContract(tokenAddress);
    return await tokenContract.methods.balanceOf(accountAddress).call();  // call() used for read-only functions
  }
}
