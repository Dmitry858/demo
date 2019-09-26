const prop = ( data, name ) => data.map( item => item[ name ] ),
  summ = data => data.reduce(( total, value ) => total + value, 0 );

class SpriteGenerator {
  constructor( container ) {
    this.uploadButton = container.querySelector( '.sprite-generator__upload' );
    this.submitButton = container.querySelector( '.sprite-generator__generate' );
    this.clearButton = container.querySelector( '.sprite-generator__clear' );
    this.imagesCountContainer = container.querySelector( '.images__added-count-value' );
    this.codeContainer = container.querySelector( '.sprite-generator__code' );
    this.resultImage = container.querySelector( '.sprite-generator__result-image' );
    this.error = container.querySelector( '.error' );
    this.images = [];
    this.imagesRows = [];
    this.imagesCount = 0;
    this.maxImagesWidth = 0;
    this.maxImagesHeight = 0;
    this.registerEvents();
  }

  registerEvents() {
    this.uploadButton.setAttribute('accept', 'image/*');
    this.uploadButton.addEventListener('change', this.pushImages.bind(this));
    this.submitButton.addEventListener('click', this.spriteGenerate.bind(this));
    this.clearButton.addEventListener('click', this.clear.bind(this));
  }
  
  /* Очистка генератора */
  clear() {
    this.uploadButton.value = '';
    this.imagesCountContainer.textContent = '0';
    this.images = [];
    this.imagesRows = [];
    this.imagesCount = 0;
    this.maxImagesWidth = 0;
    this.maxImagesHeight = 0;
    document.querySelector('.sprite-generator__preview').innerHTML = '';
    this.codeContainer.value = '';
    this.codeContainer.setAttribute('readonly', '');
    if (document.querySelector('.sprite-generator__download')) {
      document.getElementById('generator').removeChild(document.querySelector('.sprite-generator__download'));
    }
    if (this.submitButton.classList.contains('disabled')) {
      this.submitButton.classList.remove('disabled');
      this.submitButton.removeAttribute('disabled');
    }
    if (!this.error.classList.contains('hidden')) {
      this.error.classList.add('hidden');
    }
  }

  /* Загрузка изображений */
  pushImages( event ) {
    if (!this.error.classList.contains('hidden')) {
      this.error.classList.add('hidden');
    }
    if (event.currentTarget.files.length > 81) {
      this.error.classList.remove('hidden');
      this.error.textContent = 'Ошибка! Количество загружаемых изображений превышает максимально допустимое';
      event.currentTarget.value = '';
      return;
    }
    for (let item of Array.from(event.currentTarget.files)) {
      if (item.size >= 30720) {
        this.error.classList.remove('hidden');
        this.error.textContent = 'Ошибка! Размер загружаемого изображения превышает 30 Кб';
        event.currentTarget.value = '';
        return;
      }
      this.images.push(item);
    }
    this.imagesCount = this.images.length;
    this.imagesCountContainer.textContent = this.imagesCount;
    
    /* Если загруженных изображений больше 5-ти */
    if (this.images.length > 5) {
      let colsNumber = Math.ceil(Math.sqrt(this.images.length));
      let rowsNumber;
      (this.images.length % colsNumber === 0) ?
      (rowsNumber = this.images.length / colsNumber) :
      (rowsNumber = Math.ceil(this.images.length / colsNumber));
      
      let imagesCopy = this.images.slice();
      if (this.imagesRows.length > 0) this.imagesRows = [];
      for (let i = 0; i < rowsNumber; i++) {
        (imagesCopy.length >= colsNumber) ?
        (this.imagesRows[i] = imagesCopy.splice(0, colsNumber)) :
        (this.imagesRows[i] = imagesCopy.splice(0));
      }
    }
  }

  /* Генерация спрайта */
  spriteGenerate() {
    const arrayForCanvas = [];
    /* Если загруженных изображений меньше или равно 5-ти */
    if (this.imagesRows.length === 0) {
      return new Promise(resolve => {
        for (let image of this.images) {
          let img = document.createElement('img');
          img.src = URL.createObjectURL(image);
          img.addEventListener('load', event => {
            arrayForCanvas.push(img);
            URL.revokeObjectURL(img.src);
            if (this.images.indexOf(image) === this.images.length - 1) {
              setTimeout(function() {
                resolve(arrayForCanvas);
              }, 400);
            }
          });
          img.classList.add('invisible');
          document.querySelector('.sprite-generator__preview').appendChild(img);
        }
      })
        .then( arrayForCanvas => {
          this.getSpriteSizes(arrayForCanvas);
          return arrayForCanvas;
        })
        .then( arrayForCanvas => { 
          this.getCSS(arrayForCanvas);
          return arrayForCanvas;
        })   
        .then( arrayForCanvas => { 
          this.canvasCreate(arrayForCanvas); 
        });
    }
    
    /* Если загруженных изображений больше 5-ти */
    if (this.imagesRows.length > 0) {
      return new Promise(resolve => {
        for (let row of this.imagesRows) {
          let i = this.imagesRows.indexOf(row);
          arrayForCanvas[i] = [];
          for (let image of row) {
            let img = document.createElement('img');
            img.src = URL.createObjectURL(image);
            img.addEventListener('load', event => {
              arrayForCanvas[i].push(img);
              URL.revokeObjectURL(img.src);
              if ((this.imagesRows.indexOf(row) === this.imagesRows.length - 1) && (row.indexOf(image) === row.length - 1)) {
                setTimeout(function() {
                  resolve(arrayForCanvas);
                }, 400);
              }
            });
            img.classList.add('invisible');
            document.querySelector('.sprite-generator__preview').appendChild(img);
          }
        }
      })
        .then( arrayForCanvas => {
          this.getSpriteSizes(arrayForCanvas);
          return arrayForCanvas;
        })
        .then( arrayForCanvas => { 
          this.getCSS(arrayForCanvas);
          return arrayForCanvas;
        })
        .then( arrayForCanvas => {
          this.canvasCreate(arrayForCanvas); 
        });
    }
  }

