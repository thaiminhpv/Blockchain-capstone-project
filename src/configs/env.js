import exchange_abi from '../services/abi/Exchange.json';

const NATIVE_TOKEN = {
  name: 'TomoChain',
  symbol: 'TOMO',
  address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
}

const EnvConfig = {
  RPC_ENDPOINT: 'https://rpc.testnet.tomochain.com',
  // RPC_ENDPOINT: 'http://localhost:8545',
  TOKEN_ABI: [{"constant":true,"inputs":[],"name":"name","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_spender","type":"address"},{"name":"_value","type":"uint256"}],"name":"approve","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"totalSupply","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_from","type":"address"},{"name":"_to","type":"address"},{"name":"_value","type":"uint256"}],"name":"transferFrom","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"decimals","outputs":[{"name":"","type":"uint8"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"_owner","type":"address"}],"name":"balanceOf","outputs":[{"name":"balance","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"symbol","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_to","type":"address"},{"name":"_value","type":"uint256"}],"name":"transfer","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"_owner","type":"address"},{"name":"_spender","type":"address"}],"name":"allowance","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"payable":true,"stateMutability":"payable","type":"fallback"},{"anonymous":false,"inputs":[{"indexed":true,"name":"owner","type":"address"},{"indexed":true,"name":"spender","type":"address"},{"indexed":false,"name":"value","type":"uint256"}],"name":"Approval","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"from","type":"address"},{"indexed":true,"name":"to","type":"address"},{"indexed":false,"name":"value","type":"uint256"}],"name":"Transfer","type":"event"}],
  EXCHANGE_CONTRACT_ABI: exchange_abi.abi,
  EXCHANGE_CONTRACT_ADDRESS: '0x339ea952119a3D67AFC18d72a01241d36B2FB392',
  NATIVE_TOKEN: NATIVE_TOKEN,

  TOKENS: [
      NATIVE_TOKEN,
    {
      "name": 'TokenA',
      "symbol": 'TKA',
      address: '0xE443d047b8a1317F2e06Ea0fEa2Ba515DfA371c2',
      "image": "https://cloudflare-ipfs.com/ipfs/QmYAJ3e15YtncwfYKXKzW6soSZtTeLNpf6Lyf2JAZUG4wJ#x-ipfs-companion-no-redirect",
    },
    {
      "name": 'TokenB',
      "symbol": 'TKB',
      address: '0x30d7f326E90f4B6BCD1d313B87a163957B565470',
      "image": "https://cloudflare-ipfs.com/ipfs/QmbTcARAN62swednuJLL8ariSyfUAGenJrREBaYZXyzxYG#x-ipfs-companion-no-redirect",
    },
  ],
};

export default EnvConfig;
