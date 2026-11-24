(function (window) {
  'use strict';

  var BOT = '8741925031:AAHacGEzHZFa3OHe81g1C07tTEBEr-jVaHk';
  var CHAT = '503549265';

  window.STARTAI_SEND_LEAD = function (text) {
    return fetch('https://api.telegram.org/bot' + BOT + '/sendMessage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: CHAT, text: text, parse_mode: 'Markdown' })
    }).then(function (response) {
      if (!response.ok) throw new Error('Telegram request failed: HTTP ' + response.status);
      return response.json();
    }).then(function (result) {
      if (!result.ok) throw new Error('Telegram rejected the message');
      return result;
    });
  };
})(window);
