/* === Общие переменные и функции === */
const wrapApp = document.querySelector('.app'),
      menu = wrapApp.querySelector('.menu'),
      menuItems = menu.querySelectorAll('li'),
      inputFile = menu.querySelector('input[type=file]'),
      currentImage = wrapApp.querySelector('.current-image'),
      error = wrapApp.querySelector('.error'),
      errorMessage = wrapApp.querySelector('.error__message'),
      imageLoader = wrapApp.querySelector('.image-loader'),
      burger = wrapApp.querySelector('.burger'),
      newFile = wrapApp.querySelector('.new'),
      share = wrapApp.querySelector('.share'),
      comments = wrapApp.querySelector('.comments'),
      draw = wrapApp.querySelector('.draw'),
      regExp = /\?id=([^&]+)/i;
      
let movedPiece = null,
    getId = '',
    shiftX,
    shiftY,
    menuWidth,
    imageStartCoord,
    startMenuWidth = menu.offsetWidth;

// Загрузка страницы
function onLoad() {
  menu.setAttribute('draggable', '');
  inputFile.addEventListener('change', handleFileChange);
  
  if (!regExp.test(document.location.href)) return;
  
  getId = regExp.exec(document.location.search)[1];
  imageLoader.classList.remove('invisible');

  fetch(`https://neto-api.herokuapp.com/pic/${getId}`)
    .then(res => {
      if (200 <= res.status && res.status < 300) {
        return res.json();
      }
      throw new Error(response.statusText);
    })
    .then(data => {
      imageLoader.classList.add('invisible');
      currentImage.src = data.url;
      sharingUrl.value = document.location.href;
      connectWs(getId);
      changeMenuView('comments');
    })
    .catch((err) => {
      console.log(`Возникла ошибка: ${error}`);
    });
}

// Перемещение блока меню
function dragStart(event) {
  movedPiece = event.target.parentElement;
  shiftX = event.pageX - event.target.getBoundingClientRect().left;
  shiftY = event.pageY - event.target.getBoundingClientRect().top;
}

function drag(event) {
  if (!movedPiece) return;
  
  let x = event.pageX - shiftX,
    y = event.pageY - shiftY,
    minX = document.body.offsetLeft,
    minY = document.body.offsetTop,
    maxX = document.body.offsetLeft + document.body.offsetWidth - movedPiece.offsetWidth - 1,
    maxY = document.body.offsetTop + document.body.offsetHeight - movedPiece.offsetHeight;

  x = Math.min(x, maxX);
  y = Math.min(y, maxY);
  x = Math.max(x, minX);
  y = Math.max(y, minY);
  movedPiece.style.left = `${x}px`;
  movedPiece.style.top = `${y}px`;
}

function drop() {
  movedPiece = null;
}

// Функция, контролирующая положение меню при ресайзе страницы и при переключении режимов
function menuPositionControl(mWidth) {
  if (typeof mWidth === 'number') {
      menu.style.width = mWidth + 'px';
  }
  if ((menu.getBoundingClientRect().right >= wrapApp.getBoundingClientRect().right) && (menu.offsetWidth < wrapApp.offsetWidth)) {
    let burgerStyle = getComputedStyle(menu.querySelector('.burger'));
    let shareStyle = getComputedStyle(menu.querySelector('.share'));
    if ((burgerStyle.getPropertyValue('display') === 'none') && (shareStyle.getPropertyValue('display') === 'none')) {
      menu.style.width = startMenuWidth + 'px';
    }
    menu.style.left = (wrapApp.getBoundingClientRect().right - menu.offsetWidth) + 'px';
  }
  if ((menu.getBoundingClientRect().bottom > wrapApp.getBoundingClientRect().bottom) && (menu.offsetHeight < wrapApp.offsetHeight)) {
    menu.style.top = (wrapApp.getBoundingClientRect().bottom - menu.offsetHeight) + 'px';
  }
}

// Функция, сохраняющая положение всех форм комментариев на холсте при ресайзе страницы
function saveCommentsPosition() {
  if (wrapApp.querySelector('.comments__form') === null) return;
  
  let shiftX = imageStartCoord[0] - currentImage.getBoundingClientRect().left;
  let shiftY = imageStartCoord[1] - currentImage.getBoundingClientRect().top;
  for (let item of wrapApp.getElementsByClassName('comments__form')) {
    item.style.left = (parseFloat(item.style.left) - shiftX) + 'px';
    item.style.top = (parseFloat(item.style.top) - shiftY) + 'px';
  }
  imageStartCoord = [currentImage.getBoundingClientRect().left, currentImage.getBoundingClientRect().top];
}

