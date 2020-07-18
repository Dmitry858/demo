window.addEventListener('load', function() {

    const cards      = document.querySelectorAll('.card:not(.disabled)'),
          legendText = cards[0].querySelector('.legend').textContent;

    for(let i = 0; i < cards.length; i++) {
        cards[i].addEventListener('click', function(event) {
            let item = event.currentTarget;
            item.classList.toggle('selected');
            if(item.classList.contains('selected')) {
                item.nextElementSibling.classList.add('hidden');
                item.nextElementSibling.nextElementSibling.classList.remove('hidden');
            } else {
                item.nextElementSibling.classList.remove('hidden');
                item.nextElementSibling.nextElementSibling.classList.add('hidden'); 
                item.querySelector('.legend').textContent = legendText;
                if(item.classList.contains('hover')) item.classList.remove('hover');              
            }
        });

        cards[i].addEventListener('mouseenter', function(event) {
            let item = event.currentTarget;
            if(item.classList.contains('selected')) {
                item.classList.add('hover');
                item.querySelector('.legend').textContent = 'Котэ не одобряет?';
            }
        });

        cards[i].addEventListener('mouseleave', function(event) {
            let item = event.currentTarget;
            if(item.classList.contains('selected') && item.classList.contains('hover')) {
                item.querySelector('.legend').textContent = legendText;
            }
            if(item.classList.contains('hover')) item.classList.remove('hover');
        });

        let buyLink = cards[i].nextElementSibling.querySelector('a');
        
        buyLink.addEventListener('click', function(event) {
            event.preventDefault();
            let link = event.currentTarget;
            link.parentElement.previousElementSibling.classList.add('selected');
            link.parentElement.classList.add('hidden');
            link.parentElement.nextElementSibling.classList.remove('hidden');
        });
    }

});