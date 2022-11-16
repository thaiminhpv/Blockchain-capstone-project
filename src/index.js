import {getExchangeRate, getSwapABI, getTransferABI} from "./services/networkService";
import EnvConfig from "./configs/env";
import MetamaskService from "./services/accounts/MetamaskService";
import {getWeb3Instance} from "./services/web3Service";
import AppConfig from "./configs/app";

const metamaskService = new MetamaskService(window.web3);
const web3 = getWeb3Instance();

function initiateDropdown() {
  let dropdownTokens = '';

  EnvConfig.TOKENS.forEach((token) => {
    dropdownTokens += `<div class="dropdown__item">${token.symbol}</div>`;
  });

  $('.dropdown__content').html(dropdownTokens);

  // in wallet panel
  let dropdownTokensInWallet = EnvConfig.TOKENS.map((token) => {
    return `<option value="${token.name} (${token.symbol})">`;
  }).join('');
  $('#token-list').html(dropdownTokensInWallet);
}

function initiateSelectedToken(srcSymbol, destSymbol) {
  $('#selected-src-symbol').html(srcSymbol);
  $('#selected-dest-symbol').html(destSymbol);
  $('#rate-src-symbol').html(srcSymbol);
  $('#rate-dest-symbol').html(destSymbol);
  $('#selected-transfer-token').html(srcSymbol);
  $('#wallet-token').val(`${findTokenBySymbol(srcSymbol).name} (${srcSymbol})`);
}

async function updateExchangeRate(srcSymbol, destSymbol, srcAmount = 1) {
  const srcToken = findTokenBySymbol(srcSymbol);
  const destToken = findTokenBySymbol(destSymbol);
  const srcAmountFull = BigInt(srcAmount * 1e18);

  try {
    const exchangeRate = await getExchangeRate(srcToken.address, destToken.address, srcAmountFull);
    console.debug(`Exchange rate of ${srcSymbol}->${destSymbol}: ${exchangeRate}`);
    return web3.utils.fromWei(exchangeRate, 'ether');
  } catch (error) {
    console.error(error);
    return 0;
  }
}

async function swapToken(srcSymbol, destSymbol, srcAmount) {
  const srcToken = findTokenBySymbol(srcSymbol);
  const destToken = findTokenBySymbol(destSymbol);
  const srcAmountFull = web3.utils.toWei(BigInt(srcAmount).toString(), 'ether');

  console.log(`Swapping ${srcAmountFull} ${srcSymbol} to ${destSymbol} via account ${metamaskService.getAccount()}`);
  // let gas = web3.utils.fromWei(await web3.eth.getGasPrice(), 'ether');
  let gas = await web3.eth.getGasPrice();
  console.log(`Gas price: ${gas}`);
  // let value = srcToken.address === EnvConfig.NATIVE_TOKEN_ADDRESS ? srcAmountFull * gas : 0;
  return getSwapABI({
    srcTokenAddress: srcToken.address,
    destTokenAddress: destToken.address,
    srcAmount: srcAmountFull,
  }).send({
    from: metamaskService.getAccount(),
    value: gas * 1000,
    // value: srcAmountFull
  })
}

async function refreshTokenRate() {
  const srcSymbol = $('#selected-src-symbol').html();
  const destSymbol = $('#selected-dest-symbol').html();
  const srcAmount = parseInt($('#swap-source-amount').val());

  const rate = await updateExchangeRate(srcSymbol, destSymbol, srcAmount);
  const destAmount = srcAmount * rate;

  $('#rate-src-symbol').html(srcSymbol);
  $('#rate-dest-symbol').html(destSymbol);
  $('#swap-dest-amount').html(destAmount);
  $('#exchange-rate').html(rate);

  $('.src-swap').html(`${srcAmount} ${srcSymbol}`);
  $('.dest-swap').html(`${destAmount} ${destSymbol}`);
  $('.rate-swap').html(`1 ${srcSymbol} = ${rate} ${destSymbol}`);
  const gas = web3.utils.fromWei(await getWeb3Instance().eth.getGasPrice(), 'ether');
  console.debug(`Gas price: ${gas}`);
  $('#gas-amount').html(`${gas} ${EnvConfig.TOKENS[0].symbol}`);
  // FIXME: Update dest amount when srcToken is same as destToken
}

