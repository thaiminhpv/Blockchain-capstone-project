# Blockchain Final Project

Design and Development of A Decentralized Exchange

Project Title: A decentralized exchange for swapping tokens

## Project Specification

1. ASSUMPTIONS

In this assignment, you will implement an on-chain liquidity protocol that aggregates liquidity from a wide range of reserves, powering instant and secure tokens exchange in any decentralized applications.

As a user who wish to exchange from token A to token B, user will have to access user's wallet by one of our supported methods. That comes to our mission to provide the best experiences for the user to interact with their wallet. Firstly,  displaying the correct information of their imported wallet such as their address and balances of each supported token. Secondly, showing the correct market rate between tokens (This information can be fetched from getExchangeRate function in Exchange smart contract), that means what exact amount of token B will user receive from swapping a certain amount of token A. There will be 2 background jobs running in an interval of 10s or so for fetching balances and current market rate as these two information are likely to be changed (offently) and we just want to make sure that these 2 are up to date to avoid confusing users.

For the sake of our project implementation we will introduce some simplifying assumptions. Here they are:

- Platform: Ethereum Ropsten, the native token is ETH, token is referring to other tokens on Ethereum. You can also use TomoChain as platform, you won't need to change your code.
- Main contracts: 2 main smart contracts are Reserve and Exchange.
- Reserve Contract: provides liquidity and buy/sell rates between a token and ETH, users will exchange assets with reserves (not with other users).
- One Token - One Reserve: A reserve only supports 1 token where user can buy or sell that token using ETH, a token is only supported by at most 1 reserve. Reserve must provide buy and sell rates. Buy and Sell rates can be fixed or adjustable. In the real market, buy and sell rates must be updated frequently, depends on current market rates.
- No direct exchange token-token: As a reserve only supports 1 token, there is no direct exchange between 2 tokens in 1 reserve. Exchanging token A to token B is considered as selling token A to ETH with one reserve, and using that ETH to buy token B with another reserve. However, with smart contract, we can make these 2 processes in a single transaction.
- Exchange Contract: handles logics of adding/removing Reserves, computing exchange rates and exchanging assets between a user and reserves.
- User: User will interact with Exchange contract only to trade tokens.
- Native token address: Consider address 0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee as native token address (ETH in Ethereum or TOMO in TomoChain).


2. FUNCTIONAL SPECIFICATIONS

Below are specific requirements of the platform:

2.1. Importing Wallet:

Implementing import user wallet using Metamask.
Keystore and Private Key is provided as optional methods.
2.2. Wallet Information:

Showing current imported wallet address and its balance for each token in a dropdown list.
Searching tokens by name or symbol in token dropdown list.
A background job running for fetching user balances in an interval of 10s.
2.3. Swapping Tokens:

 Two Input fields, one for source token amount and one for destination token  amount (token can be selected in token dropdown list).
 Enter amount: validate amount as a number to fill into the amount inputs. Auto fill options for 25%, 50%, 100% of user balance to   source amount.
 Showing current market rate of selected token pair.
 A background job running for fetching market rate of selected token pair in an interval of 10s.
 A button labeled  to proceed the swapping.
 After hitting the button, showing a confirmation modal with all the information selected before and estimated transaction fee to execute the transaction.
 Signing transaction with imported wallet.
2.4. Transferring Tokens:

Two Input fields, one for entering source token amount to transfer and one for entering a valid address (token can be selected in token dropdown list).
Enter amount: validate amount as a number to fill into the amount inputs. Auto fill options for 25%, 50%, 100% of user balance to source amount.
A button labeled  to proceed the transferring.
After hitting the button, showing a confirmation modal with all the information selected before and estimated transaction fee to execute the transaction.
Signing transaction with imported wallet.
2.5. Transaction Monitoring:

Tracking transaction status: broadcasting, broadcasted, failed or success after making a transaction.

3. REQUIREMENTS

3.1. Fundamental Requirement:

Support exchange between token and ETH and between 2 tokens. You will need to deploy 2 tokens, 2 reserves (one for each token), and exchange contracts. Please follow the flow of deploying these contracts in previous section.

3.2. Extra Requirement:

Support adjustable exchange rates in reserve. You must have a function to update exchange rates in reserve contract.

You will also need to have test.js file to test your smart contracts. You can break down into ExchangeTest.js and ReserveTest.js if you find it is easier to implement.

## Project Guides - Development


The Development Guide

1. Frontend Implementation guides

We have prepared a handful of folders and files for building the platform. 

Download the UI skeleton here and complete the codes based on that. There will be some places that we already marked them as *TODO*, you will need to fill in the code at the locations indicated.