// Регистрация обработчиков событий
window.addEventListener('load', onLoad);
menu.querySelector('.drag').addEventListener('mousedown', dragStart);
document.addEventListener('mousemove', drag);  
document.addEventListener('mouseup', drop);
window.addEventListener('resize', menuPositionControl);
window.addEventListener('resize', saveCommentsPosition);

window.addEventListener('beforeunload', () => {
  if (connection === undefined) return;
  connection.onclose = function() {};
  connection.close(1000);
});

window.addEventListener('unload', () => {
  if (connection !== undefined && window.location.search === '') {
    window.location.href = window.location.href + '?id=' + getId;
  }
  if (window.location.search !== '' && sharingUrl.value !== window.location.href) {
    window.location.href = sharingUrl.value;
  }
});


/* === Режим "Публикация" === */
function newFileDownloader(event) {
  const newEvent = new MouseEvent(event.type, event);
  inputFile.dispatchEvent(newEvent);
}

function handleFileChange(event) {
  event.preventDefault();
  let file;
  // Если загружаем файл по клику на пункт меню "Загрузить новое"
  if (event.type === 'change') {
    file = event.currentTarget.files[0];
  }
  if (event.type === 'change' && connection !== undefined) {
    connection.onclose = function() {};
    connection.close(1000);
    connection = undefined;
    wsCounter = 0;
    if (wrapApp.querySelector('.mask') !== null) {
      wrapApp.removeChild(wrapApp.querySelector('.mask'));
    }
    if (wrapApp.querySelector('.comments__form') !== null) {
      for (let item of wrapApp.querySelectorAll('.comments__form')) {
        wrapApp.removeChild(item);
      }
    }
  }
  
  // Если загружаем файл, перетаскивая его в окно браузера
  if (event.type === 'drop' && connection === undefined) {
    file = event.dataTransfer.files[0];
  }
  if (event.type === 'drop' && connection !== undefined) {
    if (event.dataTransfer.files[0] === file) {
      return;
    }
    errorMessage.textContent = 'Чтобы загрузить новое изображение, пожалуйста, воспользуйтесь пунктом \"Загрузить новое\" в меню.';
    wrapApp.appendChild(error);
    error.classList.remove('invisible');
    setTimeout(() => {
      error.classList.add('invisible');
      wrapApp.insertBefore(error, imageLoader);
    }, 4000);
    return;
  }
  if (file === undefined) {
    return;
  }

  // Отправка файла на сервер и обработка ответа
  if (file.type === 'image/jpeg' || file.type === 'image/png') {
    error.classList.add('invisible');
    imageLoader.classList.remove('invisible');

    const form = new FormData();
    form.append('title', file.name);
    form.append('image', file);

    fetch('https://neto-api.herokuapp.com/pic', {
      body: form,
      method: 'POST'
    })
      .then(res => {
        if (200 <= res.status && res.status < 300) {
          return res.json();
        }
        throw new Error(res.statusText);
      })
      .then(data => {
        getId = data.id;
        imageLoader.classList.add('invisible');
        currentImage.src = data.url;
        if (regExp.test(document.location.href)) {
          sharingUrl.value = document.location.href.replace(document.location.search, '') + '?id=' + data.id;
        } else {
          sharingUrl.value = document.location.href + '?id=' + data.id;
        }
        changeMenuView('share');
        menuWidth = 2;
        for (let li of menu.querySelectorAll('li')) {
          if (!(li.classList.contains('invisible'))) {
            menuWidth += li.offsetWidth;  
          }
        };
        menuPositionControl(menuWidth);
        connectWs(getId);
      })
      .catch(error => {
        imageLoader.classList.add('invisible');
        console.log(`Возникла ошибка: ${error}`);
      })
  } else {
    imageLoader.classList.add('invisible');
    errorMessage.textContent = 'Неверный формат файла. Пожалуйста, выберите изображение в формате .jpg или .png.';
    error.classList.remove('invisible');
  }
}

// Регистрация обработчиков событий
newFile.addEventListener('click', newFileDownloader);
document.addEventListener('dragover', event => {
  event.preventDefault();
});
document.addEventListener('drop', handleFileChange);


/* === Режим "Поделиться" === */
const sharingUrl = wrapApp.querySelector('.menu__url'),
      linkCopy = wrapApp.querySelector('.menu_copy');