function forceRefreshBalance() {
  // force update
  metamaskService.updateTokenBalances().then((tokenBalances) => {
    refreshUserBalance(tokenBalances);
  });
}

function initiateDefaultRate(srcSymbol, destSymbol) {
  refreshTokenRate();
  setInterval(refreshTokenRate, AppConfig.EXCHANGE_RATE_FETCH_INTERVAL);
  console.info('Background refresh exchange rate service started!');
}

const findTokenBySymbol = symbol => EnvConfig.TOKENS.find(token => token.symbol === symbol);
const findTokenByRawName = rawName => EnvConfig.TOKENS.find((token) => `${token.name} (${token.symbol})` === rawName);

function refreshUserBalance(tokenBalances) {
  const tokenRawName = $('#wallet-token').val();
  const token = findTokenByRawName(tokenRawName);
  if (token) {
    const tokenBalance = tokenBalances[token.symbol] / 1e18;
    console.debug(`Token balance of ${token.symbol}: ${tokenBalance}`);
    $('#wallet-balance').val(tokenBalance);
  }
}

function initiateProject() {
  const defaultSrcSymbol = EnvConfig.TOKENS[0].symbol;
  const defaultDestSymbol = EnvConfig.TOKENS[1].symbol;

  initiateDropdown();
  initiateSelectedToken(defaultSrcSymbol, defaultDestSymbol);
  initiateDefaultRate(defaultSrcSymbol, defaultDestSymbol);
}

function validateSwapSourceAmount() {
  const sourceAmount = $('#swap-source-amount').val();
  // filter everything except numbers and dot
  console.debug("Swap Source Amount before: ", sourceAmount);
  const filteredSourceAmount = sourceAmount.replace(/[^0-9.]/g, '');
  console.debug(`Swap Source Amount after: ${filteredSourceAmount}`);
  $('#swap-source-amount').val(filteredSourceAmount);
}

function validateTransferSourceAmount() {
  const sourceAmount = $('#transfer-source-amount').val();
  // filter everything except numbers and dot
  console.debug("Transfer Source Amount before: ", sourceAmount);
  const filteredSourceAmount = sourceAmount.replace(/[^0-9.]/g, '');
  console.debug(`Transfer Source Amount after: ${filteredSourceAmount}`);
  $('#transfer-source-amount').val(filteredSourceAmount);
}

function validateTransferDestinationAddress() {
  const destinationAddress = $('#transfer-address').val();
  console.debug(`Typed Transfer Destination Address: ${destinationAddress} -- ${web3.utils.isAddress(destinationAddress)}`);
  return web3.utils.isAddress(destinationAddress);
}

async function getTransferFee(srcSymbol, sourceAmount, destinationAddress) {
  const gasPrice = await web3.eth.getGasPrice();
  const srcAmountFull = web3.utils.toWei(BigInt(sourceAmount).toString(), 'ether');
  let gasAmount;
  if (srcSymbol === findTokenBySymbol(EnvConfig.NATIVE_TOKEN.address).symbol) {
    // native token transfer
    gasAmount = await web3.eth.estimateGas({
      from: metamaskService.getAccount(),
      to: destinationAddress,
      value: srcAmountFull,
    });
  } else {
    // ERC20 token
    const srcToken = findTokenBySymbol(srcSymbol);
    gasAmount = await getTransferABI({
      amount: srcAmountFull,
      toAddress: destinationAddress,
      tokenAddress: srcToken.address,
    }).estimateGas({
      from: metamaskService.getAccount(),
    });
  }
  const gasFee = gasPrice * gasAmount;
  return web3.utils.fromWei(gasFee, 'ether');
}