  /* Получение значений высоты и ширины для холоста */
  getSpriteSizes( arrayForCanvas ) {
    /* Если загруженных изображений меньше или равно 5-ти */
    if (this.imagesRows.length === 0) {
      arrayForCanvas.forEach((item) => {
        this.maxImagesWidth += item.offsetWidth;
        this.maxImagesHeight = Math.max(this.maxImagesHeight, item.offsetHeight);
      });
    }
    /* Если загруженных изображений больше 5-ти */
    if (this.imagesRows.length > 0) {
      for (let row of arrayForCanvas) {
        let maxRowWidth = 0,
            maxRowHeight = 0;
        row.forEach((item) => {
          maxRowWidth += item.offsetWidth;
          maxRowHeight = Math.max(maxRowHeight, item.offsetHeight);
        });
        this.maxImagesWidth = Math.max(this.maxImagesWidth, maxRowWidth);
        this.maxImagesHeight += maxRowHeight;
      }
    }
  }
  /* Получение CSS кода */
  getCSS( arrayForCanvas ) {
    this.codeContainer.value = '.icons \{\n \tdisplay: inline-block\;\n \tbackground-image: url\(img/sprite.png\)\;\n\}\n';
    
    /* Если загруженных изображений меньше или равно 5-ти */
    if (this.imagesRows.length === 0) {
      let posX = 0;
      arrayForCanvas.forEach((item) => {
        this.codeContainer.value += `.icon_${arrayForCanvas.indexOf(item) + 1} \{\n \tbackground-position: -${posX}px 0\;\n \twidth: ${item.offsetWidth}px\;\n \theight: ${item.offsetHeight}px\;\n\}\n`;
        posX += item.offsetWidth;
      });
    }

    /* Если загруженных изображений больше 5-ти */
    if (this.imagesRows.length > 0) {
      let posY = 0;
      for (let row of arrayForCanvas) {
        let posX = 0,
            maxRowHeight = 0;
        row.forEach((item) => {
          maxRowHeight = Math.max(maxRowHeight, item.offsetHeight);
          this.codeContainer.value += `.icon_${arrayForCanvas.indexOf(row) + 1}_${row.indexOf(item) + 1} \{\n \tbackground-position: -${posX}px -${posY}px\;\n \twidth: ${item.offsetWidth}px\;\n \theight: ${item.offsetHeight}px\;\n\}\n`;
          posX += item.offsetWidth;
        });
        posY += maxRowHeight;
      }
    }
    
    this.codeContainer.value = this.codeContainer.value.replace(/-0px/g, '0');
    this.codeContainer.removeAttribute('readonly');
  }

  /* Отрисовка изображений на холсте */
  canvasCreate( arrayForCanvas ) {
    const canvas = document.createElement('canvas'),
          ctx = canvas.getContext('2d');
    canvas.width = this.maxImagesWidth;
    canvas.height = this.maxImagesHeight;
    
    /* Если загруженных изображений меньше или равно 5-ти */
    if (this.imagesRows.length === 0) {
      let x = 0;
      return new Promise(resolve => {
        for (let image of arrayForCanvas) {
          ctx.drawImage(image, x, 0);
          x += image.offsetWidth;
          if (arrayForCanvas.indexOf(image) === arrayForCanvas.length - 1) {
            resolve(canvas);
          }
        }
      })
        .then( canvas => {
          this.getResultImage(canvas);
          return canvas;
        }) 
        .then( canvas => { 
          this.getButtonDownload(canvas.toDataURL());
          this.disableSubmitButton();
        });
    }
    
    /* Если загруженных изображений больше 5-ти */
    if (this.imagesRows.length > 0) {
      return new Promise(resolve => {
        let y = 0;
        for (let row of arrayForCanvas) {
          let x = 0,
              maxRowHeight = 0;
          for (let image of row) {
            ctx.drawImage(image, x, y);
            x += image.offsetWidth;
            maxRowHeight = Math.max(maxRowHeight, image.offsetHeight);
            if ((arrayForCanvas.indexOf(row) === arrayForCanvas.length - 1) && (row.indexOf(image) === row.length - 1)) {
              resolve(canvas);
            }
          }
          y += maxRowHeight;
        }
      })
        .then( canvas => {
          this.getResultImage(canvas);
          return canvas;
        }) 
        .then( canvas => { 
          this.getButtonDownload(canvas.toDataURL());
          this.disableSubmitButton();
        });
    }
  }

  /* Получение итогового изображения */
  getResultImage( canvas ) {
    this.resultImage.src = canvas.toDataURL();
    document.querySelector('.sprite-generator__preview').innerHTML = '';
    document.querySelector('.sprite-generator__preview').appendChild(this.resultImage); 
  }
  
  /* Вывод кнопки для скачивания полученного спрайта */
  getButtonDownload(url) {
    let button = document.createElement('a');
    button.classList.add('sprite-generator__download');
    button.href = url;
    button.download = 'sprite.png';
    button.textContent = 'Сохранить спрайт';
    document.getElementById('generator').appendChild(button);
  }
  
  /* Отключение кнопки "Сгенерировать спрайт" */
  disableSubmitButton() {
    this.submitButton.classList.add('disabled');
    this.submitButton.setAttribute('disabled', 'disabled');
  }
}

new SpriteGenerator( document.getElementById( 'generator' ));