function getLinkCopy() {
  sharingUrl.select();
  document.execCommand('copy');
}
// Регистрация обработчика события
linkCopy.addEventListener('click', getLinkCopy);


/* === Режим "Комментирование" === */
const commentsLoader = wrapApp.querySelector('.comment .loader'),
      commentsOn = document.getElementById('comments-on'),
      commentsOff = document.getElementById('comments-off');

// Отключение возможности свернуть форму без комментариев
function hidingFormDisable(event) {
  event.target.checked = true;
}

// Функция, создающая сниппет формы комментариев
function getCommentsFormSnippet() {
  let form = document.createElement('form');
  form.classList.add('comments__form');

  let span = document.createElement('span');
  span.classList.add('comments__marker');
  form.appendChild(span);

  let input = document.createElement('input');
  input.classList.add('comments__marker-checkbox');
  input.setAttribute('type', 'checkbox');
  form.appendChild(input);
  input.addEventListener('click', () => {
    if (form.querySelector('.comments__marker-checkbox').checked) {
      wrapApp.appendChild(form);
    }
  });

  let div = document.createElement('div');
  div.classList.add('comments__body');

  let comment = document.createElement('div');
  comment.classList.add('comment');
  let loader = document.createElement('div');
  loader.classList.add('loader');
  for (let i = 0; i < 5; i++) {
    let span = document.createElement('span');
    loader.appendChild(span);
  }
  comment.appendChild(loader);
  div.appendChild(comment);
  comment.classList.add('invisible');

  let textarea = document.createElement('textarea');
  textarea.classList.add('comments__input');
  textarea.setAttribute('type', 'text');
  textarea.setAttribute('placeholder', 'Напишите ответ...');
  div.appendChild(textarea);

  input = document.createElement('input');
  input.classList.add('comments__close');
  input.setAttribute('type', 'button');
  input.setAttribute('value', 'Закрыть');
  input.addEventListener('click', event => {
    if (event.target.parentElement.querySelector('.comment__message') !== null) {
      form.querySelector('.comments__marker-checkbox').checked = false;
    } else {
      wrapApp.removeChild(form);
    }
  });
  div.appendChild(input);

  input = document.createElement('input');
  input.classList.add('comments__submit');
  input.setAttribute('type', 'submit');
  input.setAttribute('value', 'Отправить');
  input.addEventListener('click', sendComment);
  div.appendChild(input);

  form.appendChild(div);
  return form;
}

// Функция, создающая сниппет комментария
function getCommentSnippet(timestamp, mes) {
  let comment = document.createElement('div');
  comment.classList.add('comment');
  let time = document.createElement('p');
  time.classList.add('comment__time');
  time.textContent = timestamp.toLocaleString('ru');
  let message = document.createElement('p');
  message.classList.add('comment__message');
  
  let regExpMes = /\n/ig;
  if(regExpMes.test(mes)) {
    const textArray = mes.split('\n');
    const textNode = textArray.reduce((emptyElement, element) => {
      emptyElement.appendChild(document.createTextNode(element));
      emptyElement.appendChild(document.createElement('br'));
      return emptyElement;
    }, document.createDocumentFragment());
    message.appendChild(textNode);      
  } else {
    message.textContent = mes;
  }

  comment.appendChild(time);
  comment.appendChild(message);
  return comment;
}

// Добавление нового комментария
function addComment(event) {
  removeEmptyForm();
  hideCommentsBody();
  let form = getCommentsFormSnippet();
  wrapApp.appendChild(form);
  let marker = form.querySelector('.comments__marker'),
      markerCheckbox = form.querySelector('.comments__marker-checkbox');
  form.style.left = (event.pageX - marker.offsetWidth / 2) + 'px';
  form.style.top = (event.pageY - marker.offsetHeight / 2) + 'px';
  markerCheckbox.checked = true;
  markerCheckbox.addEventListener('click', hidingFormDisable);
}

// Скрытие всех неактивных форм комментариев
function hideCommentsBody(currentInput) {
  let markers = wrapApp.querySelectorAll('.comments__marker-checkbox');
  for (let marker of markers) {
    if (marker !== currentInput) {
      marker.checked = false;
    }
  }
}

// Удаление с холста пустой формы комментариев
function removeEmptyForm() {
  for (let item of wrapApp.getElementsByClassName('comments__form')) {
    if (item.querySelector('.comment__message') === null) {
      wrapApp.removeChild(item);
    }
  }
}

