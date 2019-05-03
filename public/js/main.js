const backdrop = document.querySelector('.backdrop');
const sideDrawer = document.querySelector('.mobile-nav');
const menuToggle = document.querySelector('#side-menu-toggle');

// const cards = document.querySelectorAll('.card');
const showFronts = document.querySelectorAll('#showFront');
const showBacks = document.querySelectorAll('#showBack');
const showEdits = document.querySelectorAll('#showEdit');
const showAdminCards = document.querySelectorAll('#showAdminCard');

function backdropClickHandler() {
  backdrop.style.display = 'none';
  sideDrawer.classList.remove('open');
}

function menuToggleClickHandler() {
  backdrop.style.display = 'block';
  sideDrawer.classList.add('open');
}

function transition() {
  // find closest to this element
  const card = this.closest('.card');
  if (card.classList.contains('activate')) {
    card.classList.remove('activate')
  } else {
    card.classList.add('activate');
  }
}

function edition() {
  const adminCard = this.closest('.adminCard');
  if (adminCard.classList.contains('activate')) {
    adminCard.classList.remove('activate')
  } else {
    adminCard.classList.add('activate');
  }
}

showBacks.forEach(showBack => {
  showBack.addEventListener('click', transition)
});

showFronts.forEach(showFront => {
  showFront.addEventListener('click', transition)
});

showEdits.forEach(showEdit => {
  showEdit.addEventListener('click', edition)
});

showAdminCards.forEach(showAdminCard => {
  showAdminCard.addEventListener('click', edition);
})
// cards.forEach(card => card.addEventListener('click', transition));

backdrop.addEventListener('click', backdropClickHandler);
menuToggle.addEventListener('click', menuToggleClickHandler);