Some of the frontend components like tabs, inputs, dropdown selector, buttons, modal… have been prepared in a raw form, you will have to polish them to make it more fancy following our GUI Guide and then focus on the interaction between the platform and your Smart Contract.

- Our app is mainly using Jquery and web3Js.

- We will have 'assets/images' folder containing all of the images that you need for the platform. 

- We will have 'assets/css' folder containing your CSS files.

- The 'configs' folder is where you put your settings.

- The 'libraries' folder is for external libraries that we might need to build the app like 'Jquery'.

- The 'services' folder containing all the logics fetching data from external API or calling functions from web3Js or our Smart Contract.

- The 'index.html' file is where you put your HTML codes for frontend.

- The 'index.js' is for your main JS logics. Feel free to separate this file into several smaller components and then import them back into this file for better organization.

What you should install:

- Download and install NodeJs (https://nodejs.org/en/download/)

- Install npm (Node Package Manager) by running this command: 

How to run the project:

- Download the frontend skeleton.

- Open your terminal at the root of the app.

- Install all the packages for the app by running: 'npm install'.

- Now running 'npm run serve' to make your app running on a localhost server.

- Your app is now up and running at http://127.0.0.1:9966. Anytime you make a change in our app, the browser should reload and update your codes immediately.

*Note: You might have troubles installing web3js with npm. If you are running into this problem, try install web3js in separation by running 'npm install web3' or update your npm to the latest version by 'npm install npm -g'. Sometimes, you might need to update Python version in your computer. 

2. Smart Contract Guides

2.1 Design Guides

There are 2 main smart contracts: Reserve and Exchange. Please read the design guides below for your reference: 

### Reserve

Funds: Funds (token + ETH) are stored in Reserve.
Owner: Reserve will have an owner that can withdraw funds (e.g withdrawFunds(token, amount, destAddress)) and set some basic data like buy/sell rates.
Supported Token: Reserve should store its supported token to allow user exchanges between ETH and that token. Supported token should be initialised in Reserve's constructor and can not be changed.
Set Exchange Rates: We can fix the rates (simple version), however it will be better if rates can be adjustable. As the result, Reserve should have a function to adjust exchange rates, for example setExchangeRates(buyRate, sellRate): buyRate is how many tokens we can buy using 1 ETH, sellRate is how many ETH we will receive when selling 1 token. For example, if we can buy 180 tokens using 1 ETH, and sell 200 tokens to get 1 ETH, then buyRate: 180, sellRate: 1/200=0.005. However, it's up to you to decide, you can also define buyRate is how many tokens you can buy using 1 ETH, and sellRate is how many tokens you need to sell to get 1 ETH. In the example above, buyRate: 180, sellRate: 200. Exchange rates can be the same or different for different traded amounts that user wants.
Get Exchange Rates: Reserve also needs to provide a function to get buy/sell rate given traded amount, for example: getExchangeRate(isBuy, srcAmount). Please note that if reserve doesn't have enough funds, the exchange rate should be 0.
Exchange Tokens: Reserve must have a function to allow exchange ETH with its supported token and vice versa, for example: exchange(isBuy, srcAmount). In case buying, this function must allow receiving ETH from user, and send token back to user sender. In case selling, this function must allow receiving collect token from user sender, and send ETH back to user sender based on current exchange rate. When buying, ETH will be transferred in the function call, so Reserve must verify that correct amount of ETH has been transferred to Reserve, i.e verify msg.value == srcAmount. When selling, Reserve should collect srcAmount tokens from sender by using transferFrom function in the token's contract. Note: to be able calling this transferFrom, Exchange's contract must approve Reserve's contract to take token from the Exchange's contract. You can either call approve function when addReserve, or before calling Reserve.exchange (check out allowance, approve, transferFrom functions in token contract for more details). Please check that the reserve still has enough assets to do the exchange.

### Exchange

Interactions: User will interact with Exchange contract to exchange tokens. Exchange contract will interact with Reserves to get rates and exchange tokens.
Add/Remove reserves: Exchange needs to have an owner that can add or remove Reserves, for example: addReserve(reserve, token, isAdd). As 1 token is only supported by 1 reserve, we can use mapping (token => reserve).
Get Exchange Rates: Exchange needs to provide a function to get exchange rate between 2 tokens given tokens' addresses and source amount, for example: getExchangeRate(srcToken, destToken, srcAmount).
Exchange Tokens: Exchange must have a function to allow exchange between tokens where user can call to perform an exchange request. That function must have srcToken, destToken, srcAmount. For example: exchange(srcToken, destToken, srcAmount). We must check if exact srcAmount of srcToken is taken from the user's wallet, and exact amount of destToken that user's received based on exchange rate at that time. Please note that this function must be able to receive ETH. In case srcToken == ETH, Exchange must verify that correct amount is sent when user calls the exchange function, i.e msg.value == srcAmount, otherwise, Exchange should use transferFrom function to collect srcAmount tokens from sender's wallet. Note: to be able calling this transferFrom, user's wallet must approve Exchange's contract to take token from the user's wallet (check out allowance, approve, transferFrom functions in token contract for more details). This is to make sure that collect srcAmount of srcToken has been transferred from sender's wallet to Exchange's contract. In side exchange function, it should call Reserve's exchange function to swap tokens with Reserve, and then transfer back correct amount it has received from Reserve to sender. An example of a correct flow (assuming user exchanges X tokenA to Y ETH):
○ X tokenA is transferred from user's wallet to Exchange by calling exchange function in Exchange's contract.

○ X tokenA is transferred from Exchange to Reserve by calling exchange function in Reserve's contract.

○ Reserve transfers back Y ETH to Exchange (in exchange function of Reserve's contract).

○ Exchange transfers Y ETH back to user's wallet (in exchange function of Exchange's contract).

2.2. Implementation and Deployment Guides

We have provided the smart contract design guides with almost everything that you can follow to design and implement your smart contracts. Please fine below some other notes:

a. Things to note:

Please understand the problems before you proceed. 
Please get some ETH testnet so that you can deploy contracts and deposit funds to Reserve. You can get some ETH ropsten here: Kyber's faucet or Ropsten faucet.
Follow this instruction on How to deploy contract on Ropsten testnet in case you haven't done so.
Beside Ropsten testnet, consider to deploy your contracts on TomoChain testnet.
b. Deploy testnet ERC20 tokens:

Download source code for test token here. It's already written in solidity 0.4.17.
Please deploy TestToken contract, put token name, symbol and decimals. For simplify, please use 18 as token decimals.
c. Using TomoChain:

You can consider to deploy your smart contracts to TomoChain tessnet, this will be faster for your development. Some notes to follow:  

To add TomoChain testnet to Metamask, please follow:
o How to add TomoChain to metmask

o Network configs

Deploy contract on TomoChain is similar to deploy on Ethereum Ropsten, however, 2 more conditions are required:
o Gas price: >= 10,000 gwei

o Transaction fee: >= 10 TOMO

o Get some TOMO test from faucet

You don't have to modify your source codes as TomoChain and Ethereum shared the same EVM.
With blocktime 1-2s, using TomoChain will save you lots of waiting-for-mining-transaction times.
d. Flow to deploy your contracts:

Deploy 2 test tokens using provided source code, let's call: TokenA and TokenB.
Deploy 2 reserve contracts (you need to set owner of reserve, token address that this reserve is supporting, buy/sell rates, etc, you can set these values in the constructor of the reserve contract, or have functions to set after deployed). Let's call ReserveA (supporting TokenA) and ReserveB (supporting TokenB).
Transfer ETH (or TOMO in case you are using TomoChain) and token to corresponding reserve (TokenA to ReserveA, TokenB to ReserveB). Check your buy/sell rates by calling function to get rate in reserve contract.
Deploy Exchange contract, add ReserveA and ReserveB to Exchange with token that reserves are supporting.
Check the exchange rate between ETH-token or token-token in your Exchange contract, and try to make an exchange transaction.
e. Test your contracts:

Please follow the test driven development approach and assignment you did in the Dapps course to finish testing your Reserve and Exchange smart contract.  You can break down into ExchangeTest.js and ReserveTest.js if you find it is easier to implement.

Addendum

Remix IDE's Solidity compiler is automatically set to the latest Solidity version when you are working on the Remix. The instructions to change the compiler version in Remix are given below. Follow the instructions there to set the Solidity compiler version in Remix IDE. We will keep the compiler version at 0.4.17 to prevent any problems that may arise because of compiler issues.

Please refer the documentation for Solidity version 0.4.17 at http://solidity.readthedocs.io/en/v0.4.17/ when developing your code.

Some of the changes in the newer version of Solidity are in the syntax of the constructor and the event feature. Please:

Keep the version of the Solidity code and compiler 0.4.17
Keep the constructor to be "function Exchange" or "function Reserve" instead of newer version "constructor"
Call an event by its name (say, eventName) rather than "emit eventName" of the newer version of Solidity. It is not difficult to move to the newer version after you complete the course projects with version 0.4.17. You just have to pay attention to the errors and read the documentation.