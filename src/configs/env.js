import exchange_abi from '../services/abi/Exchange.json';

const EnvConfig = {
  // RPC_ENDPOINT: 'https://rpc.testnet.tomochain.com',
  RPC_ENDPOINT: 'http://localhost:8545',
  TOKEN_ABI: [{"constant":true,"inputs":[],"name":"name","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_spender","type":"address"},{"name":"_value","type":"uint256"}],"name":"approve","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"totalSupply","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_from","type":"address"},{"name":"_to","type":"address"},{"name":"_value","type":"uint256"}],"name":"transferFrom","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"decimals","outputs":[{"name":"","type":"uint8"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"_owner","type":"address"}],"name":"balanceOf","outputs":[{"name":"balance","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"symbol","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_to","type":"address"},{"name":"_value","type":"uint256"}],"name":"transfer","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"_owner","type":"address"},{"name":"_spender","type":"address"}],"name":"allowance","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"payable":true,"stateMutability":"payable","type":"fallback"},{"anonymous":false,"inputs":[{"indexed":true,"name":"owner","type":"address"},{"indexed":true,"name":"spender","type":"address"},{"indexed":false,"name":"value","type":"uint256"}],"name":"Approval","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"from","type":"address"},{"indexed":true,"name":"to","type":"address"},{"indexed":false,"name":"value","type":"uint256"}],"name":"Transfer","type":"event"}],
  /* TODO: You should change these configurations with your deployed exchange contract instead */
  EXCHANGE_CONTRACT_ABI: exchange_abi.abi,
  EXCHANGE_CONTRACT_ADDRESS: '0x0BBE5B854d8638f6785B22E6b61d3B35F74a755a',
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
      address: '0x5111031586BD3ED0177C11F5A58981b012b30424',
      "image": "https://cloudflare-ipfs.com/ipfs/QmYAJ3e15YtncwfYKXKzW6soSZtTeLNpf6Lyf2JAZUG4wJ#x-ipfs-companion-no-redirect",
    },
    {
      "name": 'TokenB',
      "symbol": 'TKB',
      address: '0x0dAd3CdFa49aDd1dB0Db94c0c7EE343B894c93FF',
      "image": "https://cloudflare-ipfs.com/ipfs/QmbTcARAN62swednuJLL8ariSyfUAGenJrREBaYZXyzxYG#x-ipfs-companion-no-redirect",
    },
    /* END TODO */
  ],
};

export default EnvConfig;
