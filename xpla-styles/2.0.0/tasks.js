(function () {
  var currentTask = 0;
  var currentRanking = {};
  var sendDone = function () {};

  // Add embed class
  if (window.location.search.indexOf('embed') > 0) {
    var match = /task=(\d+)/.exec(window.location.search);
    var taskNo = match ? parseInt(match[1], 10) : null;
    createEmbedMode(taskNo);
  }

  // Functions
  function changeTask (no) {
    var newTask = no;
    var max = $$('section').length;
    if (newTask >= max) {
      newTask = max - 1;
    }

    function swapActive ($els) {
      if (!$els.length) {
        return;
      }
      $els[currentTask].classList.remove('active');
      $els[newTask].classList.add('active');
    }

    swapActive($$('section'));
    swapActive($$('.tasks-nav-item'));

    currentTask = newTask;

    // Fix Done button
    var navDone = $('.nav-done');
    if (navDone) {
      if (currentRanking[newTask] && currentRanking[newTask].isDone) {
        navDone.innerHTML = 'Mark As Not Done';
        navDone.classList.add('nav-done-muted');
      } else {
        navDone.innerHTML = 'Mark As Done';
        navDone.classList.remove('nav-done-muted');
      }
    }
  }

  function createEmbedMode (taskNo) {
    $('html').classList.add('embed');

    if (taskNo !== null) {
      changeTask(taskNo);
      return;
    }
    // Add navigation
    createEmbedNavigation();
    createEmbedUtils();
    createRankingListeners();
    // activate first section
    changeTask(0);
  }

  function createRankingListeners () {
    var parentIdx = window.location.search.indexOf('url=');
    var url = parentIdx !== -1 ? window.location.search.substr(parentIdx + 4) : window.location.toString();

    window.addEventListener('message', function (msg) {

      try {
        var rank = JSON.parse(msg.data);
        if (!rank || !rank.isRanking) {
          return;
        }
        currentRanking = rank;
      } catch (e) {
        console.warn(e, msg);
      }
      currentRanking = currentRanking || {};
      createEmbedNavigation();
    });

    sendDone = function (currentTask, isDone) {
      var msg = {
        currentTask: currentTask,
        isDone: isDone,
        noOfTasks: $$('section').length
      };
      currentRanking[currentRanking.iterationIdx + '_' + currentTask] = {
        isDone: isDone
      };
      createEmbedNavigation();
      window.parent.postMessage(JSON.stringify(msg), url);
    };
  }

  function getTitle ($s) {
    var check = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', '.title'];
    return check.reduce(function (found, sel) {
      if (found) {
        return found;
      }
      var h = $s.querySelector(sel);
      if (h) {
        return h.textContent;
      }
    }, false) || '';
  }

  function removePreviousNav () {
    var $x = $('nav.tasks-nav');
    if ($x) {
      $x.parentNode.removeChild($x);
    }
  }

  function createEmbedNavigation () {
    removePreviousNav();
    var $sections = $$('section');
    var $nav = $el('nav.tasks-nav');
    $('.container').appendChild($nav);

    [].map.call($sections, function ($s, idx) {

      var $li = $el('li.tasks-nav-item');
      var taskIdx = currentRanking.iterationIdx + '_' + idx;
      if (currentRanking[taskIdx] && currentRanking[taskIdx].isDone) {
        $li.classList.add('done');
      }
      var $item = $el('a');
      $li.appendChild($item);
      $item.addEventListener('click', changeTask.bind(null, idx));
      $item.title = getTitle($s);
      $item.innerHTML = '&lowast;';
      return $li;
    }).map(function ($el) {
      $nav.appendChild($el);
    });

    // Make sure that is marked active
    changeTask(currentTask);
  }

  function createEmbedUtils () {
    var $btnDone = $el('button.btn.btn-primary.btn-sm.nav-done');
    var $btnNewWindow = $el('a.btn.btn-link.btn-xs.nav-new-window');
    var $firstChild = $('.container > *:first-child');
    var $container = $('.container');
    $container.insertBefore($btnDone, $firstChild);
    $container.insertBefore($btnNewWindow, $firstChild);

    $btnDone.innerHTML = 'Done';

    $btnDone.addEventListener('click', function () {
      var taskIdx = currentRanking.iterationIdx + '_' + currentTask;
      var isDone = currentRanking[taskIdx] ? !currentRanking[taskIdx].isDone : true;
      try {
        sendDone(currentTask, isDone);
      } catch (e) {}

      if (!isDone) {
        return;
      }
    });

    $btnNewWindow.innerHTML = '&there4;';
    $btnNewWindow.title = 'Open In Separate Window';
    $btnNewWindow.target = '_blank';
    $btnNewWindow.href = window.location.toString().replace(/\?.*/, '');
  }

  // Utils
  function $ (sel) {
    return document.querySelector(sel);
  }

  function $$ (sel) {
    return document.querySelectorAll(sel);
  }

  function $el (name) {
    var parts = name.split('.');
    var tagName = parts[0];
    var el = document.createElement(tagName);
    el.className = parts.slice(1).join(' ');
    return el;
  }
}());
