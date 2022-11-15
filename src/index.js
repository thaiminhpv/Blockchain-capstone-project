import {getExchangeRate} from "./services/networkService";
import EnvConfig from "./configs/env";
import AppConfig from "./configs/app";
import MetamaskService from "./services/accounts/MetamaskService";
import {getWeb3Instance} from "./services/web3Service";

const metamaskService = new MetamaskService(window.web3);
const web3 = getWeb3Instance();

const initiateDropdown = () => {
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
};

const initiateSelectedToken = (srcSymbol, destSymbol) => {
  $('#selected-src-symbol').html(srcSymbol);
  $('#selected-dest-symbol').html(destSymbol);
  $('#rate-src-symbol').html(srcSymbol);
  $('#rate-dest-symbol').html(destSymbol);
  $('#selected-transfer-token').html(srcSymbol);
  $('#wallet-token').val(`${findTokenBySymbol(srcSymbol).name} (${srcSymbol})`);
};

const updateExchangeRate = async (srcSymbol, destSymbol, srcAmount=1) => {
  const srcToken = findTokenBySymbol(srcSymbol);
  const destToken = findTokenBySymbol(destSymbol);
  const srcAmountFull = (srcAmount * 1e18).toString();

  $('#rate-src-symbol').html(srcSymbol);
  $('#rate-dest-symbol').html(destSymbol);
  try {
    const exchangeRate = await getExchangeRate(srcToken.address, destToken.address, srcAmountFull);
    console.log(`Exchange rate of ${srcSymbol}->${destSymbol}: ${exchangeRate}`);
    const rate = exchangeRate / 1e18
    $('#exchange-rate').html(rate);
    return rate;
  } catch (error) {
    console.log(error);
    $('#exchange-rate').html(0);
    return 0;
  }
};

const refreshTokenRate = async () => {
  const srcSymbol = $('#selected-src-symbol').html();
  const destSymbol = $('#selected-dest-symbol').html();
  const srcAmount = parseInt($('#swap-source-amount').val());

  const rate = await updateExchangeRate(srcSymbol, destSymbol, srcAmount);
  const destAmount = srcAmount * rate;
  $('#swap-dest-amount').html(destAmount);

  $('.src-swap').html(`${srcAmount} ${srcSymbol}`);
  $('.dest-swap').html(`${destAmount} ${destSymbol}`);
  const gas = web3.utils.fromWei(await getWeb3Instance().eth.getGasPrice(), 'ether');
  console.log(`Gas price: ${gas}`);
  $('#gas-amount').html(`${gas} ${EnvConfig.TOKENS[0].symbol}`);
  // FIXME: Update dest amount when srcToken is same as destToken
};

const forceRefreshBalance = () => {
  // force update
  metamaskService.updateTokenBalances().then((tokenBalances) => {
    refreshUserBalance(tokenBalances);
  });
}

const initiateDefaultRate = (srcSymbol, destSymbol) => {
  refreshTokenRate();
};

const findTokenBySymbol = symbol => EnvConfig.TOKENS.find(token => token.symbol === symbol);
const findTokenByRawName = rawName => EnvConfig.TOKENS.find((token) => `${token.name} (${token.symbol})` === rawName);

const refreshUserBalance = (tokenBalances) => {
  const tokenRawName = $('#wallet-token').val();
  const token = findTokenByRawName(tokenRawName);
  if (token) {
    const tokenBalance = tokenBalances[token.symbol] / 1e18;
    console.log(`Token balance of ${token.symbol}: ${tokenBalance}`);
    $('#wallet-balance').val(tokenBalance);
  }
}

const initiateProject = () => {
  const defaultSrcSymbol = EnvConfig.TOKENS[0].symbol;
  const defaultDestSymbol = EnvConfig.TOKENS[1].symbol;

  initiateDropdown();
  initiateSelectedToken(defaultSrcSymbol, defaultDestSymbol);
  initiateDefaultRate(defaultSrcSymbol, defaultDestSymbol);
};

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
    console.log("Start background fetch balance worker");
    metamaskService.startBackgroundFetchBalanceWorker((tokenBalances) => {
      console.log("Background fetch balance worker: ", tokenBalances);
      refreshUserBalance(tokenBalances);
    });
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

  $('.modal__cancel').on('click', function () {
    $(this).parents('.modal').removeClass('modal--active');
  });

  $('.modal__confirm').on('click', function () {
    $(this).parents('.modal').removeClass('modal--active');
    console.log('Swap Now');
    alert('Swap Now');
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