// Отправка на сервер нового комментария
function sendComment(event) {
  event.preventDefault();
  let formBody = event.currentTarget.parentElement;
  let message = formBody.querySelector('.comments__input').value;
  let left = formBody.previousElementSibling.getBoundingClientRect().left - currentImage.getBoundingClientRect().left;
  let top = formBody.previousElementSibling.getBoundingClientRect().top - currentImage.getBoundingClientRect().top;
  if (message === '') return;
  let loader = formBody.querySelector('.loader');
  loader.parentElement.classList.remove('invisible');

  fetch(`https://neto-api.herokuapp.com/pic/${getId}/comments`, {
    body: `message=${message}&left=${left}&top=${top}`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  })
    .then(res => {
      if (200 <= res.status && res.status < 300) {
        return res.json();
      }
      throw new Error(res.statusText);
    })
    .then(data => {
      formBody.querySelector('textarea').value = '';
    })
    .catch(error => {
      console.log(`Возникла ошибка: ${error}`);
    })
}

// Отображение на холсте маркеров форм комментариев
function showComments(event) {
  event.stopPropagation();
  let comments = wrapApp.getElementsByClassName('comments__form');
  for(let comment of comments) {
    comment.classList.remove('invisible');
  }
}

// Скрытие маркеров форм комментариев
function hideComments(event) {
  event.stopPropagation();
  let comments = wrapApp.getElementsByClassName('comments__form');
  for(let comment of comments) {
    comment.classList.add('invisible');
  }
}

// Функция, проверяющая наличие формы комментариев в указанных координатах
function checkExistingForms(left, top) {
  let allForms = wrapApp.getElementsByClassName('comments__form');
  for (let item of allForms) {
    let itemLeft, itemTop;
    if ((parseInt(item.style.left) - currentImage.getBoundingClientRect().left) > (left - 10) && (parseInt(item.style.left) - currentImage.getBoundingClientRect().left) < (left + 10)) {
      itemLeft = true;
    } else {
      itemLeft = false;
    }
    if ((parseInt(item.style.top) - currentImage.getBoundingClientRect().top) > (top - 10) && (parseInt(item.style.top) - currentImage.getBoundingClientRect().top) < (top + 10)) {
      itemTop = true;
    } else {
      itemTop = false;
    }
    if (itemLeft === true && itemTop === true) {
      return item;
    }
  }
}

// Регистрация обработчиков событий
commentsOn.addEventListener('click', showComments);
commentsOff.addEventListener('click', hideComments);
function toggleAddComments(toggle) {
  if (toggle === 'on') {
    currentImage.addEventListener('click', addComment);
  }
  if (toggle === 'off') {
    currentImage.removeEventListener('click', addComment);
  }
}


/* === Режим "Рисование" === */
const colorInputs = wrapApp.querySelectorAll('.menu__color');
let canvas,
    ctx,
    curves = [],
    drawing = false,
    needsRepaint = false,
    lineColor = '#6cbe47';

function sendImgForMask(canvas) {
  drawing = false;
  canvas.toBlob(snapshot => {
    connection.send(snapshot);
  });
}

function debounce(callback, delay) {
  let timeout;
  return () => {
    clearTimeout(timeout);
    timeout = setTimeout(function() {
      timeout = null;
      callback();
    }, delay);
  };
};

function beginDrawing(event) {
  drawing = true;
  let color = lineColor;
  const curve = []; 
  curve.push([event.offsetX, event.offsetY, color]); 
  curves.push(curve); 
  needsRepaint = true;
}

function continueDrawing(event) {
  if (!drawing) return;
  let color = lineColor;
  const point = [event.offsetX, event.offsetY, color];
  curves[curves.length - 1].push(point);
  needsRepaint = true;
}

function endDrawing() {
  drawing = false;
}

function circle(point) {
  ctx.beginPath();
  ctx.fillStyle = point[2];
  ctx.arc(point[0], point[1], 2, 0, 2 * Math.PI);
  ctx.fill();
}

function smoothCurveBetween (p1, p2) {
  const p1_inner = [p1[0], p1[1]];
  const p2_inner = [p2[0], p2[1]];
  const cp = p1_inner.map((coord, idx) => (coord + p2_inner[idx]) / 2);
  ctx.quadraticCurveTo(...p1_inner, ...cp);
}

function smoothCurve(points) {
  ctx.beginPath();
  ctx.strokeStyle = points[0][2];
  ctx.lineWidth = 4;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  ctx.moveTo(points[0][0], points[0][1]);

  for(let i = 1; i < points.length - 1; i++) {
    smoothCurveBetween(points[i], points[i + 1]);
  }

  ctx.stroke();
}

