'use strict';

const points = document.getElementsByClassName('point');
const stepsWrap = document.getElementsByClassName('steps-wrap')[0];
const stepOneElements = document.querySelectorAll('.step-one .element-wrap');
const steps = document.getElementsByClassName('step');
const forwardButtons = document.getElementsByClassName('btn-forward');
const backButtons = document.getElementsByClassName('btn-back');
const resetButton = document.querySelector('.btn-reset');
const pointMobileCurrent = document.querySelector('.point-mobile-current');
const pointsMobileList = document.querySelector('.points-mobile-list');
const pointsMobile = document.getElementsByClassName('point-mobile');
let index = 0;

function fieldHighlighting(field) {
    field.classList.add('error-field');
    field.addEventListener('focus', function(event) {
        event.currentTarget.classList.remove('error-field');
    });
}

function checkRequiredFields(step) {
    let requiredFields = step.querySelectorAll('input[required="required"]');
    for (let field of requiredFields) {
        if (field.value.trim() === '') {
            fieldHighlighting(field);
            return false;
        }
        if (field.classList.contains('custom-checkbox') && !field.checked) {
            fieldHighlighting(field);
            return false;
        }
    }

    return true;
}

function resetForm() {
    index = 0;
    for (let elem of stepOneElements) {
        elem.classList.remove('current');
    }
    nextStep();
}

function nextStep(direction) {
    if (direction === 'back' && index > 0) index--;
    if (direction === 'forward' && index < steps.length - 1) index++;

    for (let step of steps) {
        step.classList.add('hidden');
        step.classList.remove('active');
    }
    for (let point of points) {
        point.classList.remove('current');
    }
    for (let point of pointsMobile) {
        point.classList.remove('current');
    }

    steps[index].classList.remove('hidden');
    stepsWrap.style.height = `${steps[index].offsetHeight}px`;
    steps[index].classList.add('active');
    points[index].classList.add('current');
    pointsMobile[index].classList.add('current');
    pointMobileCurrent.textContent = points[index].textContent;
}

nextStep();

for (let btn of forwardButtons) {
    btn.addEventListener('click', (event) => {
        event.preventDefault();
        let step = event.currentTarget.parentElement.parentElement;
        checkRequiredFields(step) && nextStep('forward');
    }); 
}

for (let btn of backButtons) {
    btn.addEventListener('click', () => {
        nextStep('back');
    }); 
}

for (let elem of stepOneElements) {
    elem.addEventListener('click', () => {
        if (elem.querySelector('input[type="checkbox"]')) {
            elem.querySelector('input[type="checkbox"]').checked ? 
            elem.classList.add('current') :
            elem.classList.remove('current');
        }
    }); 
}

resetButton.addEventListener('click', resetForm); 

pointMobileCurrent.addEventListener('click', () => {
    if (pointsMobileList.classList.contains('hidden')) {
        pointsMobileList.classList.remove('hidden');
        pointsMobileList.classList.add('appear');
    } else {
        pointsMobileList.classList.add('hidden');
        pointsMobileList.classList.remove('appear');       
    }
});

window.addEventListener('resize', () => {
    stepsWrap.style.height = `${steps[index].offsetHeight}px`;
});