$(function () {
  initiateProject();

  // On changing token from dropdown.
  $(document).on('click', '.dropdown__item', function () {
    const selectedSymbol = $(this).html();
    $(this).parent().siblings('.dropdown__trigger').find('.selected-target').html(selectedSymbol);
    refreshTokenRate();
  });

  // Import Metamask
  $('#import-metamask').on('click', async function () {
    /* TODO: Importing wallet by Metamask goes here. */
    // metamaskService.addCustomTokenToMetamask(EnvConfig.TOKENS[1]);
    // metamaskService.addCustomTokenToMetamask(EnvConfig.TOKENS[2]);

    await metamaskService.connectWallet();
    $('#wallet-address').val(metamaskService.getAccount());
    $('.side-content').show();

    forceRefreshBalance();
    // Start background fetch balance worker.
    metamaskService.startBackgroundFetchBalanceWorker((tokenBalances) => {
      console.debug("Return from background fetch balance worker: ", tokenBalances);
      refreshUserBalance(tokenBalances);
    });
    console.info("Background fetch balance worker started!");
  });

  $('#wallet-token').on('click', function () {
    $(this).val(''); // clear the input
  });

  $('#wallet-token').on('input', function () {
    forceRefreshBalance();
  });

  // Handle on Source Amount Changed
  $('#swap-source-amount').on('input change', function () {
    refreshTokenRate();
    validateSwapSourceAmount();
  });

  $('#transfer-source-amount').on('input change', function () {
    validateTransferSourceAmount();
  });

  $('#transfer-address').on('input change', function () {
    if (validateTransferDestinationAddress()) {
      $('#transfer-button').prop('disabled', false);
      $('#transfer-address-error-message').hide();
    } else {
      $('#transfer-button').prop('disabled', true);
      $('#transfer-address-error-message').show();
    }
  });

  // Handle on click token in Token Dropdown List
  $('.dropdown__item').on('click', function () {
    $(this).parents('.dropdown').removeClass('dropdown--active');
    refreshTokenRate();
  });

  // Handle on Swap Icon div clicked
  $('.swap__icon').on('click', function () {
    const srcSymbol = $('#selected-src-symbol').html();
    const destSymbol = $('#selected-dest-symbol').html();
    initiateSelectedToken(destSymbol, srcSymbol);
    initiateDefaultRate(destSymbol, srcSymbol);
  });


  // Handle on Swap Now button clicked
  $('#swap-button').on('click', function () {
    const modalId = $(this).data('modal-id');
    $(`#${modalId}`).addClass('modal--active');
    refreshTokenRate();
  });
  // Handle on Swap Now button clicked
  $('#transfer-button').on('click', async function () {
    const modalId = $(this).data('modal-id');
    $(`#${modalId}`).addClass('modal--active');

    const sourceAmount = $('#transfer-source-amount').val();
    const srcSymbol = $('#selected-transfer-token').html();
    const destinationAddress = $('#transfer-address').val();
    const transferFee = await getTransferFee(srcSymbol, sourceAmount, destinationAddress);
    console.debug(`Transfer button clicked: ${sourceAmount} ${srcSymbol} to ${destinationAddress} with fee ${transferFee}`);
    $('.src-transfer').html(sourceAmount + " " + srcSymbol);
    $('.dest-transfer').html($('#transfer-address').val());
    $('.transfer-fee').html(transferFee + " " + EnvConfig.NATIVE_TOKEN.symbol);
  });

  $('.modal__cancel').on('click', function () {
    $(this).parents('.modal').removeClass('modal--active');
  });

  $('.modal__confirm[data-modal-id="confirm-swap-modal"]').on('click', function () {
    $(this).parents('.modal').removeClass('modal--active');
    const srcSymbol = $('#selected-src-symbol').html();
    const destSymbol = $('#selected-dest-symbol').html();
    const srcAmount = parseInt($('#swap-source-amount').val());

    if (metamaskService.getAccount() === null) {
      alert("Please import wallet first.");
      return;
    }

    swapToken(srcSymbol, destSymbol, srcAmount).then((value) => {
      console.info("Swap token success", value);
    }).catch((err) => {
      console.error("Swap token failed: ", err);
    });
  });

  $('.modal__confirm[data-modal-id="confirm-transfer-modal"]').on('click', function () {
    // Transfer Token to another address
  });

  // Tab Processing
  $('.tab__item').on('click', function () {
    const contentId = $(this).data('content-id');
    $('.tab__item').removeClass('tab__item--active');
    $(this).addClass('tab__item--active');

    if (contentId === 'swap') {
      $('#swap').addClass('active');
      $('#transfer').removeClass('active');
    } else {
      $('#transfer').addClass('active');
      $('#swap').removeClass('active');
    }
  });

  // Dropdown Processing
  $('.dropdown__trigger').on('click', function () {
    $(this).parent().toggleClass('dropdown--active');
  });

  // Close Modal
  $('.modal').on('click', function (e) {
    if(e.target !== this ) return;
    $(this).removeClass('modal--active');
  });
});