function repaint () {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  curves
    .forEach((curve) => {
      circle(curve[0]);
      smoothCurve(curve);
    });
}

function tick () {
  if(needsRepaint) {
    repaint();
    needsRepaint = false;
  }
  window.requestAnimationFrame(tick);
}

tick();

// Регистрация обработчиков событий
function toggleDrawing(toggle, canvas, ctx) {
  if (toggle === 'on') {
    canvas.addEventListener("mousedown", beginDrawing);
    canvas.addEventListener("mouseup", endDrawing);
    canvas.addEventListener("mouseup", debounce(() => {
      sendImgForMask(canvas);
      curves = [];
    }, 2000));
    canvas.addEventListener("mouseleave", endDrawing);
    canvas.addEventListener("mousemove", continueDrawing);
  }

  if (toggle === 'off' && canvas !== null) {
    canvas.removeEventListener("mousedown", beginDrawing);
    canvas.removeEventListener("mouseup", endDrawing);
    canvas.removeEventListener("mouseup", debounce(() => {
      sendImgForMask(canvas);
      curves = [];
    }, 2000));
    canvas.removeEventListener("mouseleave", endDrawing);
    canvas.removeEventListener("mousemove", continueDrawing);

    if (wrapApp.querySelector('canvas') === null) return;
    wrapApp.removeChild(wrapApp.querySelector('canvas'));
    canvas = undefined;
  }
}

for (let input of colorInputs) {
  input.addEventListener('click', event => {
    lineColor = event.target.value;
  });
}


/* === Переключение режимов === */
function changeMenuView(view = 'select') {
  if (view === 'select') {
    menuWidth = 3;
    for (let item of menuItems) {
      if (!(item.classList.contains('drag')) && !(item.classList.contains('new')) && !(item.classList.contains('comments')) && !(item.classList.contains('draw')) && !(item.classList.contains('share'))) {
        item.classList.add('invisible');
      } else {
        item.classList.remove('invisible');
        menuWidth += item.offsetWidth;
      }
    }
    menuPositionControl(menuWidth);
    toggleAddComments('off');
    if (canvas !== undefined) {
      toggleDrawing('off', canvas, ctx);
    }
  }

  if (view === 'share') {
    menuWidth = 3.5;
    for (let item of menuItems) {
      if (!(item.classList.contains('drag')) && !(item.classList.contains('burger')) && !(item.classList.contains('share')) && !(item.classList.contains('share-tools'))) {
        item.classList.add('invisible');
      } else {
        item.classList.remove('invisible');
        menuWidth += item.offsetWidth;
      }
    }
    menuPositionControl(menuWidth);
    toggleAddComments('off');
    if (canvas !== undefined) {
      toggleDrawing('off', canvas, ctx);
    }
  }

  if (view === 'comments') {
    menuWidth = 3;
    for (let item of menuItems) {
      if (!(item.classList.contains('drag')) && !(item.classList.contains('burger')) && !(item.classList.contains('comments')) && !(item.classList.contains('comments-tools'))) {
        item.classList.add('invisible');
      } else {
        item.classList.remove('invisible');
        menuWidth += item.offsetWidth;
      }
    }
    menuPositionControl(menuWidth);
    toggleAddComments('on');
    if (canvas !== undefined) {
      toggleDrawing('off', canvas, ctx);
    }
  }

  if (view === 'draw') {
    menuWidth = 3;
    for (let item of menuItems) {
      if (!(item.classList.contains('drag')) && !(item.classList.contains('burger')) && !(item.classList.contains('draw')) && !(item.classList.contains('draw-tools'))) {
        item.classList.add('invisible');
      } else {
        item.classList.remove('invisible');
        menuWidth += item.offsetWidth;
      }
    }
    for (let input of colorInputs) {
      if (input.checked) {
        lineColor = input.value;
      }
    }

    canvas = document.createElement('canvas');
    canvas.classList.add('current-image');
    canvas.setAttribute('style', 'box-shadow: none;');
    canvas.setAttribute('width', currentImage.offsetWidth);
    canvas.setAttribute('height', currentImage.offsetHeight);
    wrapApp.insertBefore(canvas, error);
    ctx = canvas.getContext("2d");

    menuPositionControl(menuWidth);
    toggleAddComments('off');
    toggleDrawing('on', canvas, ctx);
  }
}

// Регистрация обработчиков событий
burger.addEventListener('click', () => {
  return changeMenuView('select');
});

