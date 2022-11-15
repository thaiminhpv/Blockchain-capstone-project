import exchange_abi from '../services/abi/Exchange.json';

const EnvConfig = {
  // RPC_ENDPOINT: 'https://rpc.testnet.tomochain.com',
  RPC_ENDPOINT: 'http://localhost:9545',
  TOKEN_ABI: [{"constant":true,"inputs":[],"name":"name","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_spender","type":"address"},{"name":"_value","type":"uint256"}],"name":"approve","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"totalSupply","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_from","type":"address"},{"name":"_to","type":"address"},{"name":"_value","type":"uint256"}],"name":"transferFrom","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"decimals","outputs":[{"name":"","type":"uint8"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"_owner","type":"address"}],"name":"balanceOf","outputs":[{"name":"balance","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"symbol","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_to","type":"address"},{"name":"_value","type":"uint256"}],"name":"transfer","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"_owner","type":"address"},{"name":"_spender","type":"address"}],"name":"allowance","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"payable":true,"stateMutability":"payable","type":"fallback"},{"anonymous":false,"inputs":[{"indexed":true,"name":"owner","type":"address"},{"indexed":true,"name":"spender","type":"address"},{"indexed":false,"name":"value","type":"uint256"}],"name":"Approval","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"from","type":"address"},{"indexed":true,"name":"to","type":"address"},{"indexed":false,"name":"value","type":"uint256"}],"name":"Transfer","type":"event"}],
  /* TODO: You should change these configurations with your deployed exchange contract instead */
  EXCHANGE_CONTRACT_ABI: exchange_abi.abi,
  EXCHANGE_CONTRACT_ADDRESS: '0x2b1B1C27dabd1D80fe79BB785B407bC7b5d3b440',
  /* END TODO */

  TOKENS: [
    {
      "name": 'TomoChain',
      "symbol": 'TOMO',
      address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
    },
    /* TODO: Change to your own deployed tokens. Remember to put 2 tokens here to support token to token swapping */
    {
      "name": 'TokenA',
      "symbol": 'TKA',
      address: '0xC5f68f4F8C024323bf0dc94F86bf398e95EcFF4E',
    },
    {
      "name": 'TokenB',
      "symbol": 'TKB',
      address: '0x8A07B0c664B956dA169B581E18353D9f163b77FC',
    },
    /* END TODO */
  ],
};

export default EnvConfig;
