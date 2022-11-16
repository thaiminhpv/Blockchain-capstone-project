import EnvConfig from "../../configs/env";

export default class Token {
  constructor(web3) {
    this.web3 = web3;
  }

  findTokenBySymbol(symbol) {
    return EnvConfig.TOKENS.find(token => token.symbol === symbol);
  }

  findTokenByRawName(rawName) {
    return EnvConfig.TOKENS.find((token) => `${token.name} (${token.symbol})` === rawName);
  }

}