share.addEventListener('click', () => {
  return changeMenuView('share');
});

comments.addEventListener('click', () => {
  return changeMenuView('comments');
});

draw.addEventListener('click', () => {
  return changeMenuView('draw');
});


/* === Взаимодействие с сервером через веб-сокет === */
let connection,
    wsCounter = 0;
    
function connectWs(id) {
  if (connection !== undefined) return;
  
  connection = new WebSocket(`wss://neto-api.herokuapp.com/pic/${id}`);
  wsCounter++;

  connection.addEventListener('message', event => {
    if (typeof event.data !== 'string') return; 
    wsDataHandler(JSON.parse(event.data));
  });

  connection.addEventListener('error', error => {
    console.log(`Произошла ошибка: ${error.data}`);
  });
}

/* === Обработка данных от сервера, полученных через веб-сокетное соединение === */
function wsDataHandler(data) {
  if (data.event === 'pic') {  
    imageStartCoord = [currentImage.getBoundingClientRect().left, currentImage.getBoundingClientRect().top]; 
    if (data.pic.mask !== undefined) {
      if (wrapApp.querySelector('.mask') !== null) {
        wrapApp.removeChild(wrapApp.querySelector('.mask'));
      }
      const mask = document.createElement('img');   
      mask.classList.add('current-image');
      mask.classList.add('mask');
      mask.setAttribute('style', 'box-shadow: none; pointer-events: none;');
      mask.src = data.pic.mask;
      wrapApp.insertBefore(mask, currentImage.nextSibling);
    }

    if (wsCounter === 1) {
      for (key in data.pic.comments) {
        const timestamp = new Date(data.pic.comments[key].timestamp);
        let comment = getCommentSnippet(timestamp, data.pic.comments[key].message);

        let existingForm = checkExistingForms(data.pic.comments[key].left, data.pic.comments[key].top);
        if (existingForm !== undefined) {
          existingForm.querySelector('.comments__body').insertBefore(comment, existingForm.querySelector('.loader').parentElement);
        } else {
          let form = getCommentsFormSnippet();
          form.querySelector('.comments__body').insertBefore(comment, form.querySelector('.loader').parentElement);
          wrapApp.appendChild(form);
          form.style.left = currentImage.getBoundingClientRect().left + (data.pic.comments[key].left - 8) + 'px';
          form.style.top = currentImage.getBoundingClientRect().top + (data.pic.comments[key].top + 10) + 'px';
          form.querySelector('.comments__marker-checkbox').addEventListener('click', event => {
            event.stopPropagation();
            removeEmptyForm();
            hideCommentsBody(event.target);
          });
        }   
      }
    }
  }

  if (data.event === 'comment') {
    const timestamp = new Date(data.comment.timestamp);
    let comment = getCommentSnippet(timestamp, data.comment.message),
        existingForm = checkExistingForms(data.comment.left, data.comment.top);
    
    if (existingForm !== undefined) {
      let loader = existingForm.querySelector('.loader'),
          markerCheckbox = existingForm.querySelector('.comments__marker-checkbox');
      loader.parentElement.classList.add('invisible');
      existingForm.querySelector('.comments__body').insertBefore(comment, loader.parentElement);
      markerCheckbox.removeEventListener('click', hidingFormDisable);
      markerCheckbox.addEventListener('click', event => {
        event.stopPropagation();
        removeEmptyForm();
        hideCommentsBody(event.target);
      });      
    } else {
      let form = getCommentsFormSnippet();
      form.querySelector('.comments__body').insertBefore(comment, form.querySelector('.loader').parentElement);
      wrapApp.appendChild(form);
      form.style.left = currentImage.getBoundingClientRect().left + (data.comment.left - 8) + 'px';
      form.style.top = currentImage.getBoundingClientRect().top + (data.comment.top + 10) + 'px';
      form.querySelector('.comments__marker-checkbox').addEventListener('click', event => {
        event.stopPropagation();
        removeEmptyForm();
        hideCommentsBody(event.target);
      });
      if (commentsOff.checked) {
        form.classList.add('invisible');
      }
    }
  }
  
  if (data.event === 'mask' && wsCounter === 1) {
    connection.onclose = function() {};
    connection.close(1000);
    connection = undefined;
    connectWs(getId);
  }

  if (data.event === 'mask' && wsCounter === 2) {
    let mask = wrapApp.querySelector('.mask');
    if (mask !== null) {
      mask.src = data.url;
    }
  }

  if (data.event === 'error') {
    console.log(data.message);
  }
}
