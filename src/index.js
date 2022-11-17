import {getExchangeRate, getSwapABI, getTransferABI} from "./services/networkService";
import EnvConfig from "./configs/env";
import MetamaskService from "./services/accounts/MetamaskService";
import {getWeb3Instance} from "./services/web3Service";
import AppConfig from "./configs/app";
import Token from "./services/contracts/Token";
import Exchange from "./services/contracts/Exchange";

const web3 = getWeb3Instance();
const metamaskService = new MetamaskService(web3);
const tokenService = new Token(web3);
const exchangeService = new Exchange(web3, tokenService, metamaskService);

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
  $('#wallet-token').val(`${tokenService.findTokenBySymbol(srcSymbol).name} (${srcSymbol})`);
}

async function refreshTokenRate() {
  const srcSymbol = $('#selected-src-symbol').html();
  const destSymbol = $('#selected-dest-symbol').html();
  const srcAmount = BigInt(Math.floor(parseFloat($('#swap-source-amount').val()) * 1e18));  // Handle BigFloat, parse from Ether to Wei

  const rate = await exchangeService.queryExchangeRate(srcSymbol, destSymbol, srcAmount);
  const destAmount = parseInt(srcAmount) * rate / 1e18;

  $('#rate-src-symbol').html(srcSymbol);
  $('#rate-dest-symbol').html(destSymbol);
  $('#swap-dest-amount').html(destAmount);
  $('#exchange-rate').html(rate);

  $('.src-swap').html(`${parseInt(srcAmount) / 1e18} ${srcSymbol}`);
  $('.dest-swap').html(`${destAmount} ${destSymbol}`);
  $('.rate-swap').html(`1 ${srcSymbol} = ${rate} ${destSymbol}`);
  if (metamaskService.getAccount()) {
    const gas = web3.utils.fromWei((await exchangeService.getSwapFee(srcSymbol, destSymbol, srcAmount)).toString(), 'ether');
    console.debug(`Index::refreshTokenRate - Swap gas price: ${gas}`);
    $('#gas-amount').html(`${gas} ${EnvConfig.NATIVE_TOKEN.symbol}`);
  }
  // FIXME: Update dest amount when srcToken is same as destToken
}

function forceRefreshBalance() {
  // force update
  tokenService.updateTokenBalances(metamaskService.getAccount()).then((tokenBalances) => refreshUserBalance(tokenBalances));
}

function initiateDefaultRate(srcSymbol, destSymbol) {
  refreshTokenRate();
  tokenService.startBackgroundFetchTokenRateWorker(refreshTokenRate);
}

function refreshUserBalance(tokenBalances) {
  const tokenRawName = $('#wallet-token').val();
  const token = tokenService.findTokenByRawName(tokenRawName);
  if (token) {
    const tokenBalance = tokenBalances[token.symbol] / 1e18;
    console.debug(`Index::refreshUserBalance - Token balance of ${token.symbol}: ${tokenBalance}`);
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
    await metamaskService.connectWallet();
    $('#wallet-address').val(metamaskService.getAccount());
    $('.side-content').show();

    forceRefreshBalance();
    // Start background fetch balance worker.
    tokenService.startBackgroundFetchBalanceWorker(metamaskService.getAccount(), (tokenBalances) => refreshUserBalance(tokenBalances));
  });

  $('#import-erc20').on('click', function () {
    metamaskService.addCustomTokenToMetamask(EnvConfig.TOKENS[1]);
    metamaskService.addCustomTokenToMetamask(EnvConfig.TOKENS[2]);
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

    $('#selected-src-symbol').html(destSymbol);
    $('#selected-dest-symbol').html(srcSymbol);
    $('#rate-src-symbol').html(destSymbol);
    $('#rate-dest-symbol').html(srcSymbol);

    refreshTokenRate();
  });


  // Handle on Swap Now button clicked
  $('#swap-button').on('click', function () {
    if (metamaskService.getAccount() === null) {
      alert("Please import wallet first.");
      return;
    }
    const modalId = $(this).data('modal-id');
    $(`#${modalId}`).addClass('modal--active');
    refreshTokenRate();
  });
  // Handle on Swap Now button clicked
  $('#transfer-button').on('click', async function () {
    if (metamaskService.getAccount() === null) {
      alert("Please import wallet first.");
      return;
    }
    const modalId = $(this).data('modal-id');
    $(`#${modalId}`).addClass('modal--active');

    const rawSrcAmount = $('#transfer-source-amount').val();
    const srcAmount = BigInt(Math.floor(parseFloat(rawSrcAmount) * 1e18));  // Handle BigFloat, parse from Ether to Wei
    const srcSymbol = $('#selected-transfer-token').html();
    const destinationAddress = $('#transfer-address').val();
    const transferFee = await exchangeService.getTransferFee(srcSymbol, srcAmount, destinationAddress);
    console.debug(`Transfer button clicked: ${rawSrcAmount} ${srcSymbol} to ${destinationAddress} with fee ${transferFee}`);
    $('.src-transfer').html(rawSrcAmount + " " + srcSymbol);
    $('.dest-transfer').html($('#transfer-address').val());
    $('#transfer-fee').html(transferFee + " " + EnvConfig.NATIVE_TOKEN.symbol);
  });

  $('.modal__cancel').on('click', function () {
    $(this).parents('.modal').removeClass('modal--active');
  });

  $('.modal__confirm[data-modal-id="confirm-swap-modal"]').on('click', function () {
    $(this).parents('.modal').removeClass('modal--active');
    const srcSymbol = $('#selected-src-symbol').html();
    const destSymbol = $('#selected-dest-symbol').html();
    const srcAmount = BigInt(Math.floor(parseFloat($('#swap-source-amount').val()) * 1e18));  // Handle BigFloat, parse from Ether to Wei

    exchangeService.swapToken(srcSymbol, destSymbol, srcAmount).then((value) => {
      console.info("Swap token success", value);
    }).catch((err) => {
      console.error("Swap token failed: ", err);
    });
  });

  $('.modal__confirm[data-modal-id="confirm-transfer-modal"]').on('click', function () {
    // Transfer Token to another address
    $(this).parents('.modal').removeClass('modal--active');

    const srcAmount = BigInt(Math.floor(parseFloat($('#transfer-source-amount').val()) * 1e18));  // Handle BigFloat, parse from Ether to Wei
    const srcSymbol = $('#selected-transfer-token').html();
    const destinationAddress = $('#transfer-address').val();

    exchangeService.transferToken(srcSymbol, destinationAddress, srcAmount).then((value) => {
      console.info("Transfer token success - Transaction hash:", value);
    }).catch((err) => {
      console.error("Transfer token failed: ", err);
    });
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
