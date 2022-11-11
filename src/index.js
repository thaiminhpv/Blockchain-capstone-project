import { getExchangeRate } from "./services/networkService";
import EnvConfig from "./configs/env";

$(function () {
  initiateProject();

  function initiateProject() {
    const defaultSrcSymbol = EnvConfig.TOKENS[0].symbol;
    const defaultDestSymbol = EnvConfig.TOKENS[1].symbol;
    
    initiateDropdown();
    initiateSelectedToken(defaultSrcSymbol, defaultDestSymbol);
    initiateDefaultRate(defaultSrcSymbol, defaultDestSymbol);
  }
  
  function initiateDropdown() {
    let dropdownTokens = '';
    
    EnvConfig.TOKENS.forEach((token) => {
      dropdownTokens += `<div class="dropdown__item">${token.symbol}</div>`;
    });
    
    $('.dropdown__content').html(dropdownTokens);
  }
  
  function initiateSelectedToken(srcSymbol, destSymbol) {
    $('#selected-src-symbol').html(srcSymbol);
    $('#selected-dest-symbol').html(destSymbol);
    $('#rate-src-symbol').html(srcSymbol);
    $('#rate-dest-symbol').html(destSymbol);
    $('#selected-transfer-token').html(srcSymbol);
  }
  
  function initiateDefaultRate(srcSymbol, destSymbol) {
    refreshTokenRate();
  }

  function findTokenBySymbol(symbol) {
    return EnvConfig.TOKENS.find(token => token.symbol === symbol);
  }

  async function updateExchangeRate(srcSymbol, destSymbol, srcAmount=1) {
    const srcToken = findTokenBySymbol(srcSymbol);
    const destToken = findTokenBySymbol(destSymbol);
    const srcAmountFull = (srcAmount * 1e18).toString();

    $('#rate-src-symbol').html(srcSymbol);
    $('#rate-dest-symbol').html(destSymbol);
    try {
      const exchangeRate = await getExchangeRate(srcToken.address, destToken.address, srcAmountFull);
      console.log("exchangeRate: ", exchangeRate);
      const rate = exchangeRate / 1e18
      $('#exchange-rate').html(rate);
      return rate;
    } catch (error) {
      console.log(error);
      $('#exchange-rate').html(0);
      return 0;
    }
  }

  async function refreshTokenRate() {
    const srcSymbol = $('#selected-src-symbol').html();
    const destSymbol = $('#selected-dest-symbol').html();
    const srcAmount = parseInt($('#swap-source-amount').val());

    const rate = await updateExchangeRate(srcSymbol, destSymbol, srcAmount);
    $('#swap-dest-amount').html(rate * srcAmount);
  }
  
  // On changing token from dropdown.
  $(document).on('click', '.dropdown__item', function () {
    const selectedSymbol = $(this).html();
    $(this).parent().siblings('.dropdown__trigger').find('.selected-target').html(selectedSymbol);
    refreshTokenRate();
  });

  // Import Metamask
  $('#import-metamask').on('click', function () {
    /* TODO: Importing wallet by Metamask goes here. */
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

  // Handle on Swap Now button clicked
  $('#swap-button').on('click', function () {
    const modalId = $(this).data('modal-id');
    $(`#${modalId}`).addClass('modal--active');
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
