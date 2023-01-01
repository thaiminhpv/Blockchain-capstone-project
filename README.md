# A decentralized exchange for swapping tokens

The application is (CI/CD) deployed to [blockchain.thaiminhpv.tech](https://blockchain.thaiminhpv.tech/) by **Vercel**,
and (CI/CD) deployed to [bdp306b.thaiminhpv.tech](https://bdp306b.thaiminhpv.tech/) on **IPFS** by [**Fleek**](./.fleek.json) via Cloudflare Gateway.

A static manual build of [version v4.0](https://github.com/thaiminhpv/Blockchain-capstone-project/releases/tag/v4.0)
is manually deployed to [bdp306b-ipfs.thaiminhpv.tech](https://bdp306b-ipfs.thaiminhpv.tech/)
on **IPFS**.
The domain is pointed to [Cloudflare Gateway](https://www.cloudflare-ipfs.com/ipfs/QmcMTehbQf29SH7TcsfxRD9EGGajCkFGnNnH9RqTaQpxeZ/)
using DNSLink (TXT record), and pinned by [Pinata](https://www.pinata.cloud/).

[Demo video can be watched here](https://www.youtube.com/watch?v=ILrhuCk9Cl0).

![thumbnail-image](./Thumbnail.png)

## Introduction

This project is a decentralized exchange application for swapping between Ether and ERC20 tokens.

## Installation

```bash
# nvm use 16
npm install -g npm
npm install -g truffle
npm install -g ganache-cli

cd src
npm install web3
npm install
```

Create a file called `.secret` in the root directory of the project and paste your mnemonic phrase in it.

## Development

### Local chain development

Comment out `<script src="dist/bundle.js"/>` in `index.html` and then replace with `<script src="index.js"/>`.

```bash
cd src
npm run ganache

# then open another terminal
npm run migrate
npm run design  # or npm run serve
```

### Test

```bash
truffle test
```

### Deploy

```bash
cd src
npm run build
```

Then comment out `<script src="index.js"/>` in `index.html` and replace with `<script src="dist/bundle.js"/>`.
